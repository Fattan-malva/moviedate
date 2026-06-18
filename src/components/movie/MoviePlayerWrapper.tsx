"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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

interface DubTrack {
  subjectId: string;
  lanName: string;
  lanCode: string;
  type: number;
  original?: boolean;
  detailPath: string;
}

interface EpisodeDetail {
  videoUrl?: string;
  streamServers?: StreamServer[];
  prev?: string;
  next?: string;
  episodes?: Episode[];
}

interface MoviePlayerWrapperProps {
  initialVideoUrl?: string;
  initialStreamServers?: StreamServer[];
  episodes?: Episode[];
  slug: string;
  title: string;
  subjectId?: string;
  contentType?: string;
  dubs?: DubTrack[];
}

export default function MoviePlayerWrapper({
  initialVideoUrl,
  initialStreamServers = [],
  episodes = [],
  slug,
  title,
  subjectId,
  contentType = "tv-series",
  dubs,
}: MoviePlayerWrapperProps) {
  const initialEpisodeSlug = episodes.length > 0 ? episodes[0].slug : slug;

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [streamServers, setStreamServers] = useState(initialStreamServers);
  const [currentSlug, setCurrentSlug] = useState(initialEpisodeSlug);
  const [currentEpisodes, setCurrentEpisodes] = useState(episodes);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0);

  const episodesRef = useRef(currentEpisodes);
  episodesRef.current = currentEpisodes;

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

  const hasInitialStream = !!(initialVideoUrl || initialStreamServers?.length);
  const initialLoadDone = useRef(false);

  // Active dub/subtitle state (persists across VideoPlayer remounts)
  const audioTracks = useMemo(() => dubs?.filter((d) => d.type === 0) || [], [dubs]);

  const [activeAudioId, setActiveAudioId] = useState<string>(() => {
    if (!dubs || dubs.length === 0) return "";
    const original = dubs.find((d) => d.original);
    if (original) return original.subjectId;
    if (audioTracks.length > 0) return audioTracks[0].subjectId;
    return "";
  });
  const [activeSubId, setActiveSubId] = useState<string>("");

  useEffect(() => {
    if (!dubs || dubs.length === 0) return;
    const original = dubs.find((d) => d.original);
    if (original && !activeAudioId) {
      setActiveAudioId(original.subjectId);
    } else if (!activeAudioId && audioTracks.length > 0) {
      setActiveAudioId(audioTracks[0].subjectId);
    }
  }, [dubs, audioTracks, activeAudioId]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    if (!hasInitialStream && subjectId) {
      const isMovie = episodes.length === 0;
      if (isMovie) {
        loadEpisode(slug, 0, 0);
      } else if (episodes.length > 0) {
        loadEpisode(episodes[0].slug, episodes[0].season, parseInt(episodes[0].number));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEpisode = useCallback(async (episodeSlug: string, season?: number, episode?: number, dubSubjectId?: string, dubDetailPath?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      let url: string;
      if (subjectId && season !== undefined && episode !== undefined) {
        url = `/api/scraper/episode/${episodeSlug}?subjectId=${subjectId}&se=${season}&ep=${episode}&type=${contentType}`;
        if (dubSubjectId) {
          url += `&dubSubjectId=${dubSubjectId}`;
        }
        if (dubDetailPath) {
          url += `&dubDetailPath=${dubDetailPath}`;
        }
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

      // Remount VideoPlayer for episode/audio changes so
      // internal state (loading, error, activeServer) resets cleanly
      // Subtitle changes skip this to keep the player playing seamlessly
      setPlayerKey((k) => k + 1);

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

  const handleAudioChange = useCallback((dub: DubTrack) => {
    setActiveAudioId(dub.subjectId);
    const currentEp = currentEpisodes.find((ep) => ep.slug === currentSlug);
    loadEpisode(currentSlug, currentEp?.season, currentEp ? parseInt(currentEp.number) : undefined, dub.subjectId, dub.detailPath);
  }, [currentEpisodes, currentSlug, loadEpisode]);

  const handleSubtitleChange = useCallback(async (dub: DubTrack) => {
    setActiveSubId(dub.subjectId);
    setLoading(true);
    setLoadError(null);
    try {
      const currentEp = currentEpisodes.find((ep) => ep.slug === currentSlug);
      const season = currentEp?.season;
      const episode = currentEp ? parseInt(currentEp.number) : undefined;
      let url = `/api/scraper/episode/${currentSlug}?subjectId=${subjectId}&se=${season}&ep=${episode}&type=${contentType}`;
      if (dub.subjectId) {
        url += `&dubSubjectId=${dub.subjectId}`;
        if (dub.detailPath) url += `&dubDetailPath=${dub.detailPath}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: EpisodeDetail = await res.json();
      const newUrl = data.videoUrl || data.streamServers?.[0]?.url || "";
      if (!newUrl) { setLoadError("No video stream available."); return; }
      setVideoUrl(newUrl);
      setStreamServers(data.streamServers || []);
    } catch (err: any) {
      setLoadError(err?.message || "Failed to load subtitle stream.");
    } finally {
      setLoading(false);
    }
  }, [currentEpisodes, currentSlug, subjectId, contentType]);

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
        onEpisodeSelect={(slug, season, episode) => loadEpisode(slug, season, episode)}
        prevSlug={prevSlug}
        nextSlug={nextSlug}
        dubs={dubs}
        activeAudioId={activeAudioId}
        activeSubId={activeSubId}
        onAudioChange={handleAudioChange}
        onSubtitleChange={handleSubtitleChange}
      />
    </div>
  );
}
