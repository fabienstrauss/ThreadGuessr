/**
 * Leaderboard service using Redis for weekly rankings.
 * Manages user scores and provides ranking functionality.
 */

import { redis, reddit } from '@devvit/web/server';
import type { LeaderboardEntry, WeeklyLeaderboard, DailyStats } from '../../shared/types';
import { DailyStateService } from './dailyState';

function getWeekKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const weekNumber = getWeekNumber(date);
  const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  console.log(`[leaderboard] Generated week key: ${weekKey} for date: ${date.toISOString().split('T')[0]}`);
  return weekKey;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

  console.log(`[leaderboard] Week calculation: Date=${date.toDateString()}, Week=${weekNumber}`);
  return weekNumber;
}

function getWeeklyLeaderboardKey(weekKey: string): string {
  return `leaderboard:weekly:${weekKey}`;
}

function getUserWeeklyKey(userId: string, weekKey: string): string {
  return `user:weekly:${userId}:${weekKey}`;
}

async function getUserDataFromReddit(userId: string): Promise<{ username: string; profilePicture?: string }> {
  try {
    // Get basic user data from Devvit API
    const user = await reddit.getUserById(userId as `t2_${string}`);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`[leaderboard] Got user data for ${user.username} (${userId})`);

    // External Reddit API calls are blocked in Devvit.
    // Devvit API doesn't expose avatar/profile picture data.
    // Future: check user.iconImg, user.snoovatarImg when available.

    return {
      username: user.username
      // profilePicture omitted (undefined) for exact optional property types
    };
  } catch (error) {
    console.log(`[leaderboard] Could not fetch user data for ${userId}:`, error);
    // Fallback to shortened ID
    const fallbackUsername = userId.startsWith('t2_') ? `User ${userId.slice(-6)}` : userId;
    return {
      username: fallbackUsername
      // profilePicture omitted (undefined) for exact optional property types
    };
  }
}

