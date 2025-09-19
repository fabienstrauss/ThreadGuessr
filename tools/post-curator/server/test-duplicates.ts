// Test duplicate filtering
import dotenv from 'dotenv';
import { RedditService } from './reddit-service.js';

dotenv.config();

async function testDuplicateFiltering() {
  console.log('🧪 Testing duplicate post filtering...');

  try {
    const redditService = new RedditService();

    // Test connection first
    const connectionTest = await redditService.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Reddit connection failed: ${connectionTest.error}`);
    }
    console.log(`✅ Connected as: ${connectionTest.username}`);

    // Load a small whitelist for testing
    const testWhitelist = [
      { name: 'earthporn', group: 'nature', tags: ['photography', 'landscape'], sfw: true },
      { name: 'cozyplaces', group: 'lifestyle', tags: ['interior', 'comfort'], sfw: true },
      { name: 'mildlyinteresting', group: 'interesting', tags: ['interesting', 'photos'], sfw: true }
    ];

    redditService.loadWhitelist(testWhitelist);

    console.log('\n🔍 Fetching first batch (no duplicates to filter)...');
    const firstBatch = await redditService.fetchRandomPosts(10);
    console.log(`✅ First batch: ${firstBatch.length} posts`);

    // Create a set of seen post IDs from the first batch
    const seenIds = new Set(firstBatch.map(c => c.redditPost.id));
    console.log(`📋 Tracking ${seenIds.size} post IDs: ${Array.from(seenIds).slice(0, 3).join(', ')}...`);

    console.log('\n🔍 Fetching second batch (should filter out duplicates)...');
    const secondBatch = await redditService.fetchRandomPosts(10, seenIds);
    console.log(`✅ Second batch: ${secondBatch.length} posts`);

    // Check for any overlapping IDs (should be zero)
    const secondBatchIds = new Set(secondBatch.map(c => c.redditPost.id));
    const overlap = Array.from(seenIds).filter(id => secondBatchIds.has(id));

    if (overlap.length === 0) {
      console.log(`🎉 SUCCESS: No duplicate posts found between batches!`);
    } else {
      console.log(`❌ FAILED: Found ${overlap.length} duplicate posts: ${overlap.join(', ')}`);
    }

    console.log('\n📊 Summary:');
    console.log(`   First batch:  ${firstBatch.length} posts`);
    console.log(`   Second batch: ${secondBatch.length} posts`);
    console.log(`   Duplicates:   ${overlap.length} posts`);
    console.log(`   Total unique: ${firstBatch.length + secondBatch.length} posts`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDuplicateFiltering();