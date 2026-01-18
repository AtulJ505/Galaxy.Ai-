import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { extractFrameFF } from "@/trigger/extract-frame-task";

const extractFrameSchema = z.object({
  videoUrl: z.string().url(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = extractFrameSchema.parse(body);

    const result = await extractFrameFF({
      videoUrl: data.videoUrl,
      timestamp: data.timestamp,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to extract frame" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, outputUrl: result.outputUrl });
  } catch (error: any) {
    console.error("Error extracting frame:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to extract frame" },
      { status: 500 }
    );
  }
}
