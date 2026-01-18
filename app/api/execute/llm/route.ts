export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
// Trigger.dev integration can be added here if desired

const llmSchema = z.object({
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  images: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
  nodeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_AI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const data = llmSchema.parse(body);

    const defaultModel = "gemini-1.5-flash";

    // Build parts array for multimodal input
    const parts: any[] = [];

    if (data.systemPrompt) {
      parts.push({ text: data.systemPrompt + "\n\n" });
    }

    parts.push({ text: data.userMessage });

    if (data.images?.length) {
      const maxImages = Math.min(2, data.images.length);
      const urls = data.images.slice(0, maxImages);
      const tasks = urls.map(async (imageUrl) => {
        try {
          if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
            const match = imageUrl.match(/^data:(.*?);base64,(.*)$/);
            if (match) {
              const mimeType = match[1] || "image/jpeg";
              const dataB64 = match[2] || "";
              return { inlineData: { data: dataB64, mimeType } };
            }
            return null;
          }
          if (typeof imageUrl === "string" && /^https?:\/\//.test(imageUrl)) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(imageUrl, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) return null;
            const ct = res.headers.get("content-type") || "";
            if (!ct.toLowerCase().startsWith("image/")) return null;
            const cl = parseInt(res.headers.get("content-length") || "0", 10);
            if (isFinite(cl) && cl > 10 * 1024 * 1024) return null;
            const buffer = await res.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = ct || "image/jpeg";
            return { inlineData: { data: base64, mimeType } };
          }
          return null;
        } catch {
          return null;
        }
      });
      const results = await Promise.allSettled(tasks);
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          parts.push(r.value as any);
        }
      }
    }

    let listModels: string[] = [];
    try {
      const listResp = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_AI_API_KEY}`
      );
      if (listResp.ok) {
        const listData = await listResp.json();
        if (Array.isArray(listData.models)) {
          listModels = listData.models
            .filter(
              (m: any) =>
                String(m.name || "").includes("flash") &&
                (!m.supportedGenerationMethods ||
                  (Array.isArray(m.supportedGenerationMethods) &&
                    m.supportedGenerationMethods.includes("generateContent")))
            )
            .map((m: any) => String(m.name || ""));
        }
      }
    } catch {}
    const preferredOrder = [defaultModel, "gemini-1.5-flash-latest", "gemini-2.0-flash"];
    const candidates = Array.from(new Set([...listModels, ...preferredOrder]));
    const versions: Array<"v1" | "v1beta"> = ["v1", "v1beta"];
    let text = "";
    let lastErr: any = null;
    for (const name of candidates) {
      for (const version of versions) {
        const endpoints = [
          `https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
          String(name).startsWith("models/")
            ? `https://generativelanguage.googleapis.com/${version}/${name}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`
            : `https://generativelanguage.googleapis.com/${version}/models/models/${name}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
        ];
        for (const url of endpoints) {
          try {
            const resp = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts }],
              }),
            });
            if (!resp.ok) {
              const errText = await resp.text();
              const msg = errText || `HTTP ${resp.status}`;
              // 404: model not found -> continue to next candidate
              if (String(msg).includes("404") || String(msg).toLowerCase().includes("not found")) {
                lastErr = new Error(msg);
                continue;
              }
              throw new Error(msg);
            }
            const result = await resp.json();
            text =
              (result.candidates &&
                result.candidates[0] &&
                result.candidates[0].content &&
                Array.isArray(result.candidates[0].content.parts) &&
                result.candidates[0].content.parts.map((p: any) => p.text || "").join("")) ||
              "";
            lastErr = null;
            break;
          } catch (e: any) {
            lastErr = e;
          }
        }
        if (text) break;
      }
      if (text) break;
    }
    if (!text && lastErr) {
      throw lastErr;
    }

    // If workflowId and nodeId provided, record in history
    try {
      if (data.workflowId && data.nodeId) {
        const { prisma } = await import("@/lib/db");
        const run = await prisma.workflowRun.create({
          data: {
            workflowId: data.workflowId,
            userId,
            status: "RUNNING",
            scope: "SINGLE" as any,
            selectedNodes: [data.nodeId] as any,
          },
        });
        const nodeRun = await prisma.nodeRun.create({
          data: {
            runId: run.id,
            nodeId: data.nodeId,
            nodeType: "llm",
            status: "RUNNING",
            inputs: {
              system_prompt: data.systemPrompt || null,
              user_message: data.userMessage,
              images: data.images || [],
            } as any,
          },
        });
        await prisma.nodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: "SUCCESS",
            outputs: { output: text } as any,
            completedAt: new Date(),
          },
        });
        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
          },
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      output: text,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: err.message || "LLM execution failed" },
      { status: 500 }
    );
  }
}
