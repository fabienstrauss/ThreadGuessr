/**
 * Daily game state management using Redis.
 * Manages user progress and completion status for daily challenges.
 */

import { redis } from '@devvit/web/server';
import { LeaderboardService } from './leaderboard';

export interface DailyProgress {
  dayKey: string;
  userId: string;
  completed: boolean;
  completedAt?: number;
  finalScore: number;
  finalStreak: number;
  /** Current round progress (0-9) */
  currentRound: number;
}

function getDailyStateKey(userId: string, dayKey: string): string {
  return `daily:${dayKey}:${userId}`;
}

export const DailyStateService = {
  /**
   * Retrieves current daily progress for a user.
   */
  async getDaily(userId: string, dayKey: string): Promise<DailyProgress | null> {
    try {
      console.log(`[daily] getDaily called for ${userId}`);
      const key = getDailyStateKey(userId, dayKey);
      const stored = await redis.get(key);

      if (!stored) {
        console.log(`[daily] getDaily(${userId}, ${dayKey}) -> null (not in Redis)`);
        return null;
      }

      const result = JSON.parse(stored) as DailyProgress;
      console.log(`[daily] getDaily(${userId}, ${dayKey}) -> found (round: ${result.currentRound}, score: ${result.finalScore}, streak: ${result.finalStreak})`);
      return result;
    } catch (error) {
      console.error(`[daily] getDaily error:`, error);
      return null;
    }
  },

  /**
   * Initializes or resumes a daily session for a user.
   */
  async startDaily(userId: string, dayKey: string): Promise<DailyProgress> {
    try {
      const key = getDailyStateKey(userId, dayKey);
      const existing = await this.getDaily(userId, dayKey);

      console.log(`[daily] startDaily(${userId}, ${dayKey}) - existing: ${existing ? 'found' : 'null'}`);

      const bypassDailyLimit = process.env.BYPASS_DAILY_LIMIT === 'true' ||
                               process.env.VITE_BYPASS_DAILY_LIMIT === 'true';
      const manualBypassForTesting = false;

      // Return existing state if already completed and bypass is disabled
      if (existing?.completed && !bypassDailyLimit && !manualBypassForTesting) {
        console.log(`[daily] Already completed, returning existing state`);
        return existing;
      } else if (existing?.completed && (bypassDailyLimit || manualBypassForTesting)) {
        console.log(`[daily] BYPASS MODE: Allowing restart of completed session for testing`);
        // Reset session for testing purposes
        existing.completed = false;
        delete existing.completedAt;
        existing.currentRound = 0;
        existing.finalScore = 0;
        existing.finalStreak = 0;
        const key = getDailyStateKey(userId, dayKey);
        await redis.set(key, JSON.stringify(existing));
        return existing;
      }

      // Resume existing incomplete session
      if (existing && !existing.completed) {
        console.log(`[daily] Resuming existing session at round ${existing.currentRound}`);
        return existing;
      }

      // Initialize new session
      const progress: DailyProgress = {
        dayKey,
        userId,
        completed: false,
        finalScore: 0,
        finalStreak: 0,
        currentRound: 0,
      };

      await redis.set(key, JSON.stringify(progress));
      console.log(`[daily] Created new daily session for ${userId}`);
      return progress;
    } catch (error) {
      console.error(`[daily] startDaily error:`, error);
      throw new Error('Failed to start daily session');
    }
  },

  /**
   * Updates user progress after completing a round.
   */
  async updateProgress(userId: string, dayKey: string, roundIndex: number, score: number, streak: number): Promise<DailyProgress> {
    try {
      const key = getDailyStateKey(userId, dayKey);
      const existing = await this.getDaily(userId, dayKey);

      console.log(`[daily] updateProgress(${userId}, ${dayKey}, round=${roundIndex}, score=${score}, streak=${streak}) - existing: ${existing ? 'found' : 'null'}`);

      if (!existing) {
        throw new Error("Daily session not started");
      }

      const bypassDailyLimit = process.env.BYPASS_DAILY_LIMIT === 'true' ||
                               process.env.VITE_BYPASS_DAILY_LIMIT === 'true';
      const manualBypassForTesting = false;

      if (existing.completed && !bypassDailyLimit && !manualBypassForTesting) {
        throw new Error("Daily session already completed");
      } else if (existing.completed && (bypassDailyLimit || manualBypassForTesting)) {
        console.log(`[daily] BYPASS MODE: Allowing update to completed session for testing`);
      }

      // Update session progress
      existing.currentRound = Math.max(existing.currentRound, roundIndex + 1);
      existing.finalScore = score;
      existing.finalStreak = streak;

      // Complete session after final round
      if (roundIndex >= 9) {
        existing.completed = true;
        existing.completedAt = Date.now();
        console.log(`[daily] Marking as completed - final score: ${score}`);
        await LeaderboardService.updateUserWeeklyScore(userId, dayKey, score, streak);
      }

      // Update leaderboard when bypass mode is enabled
      if ((bypassDailyLimit || manualBypassForTesting) && roundIndex > 0) {
        console.log(`[daily] BYPASS MODE: Updating leaderboard with current progress - round ${roundIndex}, score ${score}, streak ${streak}`);
        await LeaderboardService.updateUserWeeklyScore(userId, dayKey, score, streak);
      }

      await redis.set(key, JSON.stringify(existing));
      console.log(`[daily] Updated progress: round ${existing.currentRound}, score ${existing.finalScore}, streak ${existing.finalStreak}`);
      return existing;
    } catch (error) {
      console.error(`[daily] updateProgress error:`, error);
      throw new Error('Failed to update progress');
    }
  },

  /**
   * Determines if a user can play the daily challenge.
   */
  async canPlay(userId: string, dayKey: string): Promise<{ canPlay: boolean; reason?: string; progress?: DailyProgress }> {
    try {
      const bypassDailyLimit = process.env.BYPASS_DAILY_LIMIT === 'true' ||
                               process.env.VITE_BYPASS_DAILY_LIMIT === 'true';
      const manualBypassForTesting = false;

      console.log(`[daily] Environment check - BYPASS_DAILY_LIMIT: ${process.env.BYPASS_DAILY_LIMIT}, VITE_BYPASS_DAILY_LIMIT: ${process.env.VITE_BYPASS_DAILY_LIMIT}`);
      console.log(`[daily] Bypass daily limit resolved to: ${bypassDailyLimit || manualBypassForTesting}`);

      if (bypassDailyLimit || manualBypassForTesting) {
        console.log(`[daily] BYPASS MODE ACTIVE - unlimited replays enabled for testing`);
        const progress = await this.getDaily(userId, dayKey);
        return progress
          ? { canPlay: true, progress }
          : { canPlay: true };
      }

      // Enforce once-per-day limit in production
      const progress = await this.getDaily(userId, dayKey);

      if (!progress) {
        return { canPlay: true };
      }

      if (progress.completed) {
        return {
          canPlay: false,
          reason: "Daily challenge already completed. Come back tomorrow!",
          progress
        };
      }

      return { canPlay: true, progress };
    } catch (error) {
      console.error(`[daily] canPlay error:`, error);
      return { canPlay: true }; // Graceful degradation on error
    }
  },

  /**
   * Retrieves user's daily challenge history.
   */
  async getUserHistory(_userId: string): Promise<DailyProgress[]> {
    try {
      console.log(`[daily] getUserHistory not implemented with Redis yet`);
      return [];
    } catch (error) {
      console.error(`[daily] getUserHistory error:`, error);
      return [];
    }
  }
};
