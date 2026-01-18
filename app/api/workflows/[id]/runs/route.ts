import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    const runs = await prisma.workflowRun.findMany({
      where: {
        workflowId: params.id,
        userId: user.id,
      },
      include: {
        nodeRuns: {
          orderBy: { startedAt: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}