export const LeaderboardService = {
  /**
   * Updates user's daily score for the current week.
   */
  async updateUserWeeklyScore(userId: string, dayKey: string, dailyScore: number, streak: number): Promise<void> {
    try {
      const weekKey = getWeekKey();
      const userWeeklyKey = getUserWeeklyKey(userId, weekKey);
      const leaderboardKey = getWeeklyLeaderboardKey(weekKey);

      // Get current weekly data for user
      const existingData = await redis.get(userWeeklyKey);
      const userData = existingData ? JSON.parse(existingData) : {
        userId,
        weeklyScore: 0,
        gamesPlayed: 0,
        dailyScores: {},
        lastPlayed: dayKey
      };

      // Update with new daily score (replace if day already exists)
      userData.dailyScores[dayKey] = { score: dailyScore, streak };
      userData.lastPlayed = dayKey;

      // Recalculate weekly totals
      const dailyScores = Object.values(userData.dailyScores) as Array<{ score: number; streak: number }>;
      userData.weeklyScore = dailyScores.reduce((sum, day) => sum + day.score, 0);
      userData.gamesPlayed = dailyScores.length;

      // Save updated user data
      await redis.set(userWeeklyKey, JSON.stringify(userData));

      // Store leaderboard data as JSON (Redis sorted sets unavailable)
      const leaderboardData = await redis.get(leaderboardKey);
      const leaderboard = leaderboardData ? JSON.parse(leaderboardData) : {};
      leaderboard[userId] = {
        weeklyScore: userData.weeklyScore,
        gamesPlayed: userData.gamesPlayed,
        lastPlayed: userData.lastPlayed
      };
      await redis.set(leaderboardKey, JSON.stringify(leaderboard));

      // Set expiration for 2 weeks
      await redis.expire(userWeeklyKey, 60 * 60 * 24 * 14);
      await redis.expire(leaderboardKey, 60 * 60 * 24 * 14);

      console.log(`[leaderboard] Updated ${userId} weekly score: ${userData.weeklyScore} (${userData.gamesPlayed} games)`);
    } catch (error) {
      console.error(`[leaderboard] Error updating weekly score:`, error);
    }
  },

  /**
   * Retrieves weekly leaderboard with user's position.
   */
  async getWeeklyLeaderboard(userId: string, topN: number = 10): Promise<WeeklyLeaderboard> {
    try {
      const weekKey = getWeekKey();
      const leaderboardKey = getWeeklyLeaderboardKey(weekKey);

      // Get leaderboard data from simple JSON storage
      const leaderboardData = await redis.get(leaderboardKey);
      const leaderboard = leaderboardData ? JSON.parse(leaderboardData) : {};

      // Convert to array and sort by score
      const playerEntries = Object.entries(leaderboard).map(([playerId, data]: [string, any]) => ({
        userId: playerId,
        weeklyScore: data.weeklyScore,
        gamesPlayed: data.gamesPlayed,
        lastPlayed: data.lastPlayed
      })).sort((a, b) => b.weeklyScore - a.weeklyScore);

      const totalPlayers = playerEntries.length;

      // Get top N entries with real usernames and profile pictures
      const topEntries: LeaderboardEntry[] = [];
      for (let i = 0; i < Math.min(topN, playerEntries.length); i++) {
        const entry = playerEntries[i];
        if (!entry) continue; // TypeScript safety check

        const userData = await getUserDataFromReddit(entry.userId);
        const leaderboardEntry: LeaderboardEntry = {
          userId: entry.userId,
          username: userData.username,
          weeklyScore: entry.weeklyScore,
          gamesPlayed: entry.gamesPlayed,
          averageScore: entry.gamesPlayed > 0 ? Math.round(entry.weeklyScore / entry.gamesPlayed) : 0,
          lastPlayed: entry.lastPlayed,
          rank: i + 1,
          ...(userData.profilePicture && { profilePicture: userData.profilePicture })
        };

        topEntries.push(leaderboardEntry);
      }

      // Check if current user is in top N
      const userInTopN = topEntries.find(entry => entry.userId === userId);
      let userEntry: LeaderboardEntry | undefined;
      let userRank: number | undefined;

      if (!userInTopN) {
        // Find user in full list
        const userIndex = playerEntries.findIndex(entry => entry.userId === userId);
        if (userIndex !== -1) {
          const userData = playerEntries[userIndex];
          if (userData) { // Safety check for TypeScript
            const userRedditData = await getUserDataFromReddit(userData.userId);
            const userLeaderboardEntry: LeaderboardEntry = {
              userId: userData.userId,
              username: userRedditData.username,
              weeklyScore: userData.weeklyScore,
              gamesPlayed: userData.gamesPlayed,
              averageScore: userData.gamesPlayed > 0 ? Math.round(userData.weeklyScore / userData.gamesPlayed) : 0,
              lastPlayed: userData.lastPlayed,
              rank: userIndex + 1,
              ...(userRedditData.profilePicture && { profilePicture: userRedditData.profilePicture })
            };

            userEntry = userLeaderboardEntry;
            userRank = userIndex + 1;
          }
        }
      }

      console.log(`[leaderboard] Retrieved weekly leaderboard: ${topEntries.length} top entries, ${totalPlayers} total players`);

      return {
        weekKey,
        entries: topEntries,
        totalPlayers,
        ...(userEntry && { userEntry }),
        ...(userRank !== undefined && { userRank })
      };
    } catch (error) {
      console.error(`[leaderboard] Error getting weekly leaderboard:`, error);
      return {
        weekKey: getWeekKey(),
        entries: [],
        totalPlayers: 0
      };
    }
  },

  /**
   * Retrieves user's daily statistics for the current week.
   */
  async getUserDailyStats(userId: string): Promise<DailyStats[]> {
    try {
      const weekKey = getWeekKey();
      const userWeeklyKey = getUserWeeklyKey(userId, weekKey);
      const userData = await redis.get(userWeeklyKey);

      if (!userData) {
        return [];
      }

      const parsedData = JSON.parse(userData);
      const stats: DailyStats[] = [];

      for (const [dayKey, dayData] of Object.entries(parsedData.dailyScores) as Array<[string, { score: number; streak: number }]>) {
        // Get detailed daily progress to calculate difficulty stats
        const dailyProgress = await DailyStateService.getDaily(userId, dayKey);

        const statsEntry: DailyStats = {
          dayKey,
          score: dayData.score,
          streak: dayData.streak,
          completed: dailyProgress?.completed || false,
          difficulty: {
            // Simplified implementation - full version would track per-round results
            easy: { correct: Math.floor(dayData.streak / 2), total: 5 },
            hard: { correct: Math.floor(dayData.streak / 2), total: 5 }
          }
        };

        // Only add completedAt if it exists
        if (dailyProgress?.completedAt !== undefined) {
          statsEntry.completedAt = dailyProgress.completedAt;
        }

        stats.push(statsEntry);
      }

      return stats.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
    } catch (error) {
      console.error(`[leaderboard] Error getting user daily stats:`, error);
      return [];
    }
  }
};