import { NextRequest, NextResponse } from "next/server";
import { getEpisodeDetail, getEpisodeStreams } from "@/lib/scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
    try {
      const streams = await getEpisodeStreams(subjectId, season, episode, slugStr);

      if (!streams || streams.length === 0) {
        return NextResponse.json({
          videoUrl: undefined,
          streamServers: [],
          error: "No streams available",
        });
      }

      return NextResponse.json({
        videoUrl: streams[0].url,
        streamServers: streams,
      });
    } catch (err: any) {
      console.error(`Episode API error for ${slugStr}:`, err?.message || err);
      return NextResponse.json({
        videoUrl: undefined,
        streamServers: [],
        error: err?.message || "Failed to load streams",
      }, { status: 500 });
    }
  }

  // Fallback to HTML scraping
  try {
    const data = await getEpisodeDetail(slugStr);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(`Episode detail error for ${slugStr}:`, err?.message || err);
    return NextResponse.json({
      videoUrl: undefined,
      streamServers: [],
      episodes: [],
      error: err?.message || "Failed to load episode",
    }, { status: 500 });
  }
}
