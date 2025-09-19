import { Difficulty, SeedItem, WhitelistEntry } from "../../shared/types";
import { Store } from "./store";

export function getWhitelist(): WhitelistEntry[] {
  return Store.getWhitelist();
}

export function getGroupOfSub(name: string): string | undefined {
  const w = Store.getWhitelist().find((w) => w.name === name);
  return w?.group;
}

export function sharesAnyTag(name: string, tags: string[]): boolean {
  const w = Store.getWhitelist().find((w) => w.name === name);
  if (!w) return false;
  return w.tags.some((t: string) => tags.includes(t));
}

export function difficultyForIndex(idx: number): Difficulty {
  return idx < 5 ? "easy" : "hard";
}

export function difficultyMultiplier(diff: Difficulty): number {
  return diff === "hard" ? 1.3 : 1.0;
}

export function pickOptions(seed: SeedItem, count = 4): string[] {
  const set = new Set<string>([seed.answerSub]);

  const pool = (seed.distractors?.length
      ? seed.distractors
      : Store.getWhitelist().map(w => w.name)
  ).filter(n => n.trim().toLowerCase() !== seed.answerSub.trim().toLowerCase());

  for (const n of pool) {
    set.add(n);
    if (set.size >= count) break;
  }

  const arr = Array.from(set);
  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

export function chooseTenForDay(all: SeedItem[], seedRandom: () => number): SeedItem[] {
  if (all.length === 0) {
    throw new Error("No seeds available for selection");
  }

  // Filter out any invalid seeds
  const validSeeds = all.filter(s => s && s.id);
  if (validSeeds.length === 0) {
    throw new Error("No valid seeds with ID found");
  }

  const arr = validSeeds.slice();
  shuffleInPlace(arr, seedRandom);
  const selected = arr.slice(0, Math.min(10, arr.length));

  console.log(`[selection] Selected ${selected.length} seeds from ${validSeeds.length} valid seeds (${all.length} total)`);
  return selected;
}

function shuffleInPlace<T>(arr: T[], rnd: () => number = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    let randomValue = rnd();
    if (isNaN(randomValue) || randomValue < 0 || randomValue >= 1) {
      console.error(`[shuffle] Invalid random value: ${randomValue}, falling back to Math.random`);
      randomValue = Math.random();
    }
    const j = Math.floor(randomValue * (i + 1));
    if (j < 0 || j >= arr.length) {
      console.error(`[shuffle] Invalid index ${j} for array length ${arr.length}`);
      continue;
    }
    const tmp = arr[i];
    const itemAtJ = arr[j];
    if (tmp !== undefined && itemAtJ !== undefined) {
      arr[i] = itemAtJ;
      arr[j] = tmp;
    }
  }
}
