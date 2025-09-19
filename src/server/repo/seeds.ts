import { redis } from '@devvit/web/server';
import type { SeedItem } from '../../shared/types';

const KEY_IDS_ALL = 'seeds:v1:ids';
const KEY_IDS_APPROVED = 'seeds:v1:ids:approved';
const KEY_BY_ID = (id: string) => `seeds:v1:byId:${id}`;

async function getIdList(key: string): Promise<string[]> {
  const raw = await redis.get(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}
async function setIdList(key: string, ids: string[]): Promise<void> {
  await redis.set(key, JSON.stringify(ids));
}

export const SeedsRepo = {
  async saveMany(seeds: SeedItem[]): Promise<void> {
    const idsAll = new Set(await getIdList(KEY_IDS_ALL));
    const idsApproved = new Set(await getIdList(KEY_IDS_APPROVED));

    for (const s of seeds) {
      await redis.set(KEY_BY_ID(s.id), JSON.stringify(s));
      idsAll.add(s.id);
      if (s.status === 'approved') idsApproved.add(s.id);
      else idsApproved.delete(s.id);
    }
    await setIdList(KEY_IDS_ALL, [...idsAll]);
    await setIdList(KEY_IDS_APPROVED, [...idsApproved]);
  },

  async get(id: string): Promise<SeedItem | null> {
    const raw = await redis.get(KEY_BY_ID(id));
    if (!raw) return null;
    return JSON.parse(raw) as SeedItem;
  },

  async listApproved(limit = 200): Promise<SeedItem[]> {
    const ids = await getIdList(KEY_IDS_APPROVED);
    const take = ids.slice(0, limit);
    const results: SeedItem[] = [];
    for (const id of take) {
      const s = await this.get(id);
      if (s) results.push(s);
    }
    return results;
  },

  async hasAny(): Promise<boolean> {
    const ids = await getIdList(KEY_IDS_ALL);
    return ids.length > 0;
  }
};
