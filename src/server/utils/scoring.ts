import { Store } from "../services/store";
import type { SeedItem } from "../../shared/types";

/** Scoring system constants */
const FULL_SCORE = 10;
const GROUP_MULTIPLIER = 0.6;
const TAG_MULTIPLIER = 0.3;

export interface ScoreResult {
  correct: boolean;
  basePoints: number;
  finalPoints: number;
  streakMultiplier: number;
  newStreak: number;
  partial: {
    awarded: number;
    reason: string;
  } | null;
}

function getStreakMultiplier(streak: number): number {
  return 1.0 + (streak * 0.1);
}

export function calculateScore(correctPost: SeedItem, guessedSub: string, currentStreak: number = 0): ScoreResult {
  const correct = guessedSub.toLowerCase().trim() === correctPost.answerSub.toLowerCase().trim();

  // Award full points with streak bonus for correct answers
  if (correct) {
    const newStreak = currentStreak + 1;
    const multiplier = getStreakMultiplier(currentStreak);
    const basePoints = FULL_SCORE;
    const finalPoints = Math.round(basePoints * multiplier);

    return {
      correct: true,
      basePoints,
      finalPoints,
      streakMultiplier: multiplier,
      newStreak,
      partial: null
    };
  }

  // Calculate partial credit based on group/tags
  const whitelist = Store.getWhitelist();
  const correctSubData = whitelist.find(w => w.name.toLowerCase() === correctPost.answerSub.toLowerCase());
  const guessedSubData = whitelist.find(w => w.name.toLowerCase() === guessedSub.toLowerCase());

  if (!correctSubData || !guessedSubData) {
    // No partial credit if subreddit not in whitelist
    return {
      correct: false,
      basePoints: 0,
      finalPoints: 0,
      streakMultiplier: 1.0,
      newStreak: 0,
      partial: null
    };
  }

  // Check for same group
  if (correctSubData.group && guessedSubData.group &&
      correctSubData.group === guessedSubData.group) {
    const basePoints = FULL_SCORE * GROUP_MULTIPLIER;
    return {
      correct: false,
      basePoints,
      finalPoints: Math.round(basePoints),
      streakMultiplier: 1.0,
      newStreak: currentStreak,
      partial: {
        awarded: Math.round(basePoints),
        reason: `Same group: ${correctSubData.group}`
      }
    };
  }

  // Check for shared tags
  const sharedTags = correctSubData.tags.filter(tag =>
    guessedSubData.tags.includes(tag)
  );

  if (sharedTags.length > 0) {
    const basePoints = FULL_SCORE * TAG_MULTIPLIER;
    return {
      correct: false,
      basePoints,
      finalPoints: Math.round(basePoints),
      streakMultiplier: 1.0,
      newStreak: currentStreak,
      partial: {
        awarded: Math.round(basePoints),
        reason: `Shared tag${sharedTags.length > 1 ? 's' : ''}: ${sharedTags.join(', ')}`
      }
    };
  }

  // No partial credit available
  return {
    correct: false,
    basePoints: 0,
    finalPoints: 0,
    streakMultiplier: 1.0,
    newStreak: 0,
    partial: null
  };
}