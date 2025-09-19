// src/server/routes/ingest.ts
import type { SeedItem, WhitelistEntry, Media } from "../../shared/types";

type RedditImage = {
  url: string;
  width?: number;
  height?: number;
};

type Parsed = {
  title: string;
  subreddit: string;
  sourceUrl: string;
  media:
    | { type: "image"; thumbUrl: string; url?: string; width?: number; height?: number }
    | { type: "video"; thumbUrl: string; url?: string; width?: number; height?: number };
};

// Minimal-Typen für das Reddit-JSON (nur was wir brauchen)
type RedditListing<T> = {
  data?: {
    children?: Array<{ data?: T }>;
  };
};

type RedditPreviewImageSource = { url: string; width?: number; height?: number };
type RedditPreviewImage = {
  source?: RedditPreviewImageSource;
  resolutions?: RedditPreviewImageSource[];
};

type RedditVideo = {
  fallback_url?: string;
  width?: number;
  height?: number;
};

type RedditPost = {
  title?: string;
  subreddit?: string;
  permalink?: string;
  is_video?: boolean;
  media?: { reddit_video?: RedditVideo };
  preview?: { images?: RedditPreviewImage[] };
  thumbnail?: string; // kann http-URL sein
  url_overridden_by_dest?: string;
};

function pickBestImage(images: RedditImage[] | undefined): RedditImage | undefined {
  if (!images?.length) return undefined;
  return images.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
}

function htmlUrlDecode(u: string | undefined): string | undefined {
  return typeof u === "string" ? u.replace(/&amp;/g, "&") : undefined;
}

async function parseReddit(urlStr: string): Promise<Parsed> {
  const jsonUrl = urlStr.endsWith(".json") ? urlStr : `${urlStr.replace(/\/$/, "")}.json`;

  const res = await fetch(jsonUrl, { headers: { "User-Agent": "threadguessr-dev/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch reddit JSON: ${res.status}`);

  // JSON sicher als Array casten
  const raw = (await res.json()) as unknown;
  const arr = Array.isArray(raw) ? (raw as Array<RedditListing<RedditPost>>) : [];
  const post = arr[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error("Unexpected reddit JSON format");

  const title = post.title ?? "(ohne Titel)";
  const subreddit = post.subreddit ?? "unknown";
  const permalink = post.permalink ? `https://reddit.com${post.permalink}` : urlStr;
  const sourceUrl = permalink;

  // Video-Fall
  const rv = post.media?.reddit_video;
  if (post.is_video && rv?.fallback_url) {
    const width =
      rv.width ?? post.preview?.images?.[0]?.source?.width;
    const height =
      rv.height ?? post.preview?.images?.[0]?.source?.height;

    // Thumb: bevorzugt echtes Vorschaubild → sonst thumbnail → sonst der Fallback-URL
    const thumbFromPreview = htmlUrlDecode(post.preview?.images?.[0]?.resolutions?.[0]?.url);
    const thumb =
      (post.thumbnail && post.thumbnail.startsWith("http") ? post.thumbnail : undefined) ??
      thumbFromPreview ??
      rv.fallback_url;

    return {
      title,
      subreddit,
      sourceUrl,
      media: {
        type: "video",
        thumbUrl: thumb,
        url: rv.fallback_url,
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      },
    };
  }

  // Bild-Fall mit preview
  const img = post.preview?.images?.[0];
  if (img?.source?.url) {
    const allCandidates: RedditImage[] = [
      {
        url: htmlUrlDecode(img.source.url)!,
        ...(typeof img.source.width === 'number' ? { width: img.source.width } : {}),
        ...(typeof img.source.height === 'number' ? { height: img.source.height } : {}),
      },
      ...((img.resolutions ?? []).map((r): RedditImage => ({
        url: htmlUrlDecode(r.url)!,
        ...(typeof r.width === 'number' ? { width: r.width } : {}),
        ...(typeof r.height === 'number' ? { height: r.height } : {}),
      }))),
    ];
    const best = pickBestImage(allCandidates);
    const thumb =
      htmlUrlDecode(img.resolutions?.[0]?.url) ??
      best?.url ??
      post.url_overridden_by_dest ??
      htmlUrlDecode(img.source.url)!;

    return {
      title,
      subreddit,
      sourceUrl,
      media: {
        type: "image",
        thumbUrl: thumb,
        // ACHTUNG: sorge dafür, dass url für images nie undefined ist
        url: best?.url ?? thumb,
        ...(best?.width ? { width: best.width } : {}),
        ...(best?.height ? { height: best.height } : {}),
      },
    };
  }

  // Direkte Bild-/i.redd.it-URL
  if (typeof post.url_overridden_by_dest === "string") {
    const u = post.url_overridden_by_dest;
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(u) || u.includes("i.redd.it/");
    if (isImage) {
      return {
        title,
        subreddit,
        sourceUrl,
        media: {
          type: "image",
          thumbUrl: u,
          url: u, // niemals undefined bei image
        },
      };
    }
  }

  // Thumbnail-Fallback
  if (post.thumbnail && post.thumbnail.startsWith("http")) {
    return {
      title,
      subreddit,
      sourceUrl,
      media: { type: "image", thumbUrl: post.thumbnail, url: post.thumbnail },
    };
  }

  throw new Error("No media found on post");
}

function suggestTags(sub: string, whitelist: WhitelistEntry[]): { group?: string; tags: string[] } {
  const w = whitelist.find((x) => x.name.toLowerCase() === sub.toLowerCase());
  return w ? { group: w.group, tags: w.tags ?? [] } : { tags: [] };
}

export async function ingestHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const postUrl = url.searchParams.get("url");
  if (!postUrl) {
    return new Response(JSON.stringify({ error: "Missing url param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = await parseReddit(postUrl);

    // Whitelist synchron beziehen (kein ungenutzter Import)
    const { Store } = await import("../services/store");
    const { group, tags } = suggestTags(parsed.subreddit, Store.getWhitelist());

    // Media für SeedItem präzise auf dein Shared-Union mappen
    let media: Media;
    if (parsed.media.type === "video") {
      media = {
        type: "video",
        thumbUrl: parsed.media.thumbUrl,
        ...(parsed.media.url ? { url: parsed.media.url } : {}),
        ...(parsed.media.width ? { width: parsed.media.width } : {}),
        ...(parsed.media.height ? { height: parsed.media.height } : {}),
        // falls dein Media-Video-Typ hlsUrl optional kennt, kannst du sie weglassen → kein `undefined` schreiben
      } as Media;
    } else {
      // image: url darf NICHT undefined sein
      const urlFinal = parsed.media.url ?? parsed.media.thumbUrl;
      media = {
        type: "image",
        thumbUrl: parsed.media.thumbUrl,
        url: urlFinal,
        ...(parsed.media.width ? { width: parsed.media.width } : {}),
        ...(parsed.media.height ? { height: parsed.media.height } : {}),
      } as Media;
    }

    const now = Date.now();

    const seed: SeedItem = {
      id: `seed-${now}`,
      title: parsed.title,
      media,
      answerSub: parsed.subreddit,
      ...(group ? { group } : {}),
      tags,
      sourceUrl: parsed.sourceUrl,
      distractors: [],
      active: true,
      status: 'approved',
      addedAt: now,
    };

    return new Response(JSON.stringify(seed, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ingest] error", err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
