export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: true, db: false });
    }

    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ ok: true, db: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "DB error" },
      { status: 500 }
    );
  }
}
