import { NextRequest, NextResponse } from "next/server";
import { getGenre } from "@/lib/scraper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params;
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const data = await getGenre(slug.join("/"), Number.isFinite(page) ? page : 1);
  return NextResponse.json(data);
}
