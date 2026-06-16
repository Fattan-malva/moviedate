import { NextResponse } from "next/server";
import { getGenres } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getGenres();
  return NextResponse.json(data);
}
