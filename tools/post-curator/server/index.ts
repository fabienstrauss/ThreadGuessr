import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { RedditService } from './reddit-service.js';
import { WhitelistEntry, CurationCandidate, SeedItem, CurationDecision } from '../src/types.js';

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const redditService = new RedditService();
let currentBatch: CurationCandidate[] = [];
let approvedSeeds: SeedItem[] = [];
let currentBatchIndex = 0;

// Load whitelist from main app
async function loadWhitelist(): Promise<WhitelistEntry[]> {
  try {
    const whitelistPath = path.join(__dirname, '../../../src/data/whitelist.json');
    const whitelistData = await fs.readFile(whitelistPath, 'utf-8');
    return JSON.parse(whitelistData);
  } catch (error) {
    console.error('Error loading whitelist:', error);
    return [];
  }
}

// Load existing seeds to avoid duplicates
async function loadExistingSeeds(): Promise<string[]> {
  try {
    const seedsPath = path.join(__dirname, '../../../src/data/seeds.json');
    const seedsData = await fs.readFile(seedsPath, 'utf-8');
    const seeds = JSON.parse(seedsData);
    const existingPostIds = seeds.map((seed: any) => seed.sourcePostId).filter(Boolean);
    console.log(`📋 Loaded ${existingPostIds.length} existing post IDs to avoid duplicates`);
    return existingPostIds;
  } catch (error) {
    console.log('No existing seeds found or error loading:', error);
    return [];
  }
}

// Also track posts from current session to avoid showing rejected ones again
let sessionSeenPostIds = new Set<string>();

// API Endpoints

// Test Reddit connection
app.get('/api/test-reddit', async (req, res) => {
  try {
    const result = await redditService.testConnection();
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully connected to Reddit as u/${result.username}`,
        username: result.username
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to connect to Reddit. Check your credentials.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test Reddit connection'
    });
  }
});

// Get a new batch of posts for curation
app.get('/api/batch', async (req, res) => {
  try {
    console.log('🚀 Fast fetching new batch of posts...');

    // Load existing post IDs to avoid duplicates
    const existingPostIds = await loadExistingSeeds();
    const allSeenIds = new Set([...existingPostIds, ...sessionSeenPostIds]);

    console.log(`🔍 Will filter out ${allSeenIds.size} already seen posts (${existingPostIds.length} existing + ${sessionSeenPostIds.size} from this session)`);

    // Pass the seen IDs to the Reddit service for filtering (reduced count for maximum variety)
    currentBatch = await redditService.fetchRandomPosts(25, allSeenIds);
    currentBatchIndex = 0;

    // Add these new post IDs to session tracking
    currentBatch.forEach(candidate => {
      sessionSeenPostIds.add(candidate.redditPost.id);
    });

    console.log(`✅ Got ${currentBatch.length} new posts (filtered out duplicates)`);

    res.json({
      batch: currentBatch,
      totalCount: currentBatch.length,
      currentIndex: 0,
      filteredOut: allSeenIds.size
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get current post for curation
app.get('/api/current', (req, res) => {
  if (currentBatchIndex >= currentBatch.length) {
    return res.json({ finished: true, message: 'Batch completed!' });
  }

  res.json({
    candidate: currentBatch[currentBatchIndex],
    index: currentBatchIndex,
    total: currentBatch.length,
    remaining: currentBatch.length - currentBatchIndex
  });
});

// Submit curation decision
app.post('/api/curate', async (req, res) => {
  try {
    const { decision }: { decision: CurationDecision } = req.body;

    if (currentBatchIndex >= currentBatch.length) {
      return res.status(400).json({ error: 'No more posts in current batch' });
    }

    const candidate = currentBatch[currentBatchIndex];

    if (decision === 'approve') {
      // Create approved seed with proper structure
      const seed: SeedItem = {
        id: `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...candidate.proposedSeed,
        status: 'approved',
        addedAt: Date.now(),
        approvedAt: Date.now(),
        approvedBy: 'curator-tool'
      };

      approvedSeeds.push(seed);
      console.log(`✅ Approved: ${seed.title} (r/${seed.answerSub})`);
    } else if (decision === 'reject') {
      console.log(`❌ Rejected: ${candidate.redditPost.title} (r/${candidate.redditPost.subreddit})`);
    } else {
      console.log(`⏭️  Skipped: ${candidate.redditPost.title} (r/${candidate.redditPost.subreddit})`);
    }

    currentBatchIndex++;

    res.json({
      success: true,
      decision,
      nextIndex: currentBatchIndex,
      approvedCount: approvedSeeds.length,
      finished: currentBatchIndex >= currentBatch.length
    });
  } catch (error) {
    console.error('Error processing curation decision:', error);
    res.status(500).json({ error: 'Failed to process decision' });
  }
});

// Get curation stats
app.get('/api/stats', (req, res) => {
  res.json({
    currentBatch: {
      total: currentBatch.length,
      current: currentBatchIndex,
      remaining: currentBatch.length - currentBatchIndex
    },
    approved: approvedSeeds.length,
    session: {
      startTime: new Date().toISOString(),
      approvedInSession: approvedSeeds.length,
      seenPosts: sessionSeenPostIds.size
    },
    duplicateFiltering: {
      sessionSeenPosts: sessionSeenPostIds.size,
      message: 'Posts seen this session will not be shown again'
    }
  });
});

// Export approved seeds to JSON
app.post('/api/export', async (req, res) => {
  try {
    if (approvedSeeds.length === 0) {
      return res.status(400).json({ error: 'No approved seeds to export' });
    }

    // Create export file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(__dirname, `../output/approved-seeds-${timestamp}.json`);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(exportPath), { recursive: true });

    await fs.writeFile(exportPath, JSON.stringify(approvedSeeds, null, 2));

    console.log(`📄 Exported ${approvedSeeds.length} seeds to ${exportPath}`);

    res.json({
      success: true,
      count: approvedSeeds.length,
      filePath: exportPath,
      seeds: approvedSeeds
    });
  } catch (error) {
    console.error('Error exporting seeds:', error);
    res.status(500).json({ error: 'Failed to export seeds' });
  }
});

// Clear current session
app.post('/api/clear', (req, res) => {
  currentBatch = [];
  approvedSeeds = [];
  currentBatchIndex = 0;
  sessionSeenPostIds.clear(); // Also clear the session tracking

  console.log('🧹 Session cleared - reset seen posts tracking');
  res.json({ success: true, message: 'Session cleared' });
});

// Initialize server
async function startServer() {
  try {
    console.log('🔧 Initializing Post Curator...');

    const whitelist = await loadWhitelist();
    if (whitelist.length === 0) {
      throw new Error('No whitelist found! Make sure the main app whitelist.json exists.');
    }

    redditService.loadWhitelist(whitelist);

    app.listen(port, () => {
      console.log(`🚀 Post Curator server running on http://localhost:${port}`);
      console.log(`📋 Loaded ${whitelist.length} whitelisted subreddits`);
      console.log(`\n🎯 Ready to curate posts! Visit the frontend to get started.`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
