// src/server/index.ts
import express from 'express';
import { createServer, context, getServerPort } from '@devvit/web/server';

import { getRoundHandler } from './routes/round';
import { postGuessHandler } from './routes/guess';
import { postReportHandler } from './routes/report';
import { getReports } from './services/reports';
import { ingestHandler } from "./routes/ingest";
import { Store } from './services/store';
import { SeedsRepo } from './repo/seeds';
import { DailyStateService } from './services/dailyState';
import { LeaderboardService } from './services/leaderboard';
import type { GuessRequest, SeedItem, WhitelistEntry, Media } from '../shared/types';

let storeHydrated = false;

async function hydrateStoreOnBoot() {
  if (storeHydrated) return;

  Store.loadWhitelist(whitelistJson as unknown as WhitelistEntry[]);

  try {
    const approved = await SeedsRepo.listApproved(500);
    if (approved.length > 0) {
      console.log('[srv] hydrate: using approved seeds from Redis:', approved.length);
      Store.loadSeeds(approved as SeedItem[]);
    } else {
      console.log('[srv] hydrate: using seeds.json fallback');
      Store.loadSeeds(seedsJson as unknown as SeedItem[]);
    }
    storeHydrated = true;
  } catch (e) {
    console.error('hydrate error', e);
    console.log('[srv] hydrate: fallback to seeds.json due to error');
    Store.loadSeeds(seedsJson as unknown as SeedItem[]);
    storeHydrated = true;
  }
}

// Daten einmalig laden
import whitelistJson from '../data/whitelist.json' assert { type: 'json' };
import seedsJson from '../data/seeds.json' assert { type: 'json' };
Store.loadWhitelist(whitelistJson as unknown as WhitelistEntry[]);
Store.loadSeeds(seedsJson as unknown as SeedItem[]);

