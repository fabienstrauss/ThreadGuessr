import whitelistJson from "../data/whitelist.json" assert { type: "json" };
import seedsJson from "../data/seeds.json" assert { type: "json" };
import { Store } from "./services/store";
import { getRoundHandler } from "./routes/round";
import { postGuessHandler } from "./routes/guess";
import { postReportHandler } from "./routes/report";

import type { GuessRequest, SeedItem, WhitelistEntry } from "../shared/types";

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isGuessRequest(x: unknown): x is GuessRequest {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.roundId === "string" && typeof o.answerSub === "string";
}

export function bootstrap(
  register: (method: "GET" | "POST", path: string, handler: (req: Request) => Promise<Response> | Response) => void,
  getUserId: () => string
) {
  Store.loadWhitelist(whitelistJson as unknown as WhitelistEntry[]);
  Store.loadSeeds(seedsJson as unknown as SeedItem[]);

  register("GET", "/api/round", async (_req: Request) => {
    const userId = getUserId();
    const payload = await getRoundHandler({ userId, dayKey: todayKey() });
    return json(payload);
  });

  register("POST", "/api/guess", async (req: Request) => {
    const userId = getUserId();
    const raw = await req.json();
    if (!isGuessRequest(raw)) {
      return errJson(new Error("Invalid body for /api/guess"));
    }
    const payload = await postGuessHandler({ userId, dayKey: todayKey() }, raw);
    return json(payload);
  });

  register("POST", "/api/report", async (req: Request) => {
    const userId = getUserId();
    const url = new URL(req.url, "http://localhost");
    const rid = url.searchParams.get("roundId");
    const args: { userId: string; roundId?: string } = { userId };
    if (rid) args.roundId = rid;
    await postReportHandler(args);
    return new Response(null, { status: 204 });
  });
}

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


function errJson(err: unknown) {
  const msg =
    err instanceof Error ? err.message :
      typeof err === "string" ? err :
        "Unknown error";
  return new Response(JSON.stringify({ error: msg }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
