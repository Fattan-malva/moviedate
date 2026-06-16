import { NextRequest, NextResponse } from "next/server";
import { getDetail } from "@/lib/scraper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  const { slug } = await params;
  const data = await getDetail(slug.join("/"));
  return NextResponse.json(data);
}
