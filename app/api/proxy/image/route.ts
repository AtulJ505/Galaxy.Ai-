import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  url: z.string().url(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url") || "";
    const { url } = querySchema.parse({ url: urlParam });

    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid scheme" }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.toLowerCase().startsWith("image/")) {
      const isHtml = ct.toLowerCase().includes("text/html");
      if (!isHtml) {
        return NextResponse.json({ error: "Not an image" }, { status: 400 });
      }
      const html = await res.text();
      const ogImageMatch =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      let imgUrl = ogImageMatch?.[1] || "";
      if (!imgUrl) {
        const imgMatch =
          html.match(/<img[^>]+src=["']([^"']+)["']/i) ||
          html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
        imgUrl = imgMatch?.[1] || "";
      }
      if (!imgUrl) {
        return NextResponse.json({ error: "No image found in page" }, { status: 404 });
      }
      let resolved: string;
      try {
        resolved = new URL(imgUrl, url).toString();
      } catch {
        return NextResponse.json({ error: "Invalid image URL in page" }, { status: 400 });
      }
      const imgController = new AbortController();
      const imgTimer = setTimeout(() => imgController.abort(), 5000);
      const imgRes = await fetch(resolved, { signal: imgController.signal });
      clearTimeout(imgTimer);
      if (!imgRes.ok) {
        return NextResponse.json({ error: `Image fetch failed: ${imgRes.status}` }, { status: 502 });
      }
      const imgCt = imgRes.headers.get("content-type") || "";
      if (!imgCt.toLowerCase().startsWith("image/")) {
        return NextResponse.json({ error: "Resolved URL is not image" }, { status: 400 });
      }
      const imgCl = parseInt(imgRes.headers.get("content-length") || "0", 10);
      if (isFinite(imgCl) && imgCl > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Image too large" }, { status: 413 });
      }
      const imgBuffer = await imgRes.arrayBuffer();
      return new NextResponse(Buffer.from(imgBuffer), {
        status: 200,
        headers: {
          "Content-Type": imgCt,
          "Cache-Control": "public, max-age=60",
        },
      });
    }
    const cl = parseInt(res.headers.get("content-length") || "0", 10);
    if (isFinite(cl) && cl > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return NextResponse.json({ error: "Timeout fetching image" }, { status: 504 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Proxy error" }, { status: 500 });
  }
}
