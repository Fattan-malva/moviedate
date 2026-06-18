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
  // If explicit se/ep params provided, use them; otherwise treat as movie (0, 0)
  const seasonParam = request.nextUrl.searchParams.get("se");
  const episodeParam = request.nextUrl.searchParams.get("ep");
  const hasSeEp = seasonParam !== null && episodeParam !== null && seasonParam !== "";
  const season = hasSeEp ? parseInt(seasonParam!) : 0;
  const episode = hasSeEp ? parseInt(episodeParam!) : 0;

  if (subjectId) {
    // Use play API for actual video streams
    try {
      const streams = await getEpisodeStreams(subjectId, season, episode, slugStr, contentType);

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
