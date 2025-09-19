import { PartialCredit, SeedItem } from "../../shared/types";

export function computeRoundScore(
  picked: string,
  seed: SeedItem,
  difficultyMultiplier: number,
  currentStreak: number
): { points: number; partial?: PartialCredit | null; correct: boolean; newStreak: number } {
  const correct = picked === seed.answerSub;
  if (correct) {
    const base = 1.0;
    const streakBonus = currentStreak >= 2 ? 0.1 : 0; // tiny bonus after 2+
    const points = (base + streakBonus) * difficultyMultiplier;
    return { points, correct: true, partial: null, newStreak: currentStreak + 1 };
  }

  let partial: PartialCredit | null = null;

  if (seed.group && getGroupOfSub(picked) === seed.group) {
    partial = { awarded: 0.6 * difficultyMultiplier, reason: `Same group: ${seed.group}` };
  } else if (sharesAnyTag(picked, seed.tags)) {
    partial = { awarded: 0.3 * difficultyMultiplier, reason: `Shared tags` };
  }
  const points = partial?.awarded ?? 0;
  return { points, correct: false, partial: partial ?? null, newStreak: 0 };
}

let getGroupOfSub: (name: string) => string | undefined = () => undefined;
let sharesAnyTag: (name: string, tags: string[]) => boolean = () => false;

export function bindMetaLookups(
  groupLookup: (name: string) => string | undefined,
  tagShareCheck: (name: string, tags: string[]) => boolean
) {
  getGroupOfSub = groupLookup;
  sharesAnyTag = tagShareCheck;
}

export function computeRoundScoreNormalized(
  correct: boolean,
  picked: string,
  seed: SeedItem,
  mult: number,
  currentStreak: number
) {
  if (correct) {
    const base = 1;
    const streakBonus = currentStreak >= 2 ? 0.1 : 0;
    const points = (base + streakBonus) * mult;
    return { points, correct: true, partial: null, newStreak: currentStreak + 1 };
  }

  // Partial credit: same group or shared tag
  let partial = null as null | { awarded: number; reason: string };
  if (seed.group && getGroupOfSub(picked) === seed.group) {
    partial = { awarded: 0.6 * mult, reason: `Same group: ${seed.group}` };
  } else if (sharesAnyTag(picked, seed.tags)) {
    partial = { awarded: 0.3 * mult, reason: `Shared tags` };
  }
  return { points: partial?.awarded ?? 0, correct: false, partial, newStreak: 0 };
}
