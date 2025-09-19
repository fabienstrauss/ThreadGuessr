// Simple Reddit API test
import dotenv from 'dotenv';
import Snoowrap from 'snoowrap';

dotenv.config();

async function simpleTest() {
  console.log('🔧 Testing Reddit API...');

  try {
    // Check environment variables
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET ||
        !process.env.REDDIT_USERNAME || !process.env.REDDIT_PASSWORD) {
      throw new Error('Missing required environment variables');
    }

    const reddit = new Snoowrap({
      userAgent: 'ThreadGuessr Test v1.0.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD
    });

    // Test 1: Authentication
    console.log('1. Testing authentication...');
    const me = await reddit.getMe();
    console.log(`✅ Authenticated as: ${me.name}`);

    // Test 2: Simple subreddit access
    console.log('2. Testing subreddit access...');
    const testSub = await reddit.getSubreddit('earthporn');
    console.log(`✅ Accessed r/earthporn`);

    // Test 3: Fetch a small number of posts safely
    console.log('3. Testing post fetching...');
    const posts = await testSub.getHot({ limit: 5 });

    // Get the first few posts without iteration issues
    const firstPost = await posts[0];
    console.log(`✅ Got first post: "${firstPost.title.substring(0, 50)}..."`);
    console.log(`   Score: ${firstPost.score}, URL: ${firstPost.url}`);

    const secondPost = await posts[1];
    console.log(`✅ Got second post: "${secondPost.title.substring(0, 50)}..."`);

    console.log('\n🎉 All basic tests passed!');
    console.log('The issue might be in how we iterate through the Listing object.');

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n💡 Authentication issue detected:');
      console.error('1. Double-check your Reddit app credentials');
      console.error('2. Make sure your Reddit app type is "script"');
      console.error('3. Verify your username and password are correct');
    }
  }
}

simpleTest();