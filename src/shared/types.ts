export type Difficulty = "easy" | "hard";
export type SeedStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export type Media =
  | { type: 'image'; thumbUrl: string; url: string; width?: number; height?: number }
  | { type: 'video'; thumbUrl: string; url?: string; hlsUrl?: string; width?: number; height?: number };

export type SeedItem = {
  id: string;
  sourcePostId?: string;
  sourceUrl: string;
  answerSub: string;
  title: string;
  media: Media;
  tags: string[];
  group?: string;

  status: SeedStatus;
  addedAt: number;
  approvedAt?: number;
  approvedBy?: string;

  nsfw?: boolean;
  spoiler?: boolean;

  distractors?: string[];
  active?: boolean;
};

export type RoundPayload = {
  roundId: string;
  title: string;
  media: Media;
  options: string[];
  roundIndex: number;
  totalRounds: number;
  difficulty: Difficulty;
};

export type GuessRequest = {
  roundId: string;
  answerSub: string;
  currentStreak?: number; // Client sends current streak for bonus calculation
  currentScore?: number; // Client sends current total score for progress tracking
};

export type PartialCredit = {
  awarded: number;
  reason?: string;
};

export type GuessResponse = {
  correct: boolean;
  points: number; // Final points after streak multiplier
  basePoints: number; // Points before streak multiplier
  streakMultiplier: number; // Applied multiplier (1.0, 1.1, etc.)
  partial?: PartialCredit | null;
  reveal: { answerSub: string; sourceUrl: string };
  score: number; // Still current round score for backward compatibility
  streak: number; // Updated streak count
  nextAvailable: boolean;
};

export type WhitelistEntry = {
  name: string;
  group: string;
  tags: string[];
  sfw: boolean;
};

export type DailyState = {
  dayKey: string;
  roundIndex: number;
  score: number;
  streak: number;
  chosenSeedIds: string[];
};

export type LeaderboardEntry = {
  userId: string;
  username?: string; // Reddit username if available
  profilePicture?: string; // Reddit profile picture URL if available
  weeklyScore: number; // Total score for the week
  gamesPlayed: number; // Number of days played this week
  averageScore: number; // Average daily score
  lastPlayed: string; // ISO date string of last game
  rank: number; // Position in leaderboard
};

export type WeeklyLeaderboard = {
  weekKey: string; // e.g., "2025-W37"
  entries: LeaderboardEntry[];
  totalPlayers: number;
  userEntry?: LeaderboardEntry; // Current user's entry if not in top entries
  userRank?: number; // User's rank if not in top entries
};

export type DailyStats = {
  dayKey: string;
  score: number;
  streak: number;
  completed: boolean;
  completedAt?: number;
  difficulty: {
    easy: { correct: number; total: number }; // Rounds 1-5
    hard: { correct: number; total: number }; // Rounds 6-10
  };
};
