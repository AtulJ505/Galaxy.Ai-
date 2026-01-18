import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const workflowSchema = z.object({
  name: z.string().optional(),
  nodes: z.any(),
  edges: z.any(),
  viewport: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: userId, // You might want to get email from Clerk
        },
      });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = workflowSchema.parse(body);

    // Sanitize nodes to avoid saving large base64 payloads
    const sanitizedNodes = Array.isArray(data.nodes)
      ? data.nodes.map((n: any) => {
          const d = { ...(n?.data || {}) };
          if (typeof d.imageUrl === "string" && d.imageUrl.startsWith("data:")) {
            d.imageUrl = undefined;
          }
          if (typeof d.videoUrl === "string" && d.videoUrl.startsWith("data:")) {
            d.videoUrl = undefined;
          }
          if (typeof d.outputUrl === "string" && d.outputUrl.startsWith("data:")) {
            d.outputUrl = undefined;
          }
          return { ...n, data: d };
        })
      : data.nodes;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: userId,
        },
      });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name || "Untitled Workflow",
        userId: user.id,
        nodes: sanitizedNodes,
        edges: data.edges,
        viewport: data.viewport || {},
      },
    });

    return NextResponse.json({ workflow });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create workflow" },
      { status: 500 }
    );
  }
}
