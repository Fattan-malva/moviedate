import { NextResponse } from "next/server";
import { getLatest } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLatest();
  return NextResponse.json(data);
}
