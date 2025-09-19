// Types matching the main ThreadGuessr app
export type Media =
  | { type: 'image'; thumbUrl: string; url: string; width?: number; height?: number }
  | { type: 'video'; thumbUrl: string; url?: string; hlsUrl?: string; width?: number; height?: number };

export type WhitelistEntry = {
  name: string;
  group: string;
  tags: string[];
  sfw: boolean;
};

export type SeedItem = {
  id: string;
  sourcePostId?: string;
  sourceUrl: string;
  answerSub: string;
  title: string;
  media: Media;
  tags: string[];
  group?: string;
  status: 'pending' | 'approved' | 'rejected';
  addedAt: number;
  distractors: string[];
  active: boolean;
};

// Types for the curation process
export type RedditPost = {
  id: string;
  title: string;
  subreddit: string;
  url: string;
  permalink: string;
  thumbnail: string;
  preview?: {
    images: Array<{
      source: { url: string; width: number; height: number };
      resolutions: Array<{ url: string; width: number; height: number }>;
    }>;
  };
  media?: {
    reddit_video?: {
      fallback_url: string;
      hls_url: string;
      width: number;
      height: number;
    };
  };
  domain: string;
  over_18: boolean;
  created_utc: number;
};

export type CurationCandidate = {
  redditPost: RedditPost;
  subredditInfo: WhitelistEntry;
  suggestedDistractors: string[];
  proposedSeed: Omit<SeedItem, 'id' | 'addedAt' | 'status'>;
};

export type CurationDecision = 'approve' | 'reject' | 'skip';