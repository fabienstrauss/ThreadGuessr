// Simple test script to check Reddit API connection
import dotenv from 'dotenv';
import Snoowrap from 'snoowrap';

// Load environment variables
dotenv.config();

console.log('Testing Reddit API connection...');
console.log('Environment variables:');
console.log('REDDIT_CLIENT_ID:', process.env.REDDIT_CLIENT_ID ? 'Set' : 'Missing');
console.log('REDDIT_CLIENT_SECRET:', process.env.REDDIT_CLIENT_SECRET ? 'Set' : 'Missing');
console.log('REDDIT_USERNAME:', process.env.REDDIT_USERNAME ? 'Set' : 'Missing');
console.log('REDDIT_PASSWORD:', process.env.REDDIT_PASSWORD ? 'Set' : 'Missing');

async function testReddit() {
  try {
    const reddit = new Snoowrap({
      userAgent: 'ThreadGuessr Test Script v1.0.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD
    });

    console.log('\nTesting authentication...');
    const me = await reddit.getMe();
    console.log('✅ Successfully authenticated as:', me.name);

    console.log('\nTesting subreddit access...');
    const testSub = await reddit.getSubreddit('pics');
    console.log('✅ Successfully accessed r/pics');

    const posts = await testSub.getHot({ limit: 1 });
    console.log('✅ Successfully fetched posts');

    // Test iterating through the first post
    for (const post of posts) {
      console.log('✅ Sample post:', post.title.substring(0, 50) + '...');
      break;
    }

    console.log('\n🎉 All tests passed! Reddit API is working correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('401')) {
      console.error('This looks like an authentication error. Check your credentials.');
    }
  }
}

testReddit();