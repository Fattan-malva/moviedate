"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import VideoPlayer from "./VideoPlayer";

interface StreamServer {
  name: string;
  url: string;
  resolution?: string;
}

interface Episode {
  slug: string;
  number: string;
  title?: string;
  season?: number;
}

interface EpisodeDetail {
  videoUrl?: string;
  streamServers?: StreamServer[];
  prev?: string;
  next?: string;
  episodes?: Episode[];
}

interface MoviePlayerWrapperProps {
  /** Initial video URL from detail page */
  initialVideoUrl?: string;
  /** Initial stream servers from detail page */
  initialStreamServers?: StreamServer[];
  /** Episode list from detail page */
  episodes?: Episode[];
  /** Current movie slug */
  slug: string;
  /** Movie title */
  title: string;
  /** Subject ID for play API */
  subjectId?: string;
  /** Content type: movie or tv-series */
  contentType?: string;
}

export default function MoviePlayerWrapper({
  initialVideoUrl,
  initialStreamServers = [],
  episodes = [],
  slug,
  title,
  subjectId,
  contentType = "tv-series",
}: MoviePlayerWrapperProps) {
  // If episodes exist, default currentSlug to the first episode's slug
  // so the episode button is highlighted on load
  const initialEpisodeSlug = episodes.length > 0 ? episodes[0].slug : slug;

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [streamServers, setStreamServers] = useState(initialStreamServers);
  const [currentSlug, setCurrentSlug] = useState(initialEpisodeSlug);
  const [currentEpisodes, setCurrentEpisodes] = useState(episodes);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Key to force VideoPlayer remount when episode changes
  const [playerKey, setPlayerKey] = useState(0);

  // Use ref to avoid stale closure in loadEpisode
  const episodesRef = useRef(currentEpisodes);
  episodesRef.current = currentEpisodes;

  // Compute initial prev/next from episodes list
  const initialIdx = useMemo(() => {
    return episodes.findIndex((ep) => ep.slug === initialEpisodeSlug);
  }, [episodes, initialEpisodeSlug]);

  const [prevSlug, setPrevSlug] = useState<string | undefined>(
    initialIdx > 0 ? episodes[initialIdx - 1]?.slug : undefined
  );
  const [nextSlug, setNextSlug] = useState<string | undefined>(
    initialIdx >= 0 && initialIdx < episodes.length - 1
      ? episodes[initialIdx + 1]?.slug
      : undefined
  );

  const loadEpisode = useCallback(async (episodeSlug: string, season?: number, episode?: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      let url: string;
      if (subjectId && season !== undefined && episode !== undefined) {
        url = `/api/scraper/episode/${episodeSlug}?subjectId=${subjectId}&se=${season}&ep=${episode}&type=${contentType}`;
      } else {
        url = `/api/scraper/episode/${episodeSlug}?type=${contentType}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: EpisodeDetail = await res.json();

      const newUrl = data.videoUrl || data.streamServers?.[0]?.url || "";
      if (!newUrl) {
        setLoadError("No video stream available for this episode.");
        return;
      }
      setVideoUrl(newUrl);
      setStreamServers(data.streamServers || []);
      setCurrentSlug(episodeSlug);
      // Force remount so iframe/video re-renders with new URL
      setPlayerKey((k) => k + 1);

      // Compute prev/next from the LATEST episode list via ref
      const eps = episodesRef.current;
      const currentIdx = eps.findIndex(
        (ep) => ep.slug === episodeSlug || (ep.season === season && parseInt(ep.number) === episode)
      );
      setPrevSlug(currentIdx > 0 ? eps[currentIdx - 1]?.slug : undefined);
      setNextSlug(
        currentIdx >= 0 && currentIdx < eps.length - 1
          ? eps[currentIdx + 1]?.slug
          : undefined
      );

      // Update episodes list if the response includes them
      if (data.episodes && data.episodes.length > 0) {
        setCurrentEpisodes(data.episodes);
      }
    } catch (err: any) {
      console.error("Failed to load episode:", err);
      setLoadError(err?.message || "Failed to load episode. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [subjectId, contentType]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-2xl">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            Loading episode...
          </div>
        </div>
      )}
      {loadError && !loading && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{loadError}</span>
          <button
            onClick={() => { setLoadError(null); loadEpisode(currentSlug); }}
            className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      <VideoPlayer
        key={playerKey}
        videoUrl={videoUrl}
        streamServers={streamServers}
        title={title}
        episodes={currentEpisodes}
        currentEpisodeSlug={currentSlug}
        onEpisodeSelect={loadEpisode}
        prevSlug={prevSlug}
        nextSlug={nextSlug}
      />
    </div>
  );
}
