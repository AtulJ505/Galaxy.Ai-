export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";

function pick<T extends string>(headers: Headers, keys: T[]): Record<T, string> {
  const out = {} as Record<T, string>;
  for (const k of keys) {
    const v = headers.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return (
      h.includes("youtube.com") ||
      h.includes("youtu.be") ||
      h.includes("www.youtube.com") ||
      h.includes("m.youtube.com")
    );
  } catch {
    return false;
  }
}

async function resolveYouTubeStream(url: string): Promise<string | null> {
  try {
    const info = await ytdl.getInfo(url);
    const formats = (info.formats || []).filter((f) => Boolean(f.url));
    // Prefer MP4 with video (audio optional)
    const preferred =
      formats.find((f) => (f.mimeType || "").includes("video/mp4") && f.hasVideo) ||
      formats.find((f) => (f.container || "") === "mp4" && f.hasVideo) ||
      formats.find((f) => f.hasVideo) ||
      null;
    return preferred?.url || null;
  } catch {
    return null;
  }
}

async function resolveVideoUrl(url: string): Promise<string> {
  if (isYouTubeUrl(url)) {
    const yt = await resolveYouTubeStream(url);
    if (yt) return yt;
  }
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "*/*",
      },
    });
    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("text/html")) {
      return url;
    }
    const html = await resp.text();
    const metaVideo =
      html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+property=["']og:video:url["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+name=["']twitter:player:stream["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    if (metaVideo?.[1]) {
      return metaVideo[1];
    }
    const videoTag = html.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (videoTag?.[1]) {
      return videoTag[1];
    }
  } catch {}
  return url;
}

export async function GET(request: NextRequest) {
  try {
    const inputUrl = request.nextUrl.searchParams.get("url");
    if (!inputUrl) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const videoUrl = await resolveVideoUrl(inputUrl);
    const range = request.headers.get("range") || request.headers.get("Range") || undefined;

    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Accept: "video/*;q=0.9,*/*;q=0.8",
    };
    if (range) upstreamHeaders.Range = range;

    const resp = await fetch(videoUrl, {
      headers: upstreamHeaders,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: text || `Upstream error ${resp.status}` },
        { status: 502 }
      );
    }

    const passHeaders = new Headers();
    const upstreamPass = pick(resp.headers, [
      "content-type",
      "content-length",
      "accept-ranges",
      "content-range",
      "cache-control",
      "etag",
      "last-modified",
    ]);
    for (const [k, v] of Object.entries(upstreamPass)) {
      passHeaders.set(
        // Normalize header case to standard capitalization
        k
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("-"),
        v
      );
    }
    if (!passHeaders.get("Accept-Ranges")) {
      passHeaders.set("Accept-Ranges", "bytes");
    }
    passHeaders.set("Cache-Control", passHeaders.get("Cache-Control") || "no-store");

    return new NextResponse(resp.body, {
      status: resp.status,
      headers: passHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to proxy video" },
      { status: 500 }
    );
  }
}
