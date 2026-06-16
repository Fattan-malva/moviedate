import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q") ?? "";
  const page = Number(params.get("page") ?? "1");
  const data = query ? await search(query, Number.isFinite(page) ? page : 1) : { items: [], currentPage: 1, totalPages: 1 };
  return NextResponse.json(data);
}
