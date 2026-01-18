export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createExecutionPlan, collectNodeInputs } from "@/lib/workflow-execution";
import { GoogleGenerativeAI } from "@google/generative-ai";

const executeSchema = z.object({
  workflowId: z.string(),
  nodeIds: z.array(z.string()).optional(),
  nodes: z.any().optional(),
  edges: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, nodeIds, nodes: reqNodes, edges: reqEdges } = executeSchema.parse(body);

    // Fetch workflow
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const nodes = Array.isArray(reqNodes)
      ? (reqNodes as any[])
      : Array.isArray(workflow.nodes)
      ? (workflow.nodes as any[])
      : [];
    const edges = Array.isArray(reqEdges)
      ? (reqEdges as any[])
      : Array.isArray(workflow.edges)
      ? (workflow.edges as any[])
      : [];

    // Determine execution scope
    const scope = nodeIds
      ? nodeIds.length === 1
        ? "SINGLE"
        : "PARTIAL"
      : "FULL";

    const selectedNodes: string[] = nodeIds || nodes.map((n: any) => n.id);

    // Create workflow run
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        userId: user.id,
        status: "RUNNING",
        scope: scope as any,
        selectedNodes: selectedNodes.length > 0 ? (selectedNodes as any) : null,
      },
    });

    // Start execution asynchronously
    ;(async () => {
      const start = Date.now();
      try {
        const plan = createExecutionPlan(nodes, edges, selectedNodes);
        const nodeOutputs = new Map<string, Record<string, any>>();

        for (const nodeId of plan.executionOrder) {
          if (!selectedNodes.includes(nodeId)) continue;
          const rfNode = nodes.find((n) => n.id === nodeId);
          if (!rfNode) continue;

          const nodeType = rfNode.data?.nodeType || rfNode.type || "unknown";
          const inputs = collectNodeInputs(nodeId, nodes, edges, nodeOutputs);

          const nodeRun = await prisma.nodeRun.create({
            data: {
              runId: run.id,
              nodeId,
              nodeType,
              status: "RUNNING",
              inputs,
            },
          });

          const nodeStart = Date.now();
          let outputs: Record<string, any> | undefined = undefined;
          let errorMsg: string | undefined = undefined;

          try {
            switch (nodeType) {
              case "text": {
                const text = rfNode.data?.text || "";
                outputs = { output: text };
                break;
              }
              case "uploadImage": {
                const url = rfNode.data?.imageUrl || "";
                outputs = { outputUrl: url };
                break;
              }
              case "uploadVideo": {
                const url = rfNode.data?.videoUrl || "";
                outputs = { outputUrl: url };
                break;
              }
              case "cropImage": {
                const url =
                  (rfNode.data?.outputUrl as string) ??
                  (inputs.image_url as string) ??
                  (rfNode.data?.imageUrl as string) ??
                  (inputs.input as string) ??
                  "";
                outputs = { outputUrl: url };
                break;
              }
              case "extractFrame": {
                const url = ((rfNode.data?.outputUrl as string) ?? (inputs.video_url as string) ?? rfNode.data?.videoUrl ?? (inputs.input as string) ?? "") as string;
                // If URL is already a data URL image, pass through; if it's a data URL video, no server-side extraction
                // Keep placeholder: swap extension for remote URLs only
                const out =
                  typeof url === "string" && /^data:image\//.test(url)
                    ? url
                    : typeof url === "string" && /^https?:\/\//.test(url)
                    ? url.replace(/\.(mp4|mov|webm|m4v)$/i, ".jpg")
                    : "";
                outputs = { outputUrl: out };
                break;
              }
              case "llm": {
                const systemPrompt =
                  (inputs.system_prompt as string) ?? rfNode.data?.systemPrompt ?? "";
                const userMessage =
                  (inputs.user_message as string) ?? rfNode.data?.userMessage ?? "";
                const imagesInput = inputs.images;
                const images: string[] = Array.isArray(imagesInput)
                  ? imagesInput.filter(Boolean)
                  : imagesInput
                  ? [imagesInput]
                  : [];

                if (!process.env.GOOGLE_AI_API_KEY) {
                  throw new Error("GOOGLE_AI_API_KEY not configured");
                }
                const modelName = "gemini-1.5-flash";

                const parts: any[] = [];
                if (systemPrompt) parts.push({ text: systemPrompt + "\n\n" });
                parts.push({ text: userMessage || "" });
                // accept images from 'images' or fallback handles if present
                const imageCandidates = images.length
                  ? images
                  : (() => {
                      const fallbacks: any[] = [];
                      const maybeInput = inputs.input;
                      const maybeOutput = inputs.output;
                      if (Array.isArray(maybeInput)) fallbacks.push(...maybeInput);
                      else if (maybeInput) fallbacks.push(maybeInput);
                      if (Array.isArray(maybeOutput)) fallbacks.push(...maybeOutput);
                      else if (maybeOutput) fallbacks.push(maybeOutput);
                      return fallbacks.filter(Boolean);
                    })();
                {
                  const maxImages = Math.min(2, imageCandidates.length);
                  const urls = imageCandidates.slice(0, maxImages);
                  const tasks = urls.map(async (imageUrl) => {
                    try {
                      if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
                        const match = imageUrl.match(/^data:(.*?);base64,(.*)$/);
                        if (match) {
                          const mimeType = match[1] || "image/jpeg";
                          const data = match[2] || "";
                          return { inlineData: { data, mimeType } };
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

                let text = "";
                let lastError: any = null;
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
                        .map((m: any) => String(m.name || "").replace(/^models\//, ""));
                    }
                  }
                } catch {}
                const preferredOrder = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];
                const candidates = Array.from(
                  new Set([...preferredOrder, ...listModels].filter((n) => String(n).includes("flash")))
                );
                for (const name of candidates) {
                  for (const version of ["v1", "v1beta"] as const) {
                    try {
                      const resp = await fetch(
                        `https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            contents: [{ role: "user", parts }],
                          }),
                        }
                      );
                      if (!resp.ok) {
                        const errText = await resp.text();
                        const msg = errText || `HTTP ${resp.status}`;
                        lastError = new Error(msg);
                        const notFound = msg.includes("not found") || msg.includes("404");
                        if (notFound) continue;
                        throw new Error(msg);
                      }
                      const data = await resp.json();
                      text =
                        (data.candidates &&
                          data.candidates[0] &&
                          data.candidates[0].content &&
                          Array.isArray(data.candidates[0].content.parts) &&
                          data.candidates[0].content.parts
                            .map((p: any) => p.text || "")
                            .join("")) ||
                        "";
                      lastError = null;
                      break;
                    } catch (e: any) {
                      lastError = e;
                    }
                  }
                  if (text) break;
                }
                if (!text && lastError) {
                  throw lastError;
                }
                outputs = { output: text, model: "gemini-1.5-flash" };
                break;
              }
              default: {
                outputs = { output: rfNode.data?.output ?? rfNode.data };
              }
            }

            if (outputs) {
              nodeOutputs.set(nodeId, outputs);
            }
            await prisma.nodeRun.update({
              where: { id: nodeRun.id },
              data: {
                status: "SUCCESS",
                outputs: (outputs as any) ?? null,
                duration: Date.now() - nodeStart,
                completedAt: new Date(),
              },
            });
          } catch (err: any) {
            errorMsg = err?.message || "Execution failed";
            await prisma.nodeRun.update({
              where: { id: nodeRun.id },
              data: {
                status: "FAILED",
                error: errorMsg,
                duration: Date.now() - nodeStart,
                completedAt: new Date(),
              },
            });
            throw err;
          }
        }

        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCESS",
            duration: Date.now() - start,
            completedAt: new Date(),
          },
        });
      } catch (err: any) {
        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            duration: Date.now() - start,
            completedAt: new Date(),
          },
        });
      }
    })();

    return NextResponse.json({ runId: run.id, run });
  } catch (error: any) {
    console.error("Error executing workflow:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}
