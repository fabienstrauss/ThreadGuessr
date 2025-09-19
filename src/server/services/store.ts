import { WhitelistEntry, SeedItem } from "../../shared/types";

let whitelist: WhitelistEntry[] = [];
let seeds: SeedItem[] = [];

export const Store = {
  loadWhitelist(data: WhitelistEntry[]) {
    whitelist = data.filter((w) => w.sfw !== false);
  },
  getWhitelist() {
    return whitelist;
  },
  loadSeeds(data: SeedItem[]) {
    const originalCount = data.length;
    seeds = data.filter((s) => s && s.id && s.active !== false);
    console.log(`[store] Loaded ${seeds.length}/${originalCount} seeds (filtered out ${originalCount - seeds.length} inactive/invalid)`);
    if (seeds.length < 10) {
      console.warn(`[store] Warning: Only ${seeds.length} seeds available, need at least 10 for game`);
    }
  },
  getSeeds() {
    return seeds;
  },
};
