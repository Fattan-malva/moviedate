"use client";

import { useState, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";

interface StreamServer {
  name: string;
  url: string;
}

interface Episode {
  slug: string;
  number: string;
  title?: string;
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
}

export default function MoviePlayerWrapper({
  initialVideoUrl,
  initialStreamServers = [],
  episodes = [],
  slug,
  title,
}: MoviePlayerWrapperProps) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [streamServers, setStreamServers] = useState(initialStreamServers);
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [currentEpisodes, setCurrentEpisodes] = useState(episodes);
  const [prevSlug, setPrevSlug] = useState<string | undefined>();
  const [nextSlug, setNextSlug] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const loadEpisode = useCallback(async (episodeSlug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scraper/episode/${episodeSlug}`);
      if (!res.ok) throw new Error("Failed to fetch episode");
      const data: EpisodeDetail = await res.json();

      setVideoUrl(data.videoUrl || data.streamServers?.[0]?.url || "");
      setStreamServers(data.streamServers || []);
      setCurrentSlug(episodeSlug);
      setPrevSlug(data.prev);
      setNextSlug(data.next);

      // Update episodes list if the response includes them
      if (data.episodes && data.episodes.length > 0) {
        setCurrentEpisodes(data.episodes);
      }
    } catch (err) {
      console.error("Failed to load episode:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      <VideoPlayer
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
