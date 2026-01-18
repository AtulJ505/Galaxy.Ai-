import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const workflowSchema = z.object({
  name: z.string().optional(),
  nodes: z.any().optional(),
  edges: z.any().optional(),
  viewport: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
          include: {
            nodeRuns: true,
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const workflow = await prisma.workflow.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nodes && { nodes: sanitizedNodes }),
        ...(data.edges && { edges: data.edges }),
        ...(data.viewport && { viewport: data.viewport }),
      },
    });

    if (workflow.count === 0) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const updated = await prisma.workflow.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({ workflow: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.workflow.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
