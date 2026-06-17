import { NextRequest, NextResponse } from "next/server";
import { getEpisodeDetail, getEpisodeStreams } from "@/lib/scraper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  // Check for play API params
  const subjectId = request.nextUrl.searchParams.get("subjectId");
  const season = parseInt(request.nextUrl.searchParams.get("se") || "0");
  const episode = parseInt(request.nextUrl.searchParams.get("ep") || "0");

  if (subjectId) {
    // Use play API for actual video streams
    const streams = await getEpisodeStreams(subjectId, season, episode, slugStr);
    return NextResponse.json({
      videoUrl: streams.length > 0 ? streams[0].url : undefined,
      streamServers: streams,
      episodes: [],
    });
  }

  // Fallback to HTML scraping
  const data = await getEpisodeDetail(slugStr);
  return NextResponse.json(data);
}
