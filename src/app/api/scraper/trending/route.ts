import { NextResponse } from "next/server";
import { getTrending } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getTrending();
  return NextResponse.json(data);
}
