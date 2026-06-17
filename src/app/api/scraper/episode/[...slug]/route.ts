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
  const contentType = request.nextUrl.searchParams.get("type") || "tv-series";
  const isMovie = contentType === "movie";
  // For movies, always use se=0, ep=0; for TV series use actual values
  const season = isMovie ? 0 : parseInt(request.nextUrl.searchParams.get("se") || "1");
  const episode = isMovie ? 0 : parseInt(request.nextUrl.searchParams.get("ep") || "1");

  if (subjectId) {
    // Use play API for actual video streams
    const streams = await getEpisodeStreams(subjectId, season, episode, slugStr);

    return NextResponse.json({
      videoUrl: streams.length > 0 ? streams[0].url : undefined,
      streamServers: streams,
    });
  }

  // Fallback to HTML scraping
  const data = await getEpisodeDetail(slugStr);
  return NextResponse.json(data);
}
