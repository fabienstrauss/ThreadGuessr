import { RoundPayload } from "../../shared/types";
import { Store } from "../services/store";
import { pickOptions, difficultyForIndex } from "../services/selection";
import { getDailyPosts } from "../utils/daily";
import { DailyStateService } from "../services/dailyState";

export async function getRoundHandler(ctx: { userId: string; dayKey: string; roundIndex?: number }): Promise<RoundPayload> {
  const seeds = Store.getSeeds();
  if (seeds.length === 0) throw new Error("no seeds loaded");

  const roundIndex = ctx.roundIndex ?? 0;
  if (roundIndex < 0 || roundIndex >= 10) throw new Error("invalid round index");

  // Validate user can play and retrieve progress
  const playCheck = await DailyStateService.canPlay(ctx.userId, ctx.dayKey);
  if (!playCheck.canPlay) {
    throw new Error(playCheck.reason || "Cannot play today");
  }

  // Initialize or resume daily session
  await DailyStateService.startDaily(ctx.userId, ctx.dayKey);

  // Check round access permissions
  const dailyProgress = playCheck.progress;

  // Enforce sequential round progression
  if (dailyProgress) {
    if (roundIndex < dailyProgress.currentRound) {
      console.log(`[round] User requested past round ${roundIndex}, they're at ${dailyProgress.currentRound}`);
      // Past rounds are viewable
    } else if (roundIndex > dailyProgress.currentRound) {
      console.log(`[round] User requested future round ${roundIndex}, redirecting to ${dailyProgress.currentRound}`);
      throw new Error(`You must complete round ${dailyProgress.currentRound} first`);
    }
  }

  // Retrieve consistent daily posts for all players
  const dailyPosts = getDailyPosts(ctx.dayKey, seeds);
  const currentPost = dailyPosts[roundIndex];

  if (!currentPost) throw new Error("post not found for round");

  const difficulty = difficultyForIndex(roundIndex);
  const options = pickOptions(currentPost, 4);

  return {
    roundId: `${ctx.dayKey}:${roundIndex}`,
    title: currentPost.title,
    media: currentPost.media,
    options,
    roundIndex,
    totalRounds: 10,
    difficulty,
  };
}