import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "DB error" }, { status: 500 })
  }
}
