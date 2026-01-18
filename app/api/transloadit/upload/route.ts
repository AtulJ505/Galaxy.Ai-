import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const uploadSchema = z.object({
  file: z.string(), // Base64 encoded file or URL
  fileType: z.enum(["image", "video"]),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { file, fileType } = uploadSchema.parse(body);

    // Transloadit integration
    // This is a placeholder - you'll need to implement actual Transloadit upload
    const TRANSLOADIT_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY;
    const TRANSLOADIT_SECRET = process.env.TRANSLOADIT_SECRET;

    if (!TRANSLOADIT_KEY || !TRANSLOADIT_SECRET) {
      return NextResponse.json(
        { error: "Transloadit not configured" },
        { status: 500 }
      );
    }

    // In production, implement actual Transloadit upload
    // For now, return a placeholder URL
    const uploadedUrl = file; // Placeholder - should be Transloadit URL

    return NextResponse.json({ url: uploadedUrl });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
