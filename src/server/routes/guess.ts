import { GuessRequest } from "../../shared/types";
import { Store } from "../services/store";
import { getDailyPosts } from "../utils/daily";
import { calculateScore } from "../utils/scoring";
import { DailyStateService } from "../services/dailyState";
import { difficultyForIndex } from "../services/selection";

export async function postGuessHandler(ctx: { userId: string; dayKey: string }, body: GuessRequest) {
  const seeds = Store.getSeeds();
  if (seeds.length === 0) throw new Error("no seeds loaded");

  // Extract round index from round ID
  const expectedRoundIdPrefix = `${ctx.dayKey}:`;
  if (!body.roundId.startsWith(expectedRoundIdPrefix)) {
    throw new Error("invalid round ID format");
  }

  const roundIndex = parseInt(body.roundId.replace(expectedRoundIdPrefix, ''));
  if (isNaN(roundIndex) || roundIndex < 0 || roundIndex >= 10) {
    throw new Error("invalid round index");
  }

  // Retrieve daily posts and correct answer
  const dailyPosts = getDailyPosts(ctx.dayKey, seeds);
  const correctPost = dailyPosts[roundIndex];

  if (!correctPost) throw new Error("post not found");

  // Validate user can continue playing
  const playCheck = await DailyStateService.canPlay(ctx.userId, ctx.dayKey);
  if (!playCheck.canPlay) {
    throw new Error(playCheck.reason || "Cannot play today");
  }

  // Initialize session if needed after server restart
  let dailyProgress = playCheck.progress;
  if (!dailyProgress) {
    console.log(`[guess] Auto-initializing daily session for ${ctx.userId} on ${ctx.dayKey}`);
    dailyProgress = await DailyStateService.startDaily(ctx.userId, ctx.dayKey);
  }

  // Apply difficulty-based validation
  const difficulty = difficultyForIndex(roundIndex);
  const userAnswer = body.answerSub.trim();

  if (difficulty === 'hard') {
    // Enforce whitelist for hard difficulty
    const whitelist = Store.getWhitelist();
    const validSubs = whitelist.map(w => w.name);
    if (!validSubs.includes(userAnswer)) {
      throw new Error(`Invalid subreddit: r/${userAnswer} is not in the allowed list`);
    }
  }

  // Calculate score including partial credit and streak bonus
  const currentStreak = body.currentStreak || 0;
  const scoreResult = calculateScore(correctPost, userAnswer, currentStreak);

  // Update progress and complete session if final round
  const totalScore = (body.currentScore || 0) + scoreResult.finalPoints;
  await DailyStateService.updateProgress(
    ctx.userId,
    ctx.dayKey,
    roundIndex,
    totalScore,
    scoreResult.newStreak
  );

  return {
    correct: scoreResult.correct,
    points: scoreResult.finalPoints,
    basePoints: scoreResult.basePoints,
    streakMultiplier: scoreResult.streakMultiplier,
    partial: scoreResult.partial,
    reveal: {
      answerSub: correctPost.answerSub,
      sourceUrl: correctPost.sourceUrl
    },
    score: scoreResult.finalPoints,
    streak: scoreResult.newStreak,
    nextAvailable: roundIndex < 9 && (dailyProgress?.currentRound === roundIndex),
  };
}