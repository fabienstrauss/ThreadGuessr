// Test the fixed iteration approach
import dotenv from 'dotenv';
import { RedditService } from './reddit-service.js';

dotenv.config();

async function testIteration() {
  console.log('🧪 Testing fixed Reddit iteration...');

  try {
    const redditService = new RedditService();

    // Test connection first
    const connectionTest = await redditService.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Reddit connection failed: ${connectionTest.error}`);
    }
    console.log(`✅ Connected as: ${connectionTest.username}`);

    // Load a variety of subreddits for testing
    const testWhitelist = [
      { name: 'earthporn', group: 'nature', tags: ['photography', 'landscape'], sfw: true },
      { name: 'cozyplaces', group: 'lifestyle', tags: ['interior', 'comfort'], sfw: true },
      { name: 'mildlyinteresting', group: 'interesting', tags: ['interesting', 'photos'], sfw: true },
      { name: 'pics', group: 'general', tags: ['photos', 'images'], sfw: true },
      { name: 'aww', group: 'animals', tags: ['cute', 'animals'], sfw: true }
    ];

    redditService.loadWhitelist(testWhitelist);

    // Test fetching with maximum variety approach
    console.log('\n🎯 Testing MAXIMUM VARIETY post fetching...');
    const start = Date.now();
    const candidates = await redditService.fetchRandomPosts(15); // Smaller batch, each from different subreddit
    const duration = Date.now() - start;

    console.log(`\n🎉 Success! Found ${candidates.length} candidates in ${duration}ms (${(duration/1000).toFixed(1)}s):`);
    console.log(`📊 Speed: ${(candidates.length / (duration/1000)).toFixed(1)} posts/second\n`);

    // Show variety - each post should be from a different subreddit
    candidates.forEach((candidate, index) => {
      console.log(`${index + 1}. r/${candidate.redditPost.subreddit}: "${candidate.redditPost.title.substring(0, 50)}..."`);
    });

    // Check if all subreddits are unique
    const subreddits = candidates.map(c => c.redditPost.subreddit);
    const uniqueSubreddits = new Set(subreddits);

    console.log(`\n🎯 Variety Check:`);
    console.log(`   Total posts: ${candidates.length}`);
    console.log(`   Unique subreddits: ${uniqueSubreddits.size}`);
    console.log(`   Duplicates: ${candidates.length - uniqueSubreddits.size}`);

    if (uniqueSubreddits.size === candidates.length) {
      console.log(`   ✅ PERFECT! Every post is from a different subreddit!`);
    } else {
      console.log(`   ⚠️  Some subreddits appear multiple times`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testIteration();