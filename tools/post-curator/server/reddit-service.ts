import Snoowrap from 'snoowrap';
import { RedditPost, WhitelistEntry, CurationCandidate, Media } from '../src/types.js';

export class RedditService {
  private reddit: Snoowrap;
  private whitelist: WhitelistEntry[] = [];

  constructor() {
    // Validate environment variables
    const requiredEnvVars = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USERNAME', 'REDDIT_PASSWORD'];
    const missing = requiredEnvVars.filter(env => !process.env[env]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // You'll need to create a Reddit app at https://www.reddit.com/prefs/apps
    // and set these environment variables
    this.reddit = new Snoowrap({
      userAgent: 'ThreadGuessr Post Curator v1.0.0 by /u/' + process.env.REDDIT_USERNAME,
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      username: process.env.REDDIT_USERNAME!,
      password: process.env.REDDIT_PASSWORD!
    });

    // Configure snoowrap to be more conservative
    this.reddit.config({
      requestDelay: 1000, // 1 second between requests
      warnings: false,
      continueAfterRatelimitError: true,
      retryErrorCodes: [502, 503, 504, 522],
      maxRetryAttempts: 3
    });
  }

  loadWhitelist(whitelist: WhitelistEntry[]) {
    this.whitelist = whitelist;
    console.log(`Loaded ${whitelist.length} whitelisted subreddits`);
  }

  // Test Reddit connection
  async testConnection(): Promise<{ success: boolean; username?: string; error?: string }> {
    try {
      const me = await this.reddit.getMe();
      return {
        success: true,
        username: me.name
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async fetchRandomPosts(count: number = 30, seenPostIds: Set<string> = new Set()): Promise<CurationCandidate[]> {
    const candidates: CurationCandidate[] = [];
    console.log(`🚀 Maximum variety fetch: Getting ${count} posts from ${count} different subreddits`);

    // Use exactly as many subreddits as posts requested (1 post per subreddit)
    const subredditsToUse = Math.min(count, this.whitelist.length);
    const shuffledWhitelist = [...this.whitelist].sort(() => Math.random() - 0.5).slice(0, subredditsToUse);

    console.log(`🎯 Strategy: 1 post from each of ${subredditsToUse} different subreddits`);

    // Fetch 1 post from each subreddit in parallel
    const fetchPromises = shuffledWhitelist.map(subredditInfo =>
      this.fetchOnePostFromSubreddit(subredditInfo, seenPostIds)
        .catch(error => {
          console.log(`⚠️ Skipped r/${subredditInfo.name}: ${error.message}`);
          return null;
        })
    );

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);

    // Filter out nulls and shuffle
    const validCandidates = results.filter(candidate => candidate !== null) as CurationCandidate[];
    const shuffledCandidates = validCandidates.sort(() => Math.random() - 0.5);

    console.log(`✅ Got ${shuffledCandidates.length} posts from ${shuffledCandidates.length} different subreddits`);

    // Show which subreddits we got posts from
    const subredditNames = shuffledCandidates.map(c => c.redditPost.subreddit);
    console.log(`📋 Subreddits: ${subredditNames.slice(0, 10).join(', ')}${subredditNames.length > 10 ? '...' : ''}`);

    return shuffledCandidates.slice(0, count);
  }

  // Fetch exactly one good post from a subreddit
  private async fetchOnePostFromSubreddit(subredditInfo: WhitelistEntry, seenPostIds: Set<string> = new Set()): Promise<CurationCandidate | null> {
    try {
      const subreddit = await this.reddit.getSubreddit(subredditInfo.name);
      const posts = await subreddit.getHot({ limit: 20 }); // Get 20 to have options

      // Look for the first good, unseen post
      for (let i = 0; i < 20; i++) {
        try {
          const post = await posts[i];
          if (!post) break;

          // Skip if we've already seen this post
          if (seenPostIds.has(post.id)) {
            continue;
          }

          // Check if it meets basic criteria
          if (this.isBasicCandidate(post)) {
            const candidate = await this.createCandidateFast(post, subredditInfo);
            if (candidate) {
              console.log(`  ✓ r/${subredditInfo.name}: "${post.title.substring(0, 40)}..."`);
              return candidate;
            }
          }
        } catch (postError) {
          continue; // Skip problematic posts
        }
      }

      // If we get here, couldn't find a suitable post
      console.log(`  ✗ r/${subredditInfo.name}: No suitable posts found`);
      return null;

    } catch (error) {
      throw new Error(`Failed to fetch from r/${subredditInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchFromSubredditFast(subredditInfo: WhitelistEntry, maxPosts: number, seenPostIds: Set<string> = new Set()): Promise<CurationCandidate[]> {
    const candidates: CurationCandidate[] = [];

    try {
      const subreddit = await this.reddit.getSubreddit(subredditInfo.name);
      const posts = await subreddit.getHot({ limit: Math.min(maxPosts + 5, 15) }); // Get a few extra

      // Fast processing - minimal filtering, let user decide
      let skippedDuplicates = 0;
      for (let i = 0; i < Math.min(maxPosts + 10, 25) && candidates.length < maxPosts; i++) {
        try {
          const post = await posts[i];
          if (!post) break;

          // Skip if we've already seen this post
          if (seenPostIds.has(post.id)) {
            skippedDuplicates++;
            continue;
          }

          // Only the most basic filters - let user decide the rest
          if (this.isBasicCandidate(post)) {
            const candidate = await this.createCandidateFast(post, subredditInfo);
            if (candidate) {
              candidates.push(candidate);
            }
          }
        } catch (postError) {
          continue; // Skip problematic posts silently
        }
      }

      if (skippedDuplicates > 0) {
        console.log(`  🔄 Skipped ${skippedDuplicates} duplicate posts from r/${subredditInfo.name}`);
      }

    } catch (error) {
      throw new Error(`Failed to fetch from r/${subredditInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return candidates;
  }

  private async fetchFromSubreddit(subredditInfo: WhitelistEntry, maxPosts: number): Promise<CurationCandidate[]> {
    const candidates: CurationCandidate[] = [];

    try {
      // Fetch subreddit with explicit error handling
      const subreddit = await this.reddit.getSubreddit(subredditInfo.name);

      // Fetch posts with a reasonable limit
      const fetchLimit = Math.min(25, maxPosts * 5); // Reasonable limit to avoid issues
      const posts = await subreddit.getHot({ limit: fetchLimit });

      // Access posts by index instead of iteration to avoid stack overflow
      for (let i = 0; i < fetchLimit && candidates.length < maxPosts; i++) {
        try {
          let post = await posts[i];
          if (!post) break; // No more posts available

          // Expand the post to get full data including real score
          post = await post.expandReplies();

          // Check if this is a crosspost and handle appropriately
          if (post.crosspost_parent_list && post.crosspost_parent_list.length > 0) {
            console.log(`  🔄 Detected crosspost: "${post.title.substring(0, 40)}..." - skipping`);
            continue; // Skip crossposts to avoid duplicates
          }

          // Filter for good candidates
          if (this.isGoodCandidate(post, subredditInfo)) {
            const candidate = await this.createCandidate(post, subredditInfo);
            if (candidate) {
              candidates.push(candidate);
              console.log(`  → Found candidate: "${post.title.substring(0, 50)}..." (score: ${post.score})`);
            }
          }
        } catch (postError) {
          console.warn(`  ⚠️  Skipping post ${i}:`, postError instanceof Error ? postError.message : 'Unknown error');
          continue; // Skip this post and continue with the next one
        }
      }

    } catch (error) {
      throw new Error(`Failed to fetch from r/${subredditInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return candidates;
  }

  // Super minimal filtering - just basics
  private isBasicCandidate(post: any): boolean {
    try {
      return (
        post &&
        post.title &&
        post.title.length > 5 &&
        post.title.length < 500 &&
        !post.stickied &&
        !post.is_self && // No text posts
        post.url // Must have some URL
      );
    } catch {
      return false;
    }
  }

  // Fast candidate creation without heavy processing
  private async createCandidateFast(post: any, subredditInfo: WhitelistEntry): Promise<CurationCandidate | null> {
    try {
      // Simple media extraction - don't be too picky
      const media = this.extractMediaSimple(post);
      if (!media) return null;

      const distractors = this.generateDistractors(subredditInfo.name);

      const redditPost: RedditPost = {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit?.display_name || subredditInfo.name,
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        thumbnail: post.thumbnail,
        preview: post.preview,
        media: post.media,
        domain: post.domain,
        over_18: post.over_18 || false,
        created_utc: post.created_utc,
        score: post.score || 0 // Keep simple, don't expand
      };

      const proposedSeed = {
        sourcePostId: post.id,
        sourceUrl: `https://reddit.com${post.permalink}`,
        answerSub: subredditInfo.name,
        title: post.title,
        media,
        tags: subredditInfo.tags,
        group: subredditInfo.group,
        distractors,
        active: true,
        nsfw: post.over_18 || false,
        spoiler: post.spoiler || false
      };

      return {
        redditPost,
        subredditInfo,
        suggestedDistractors: distractors,
        proposedSeed
      };
    } catch (error) {
      return null;
    }
  }

  // Simplified media extraction
  private extractMediaSimple(post: any): Media | null {
    try {
      // Handle Reddit video
      if (post.media?.reddit_video) {
        const video = post.media.reddit_video;
        return {
          type: 'video',
          thumbUrl: post.thumbnail !== 'self' ? post.thumbnail : '',
          url: video.fallback_url,
          hlsUrl: video.hls_url,
          width: video.width,
          height: video.height
        };
      }

      // Handle images from preview
      if (post.preview?.images?.[0]) {
        const image = post.preview.images[0];
        return {
          type: 'image',
          thumbUrl: this.decodeUrl(image.resolutions[0]?.url || image.source.url),
          url: this.decodeUrl(image.source.url),
          width: image.source.width,
          height: image.source.height
        };
      }

      // Handle direct image links
      if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
        return {
          type: 'image',
          thumbUrl: post.thumbnail !== 'self' ? post.thumbnail : post.url,
          url: post.url
        };
      }

      // Be more permissive - if it has a thumbnail, treat as image
      if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default') {
        return {
          type: 'image',
          thumbUrl: post.thumbnail,
          url: post.url
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private isGoodCandidate(post: any, subredditInfo: WhitelistEntry): boolean {
    try {
      // Basic safety checks
      if (!post || !post.title) return false;

      // Filter criteria
      const hasValidTitle = post.title.length > 10 && post.title.length < 300;
      const isNotStickied = !post.stickied;
      const isNotSelf = !post.is_self;
      const hasGoodScore = (post.score || 0) > 50; // Lowered from 100 for more variety
      const respectsSFW = !post.over_18 || !subredditInfo.sfw;

      // Check for media - be more permissive about what counts as media
      const hasPreview = post.preview && post.preview.images && post.preview.images.length > 0;
      const hasRedditVideo = post.media && post.media.reddit_video;
      const hasDirectImageLink = post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url);
      const hasMedia = hasPreview || hasRedditVideo || hasDirectImageLink;

      const isGood = hasValidTitle && isNotStickied && isNotSelf && hasGoodScore && respectsSFW && hasMedia;

      if (!isGood) {
        // Log why it was rejected for debugging
        const reasons = [];
        if (!hasValidTitle) reasons.push('title');
        if (!isNotStickied) reasons.push('stickied');
        if (!isNotSelf) reasons.push('self-post');
        if (!hasGoodScore) reasons.push(`score(${post.score || 0})`);
        if (!respectsSFW) reasons.push('nsfw');
        if (!hasMedia) reasons.push('no-media');

        if (reasons.length > 0) {
          console.log(`  ✗ Rejected "${post.title?.substring(0, 30)}...": ${reasons.join(', ')}`);
        }
      }

      return isGood;
    } catch (error) {
      console.warn('Error checking candidate:', error);
      return false;
    }
  }

  private async createCandidate(post: any, subredditInfo: WhitelistEntry): Promise<CurationCandidate | null> {
    try {
      const media = this.extractMedia(post);
      if (!media) return null;

      const distractors = this.generateDistractors(subredditInfo.name);

      const redditPost: RedditPost = {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit.display_name,
        url: post.url,
        permalink: `https://reddit.com${post.permalink}`,
        thumbnail: post.thumbnail,
        preview: post.preview,
        media: post.media,
        domain: post.domain,
        over_18: post.over_18,
        created_utc: post.created_utc
      };

      const proposedSeed = {
        sourcePostId: post.id,
        sourceUrl: `https://reddit.com${post.permalink}`,
        answerSub: subredditInfo.name,
        title: post.title,
        media,
        tags: subredditInfo.tags,
        group: subredditInfo.group,
        distractors,
        active: true,
        // Additional metadata for better compatibility
        nsfw: post.over_18 || false,
        spoiler: post.spoiler || false
      };

      return {
        redditPost,
        subredditInfo,
        suggestedDistractors: distractors,
        proposedSeed
      };
    } catch (error) {
      console.error('Error creating candidate:', error);
      return null;
    }
  }

  private extractMedia(post: any): Media | null {
    // Handle Reddit video
    if (post.media?.reddit_video) {
      const video = post.media.reddit_video;
      return {
        type: 'video',
        thumbUrl: post.thumbnail !== 'self' ? post.thumbnail : '',
        url: video.fallback_url,
        hlsUrl: video.hls_url,
        width: video.width,
        height: video.height
      };
    }

    // Handle images from preview
    if (post.preview?.images?.[0]) {
      const image = post.preview.images[0];
      return {
        type: 'image',
        thumbUrl: this.decodeUrl(image.resolutions[0]?.url || image.source.url),
        url: this.decodeUrl(image.source.url),
        width: image.source.width,
        height: image.source.height
      };
    }

    // Handle direct image links
    if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
      return {
        type: 'image',
        thumbUrl: post.thumbnail !== 'self' ? post.thumbnail : post.url,
        url: post.url
      };
    }

    return null;
  }

  private decodeUrl(url: string): string {
    return url.replace(/&amp;/g, '&');
  }

  private generateDistractors(correctAnswer: string): string[] {
    // Get the correct answer's info for smarter distractors
    const correctSubInfo = this.whitelist.find(sub => sub.name === correctAnswer);

    // Filter out the correct answer
    const candidates = this.whitelist.filter(sub => sub.name !== correctAnswer);

    const distractors: string[] = [];

    // Strategy: Mix same-group and different-group distractors for good difficulty balance
    if (correctSubInfo?.group) {
      // Get 1-2 distractors from the same group (harder)
      const sameGroup = candidates
        .filter(sub => sub.group === correctSubInfo.group)
        .map(sub => sub.name);

      if (sameGroup.length > 0) {
        const sameGroupPick = sameGroup[Math.floor(Math.random() * sameGroup.length)];
        distractors.push(sameGroupPick);
      }
    }

    // Fill remaining slots with random distractors from different groups
    const remainingCandidates = candidates
      .filter(sub => !distractors.includes(sub.name))
      .filter(sub => !correctSubInfo?.group || sub.group !== correctSubInfo.group)
      .map(sub => sub.name);

    while (distractors.length < 3 && remainingCandidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingCandidates.length);
      distractors.push(remainingCandidates.splice(randomIndex, 1)[0]);
    }

    // If we still need more distractors, fill from any remaining candidates
    const allRemaining = candidates
      .filter(sub => !distractors.includes(sub.name))
      .map(sub => sub.name);

    while (distractors.length < 3 && allRemaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * allRemaining.length);
      distractors.push(allRemaining.splice(randomIndex, 1)[0]);
    }

    return distractors;
  }
}