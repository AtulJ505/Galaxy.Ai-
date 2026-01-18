export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { cropImageFF } from "@/trigger/crop-image-task";

const cropSchema = z.object({
  imageUrl: z.string().url(),
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  widthPercent: z.number().min(1).max(100),
  heightPercent: z.number().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = cropSchema.parse(body);

    const result = await cropImageFF({
      imageUrl: data.imageUrl,
      xPercent: data.xPercent,
      yPercent: data.yPercent,
      widthPercent: data.widthPercent,
      heightPercent: data.heightPercent,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to crop image" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, outputUrl: result.outputUrl });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to crop image" },
      { status: 500 }
    );
  }
}