console.log('[srv] boot (express)');

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getUserId(): string {
  // Vom Devvit-Gateway bereitgestellt (z. B. "t2_abc..."). Fallback für Sicherheit:
  const userId = context.userId ?? 'anonymous';
  console.log(`[srv] getUserId() -> "${userId}" (context available: ${!!context.userId})`);
  return userId;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// --- Health / Debug
app.get('/api/ping', (_req, res) => {
  console.log('[srv] /api/ping');
  res.status(200).send('pong');
});

// --- Check if user can play today
app.get('/api/daily-status', async (_req, res) => {
  try {
    await hydrateStoreOnBoot();
    const userId = getUserId();
    const dayKey = todayKey();
    console.log(`[srv] /api/daily-status checking for date: ${dayKey}`);
    const status = await DailyStateService.canPlay(userId, dayKey);
    console.log(`[srv] /api/daily-status result:`, JSON.stringify(status, null, 2));
    res.json(status);
  } catch (err) {
    console.error('[srv] /api/daily-status error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// --- Daily-Runden
app.get('/api/round', async (req, res) => {
  try {
    await hydrateStoreOnBoot();
    const userId = getUserId();
    const roundIndex = parseInt(req.query.roundIndex as string) || 0;
    const dayKey = todayKey();
    console.log(`[srv] /api/round userId=${userId}, dayKey=${dayKey}, roundIndex=${roundIndex}`);
    const payload = await getRoundHandler({ userId, dayKey, roundIndex });
    res.json(payload);
  } catch (err) {
    console.error('[srv] /api/round error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/guess', async (req, res) => {
  try {
    await hydrateStoreOnBoot();
    const userId = getUserId();
    const raw = req.body;

    // Type Guard statt any
    const isGuessRequest = (x: unknown): x is GuessRequest => {
      if (typeof x !== 'object' || x === null) return false;
      const o = x as Record<string, unknown>;
      return typeof o.roundId === 'string' && typeof o.answerSub === 'string';
    };

    if (!isGuessRequest(raw)) {
      res.status(400).json({ error: 'Invalid body for /api/guess' });
      return;
    }

    const dayKey = todayKey();
    console.log(`[srv] /api/guess userId=${userId}, dayKey=${dayKey}`);
    const payload = await postGuessHandler({ userId, dayKey }, raw);
    res.json(payload);
  } catch (err: any) {
    console.error('[srv] /api/guess error', err);
    const status = err?.code === 409 ? 409 : 500;
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(status).json({ error: msg });
  }
});

app.post('/api/report', async (req, res) => {
  try {
    const userId = getUserId();
    const body = req.body;

    const args: { userId: string; roundId?: string; reasons?: string[]; description?: string } = { userId };

    if (body && typeof body === 'object') {
      if (typeof body.roundId === 'string') args.roundId = body.roundId;
      if (Array.isArray(body.reasons)) args.reasons = body.reasons;
      if (typeof body.description === 'string') args.description = body.description;
    }

    await postReportHandler(args);
    res.status(204).end();
  } catch (err) {
    console.error('[srv] /api/report error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/admin/reports', async (_req, res) => {
  try {
    const reports = getReports();
    res.json({ reports });
  } catch (err) {
    console.error('[srv] /api/admin/reports error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

type MinimalSeedInput = {
  title: string;
  answerSub: string;
  sourceUrl: string;
  media: Media;
  tags?: string[];
  group?: string;
};

app.get('/internal/ingest', async (req, res) => {
  try {
    // vollständige URL für den Fetch-Request zusammenbauen
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // ingestHandler erwartet einen Fetch-Request:
    const r = await ingestHandler(new Request(fullUrl));

    // Inhalt weiterreichen
    const contentType = r.headers.get('Content-Type') ?? 'application/json';
    const text = await r.text();
    res.status(r.status).type(contentType).send(text);
  } catch (err) {
    console.error('[srv] /internal/ingest error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

type RepoSeed = Omit<SeedItem, 'group'> & {
  group?: string;                          // bleibt optional
  status: 'approved' | 'pending' | 'rejected';
  addedAt: number;
  approvedAt?: number;
  approvedBy?: string;
};

// POST /internal/dev/import-seeds
// Body: { seeds: MinimalSeedInput[] }
app.post('/internal/dev/import-seeds', async (req, res) => {
  try {
    const body = (typeof req.body === 'object' && req.body) ? (req.body as { seeds?: MinimalSeedInput[] }) : {};
    const incoming = Array.isArray(body.seeds) ? body.seeds : [];
    if (incoming.length === 0) {
      res.status(400).json({ error: 'Body { seeds: MinimalSeedInput[] } erwartet' });
      return;
    }

    const now = Date.now();
    const wl = Store.getWhitelist();

    const resolveMeta = (sub: string): { group?: string; tags: string[] } => {
      const w = wl.find((x) => x.name.toLowerCase() === sub.toLowerCase());
      return {
        ...(w?.group ? { group: w.group } : {}),
        tags: w?.tags ?? []
      };
    };

    const repoSeeds: RepoSeed[] = incoming.map((m, i) => {
      const fallback = resolveMeta(m.answerSub);
      const groupVal = m.group ?? fallback.group;

      return {
        id: `seed-${now}-${i.toString(36)}`,
        title: m.title,
        media: m.media,
        answerSub: m.answerSub,
        ...(groupVal ? { group: groupVal } : {}),
        tags: (m.tags ?? fallback.tags ?? []),
        sourceUrl: m.sourceUrl,
        distractors: [] as string[],
        active: true,

        // Repo-Felder:
        status: 'approved',
        addedAt: now,
        approvedAt: now,
        approvedBy: 'dev-import',
      };
    });

    await SeedsRepo.saveMany(repoSeeds);
    res.json({ ok: true, imported: repoSeeds.length, ids: repoSeeds.map((s) => s.id) });
  } catch (err) {
    console.error('import-seeds error', err);
    res.status(500).json({ error: 'import failed' });
  }
});

// --- Menu handlers for Devvit UI ---
app.post('/internal/menu/post-create', async (_req, res) => {
  try {
    const { createPost } = await import('./core/post');
    const post = await createPost();
    res.json({ success: true, postId: post.id });
  } catch (err) {
    console.error('[srv] /internal/menu/post-create error', err);
    const msg = err instanceof Error ? err.message : 'Failed to create post';
    res.status(500).json({ error: msg });
  }
});

// --- Get whitelist for search
app.get('/api/whitelist', async (_req, res) => {
  try {
    await hydrateStoreOnBoot();
    const whitelist = Store.getWhitelist();
    res.json(whitelist);
  } catch (err) {
    console.error('[srv] /api/whitelist error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// --- Get weekly leaderboard
app.get('/api/leaderboard', async (_req, res) => {
  try {
    const userId = getUserId();
    const leaderboard = await LeaderboardService.getWeeklyLeaderboard(userId, 10);
    res.json(leaderboard);
  } catch (err) {
    console.error('[srv] /api/leaderboard error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// --- Get user's daily stats
app.get('/api/stats', async (_req, res) => {
  try {
    const userId = getUserId();
    const stats = await LeaderboardService.getUserDailyStats(userId);
    res.json(stats);
  } catch (err) {
    console.error('[srv] /api/stats error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});


// --- App install handler ---
app.post('/internal/on-app-install', async (_req, res) => {
  try {
    console.log('[srv] App installed, performing bootstrap');
    await hydrateStoreOnBoot();
    res.json({ success: true });
  } catch (err) {
    console.error('[srv] /internal/on-app-install error', err);
    const msg = err instanceof Error ? err.message : 'Installation failed';
    res.status(500).json({ error: msg });
  }
});

// ---- Server starten (Devvit Gateway mountet das automatisch) ----
const port = getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error('server error', err));
server.listen(port, () => console.log(`[srv] listening on ${port}`));
