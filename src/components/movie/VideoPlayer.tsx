"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Play, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Check, Eye, Monitor, Film, Languages
} from "lucide-react";

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

interface SeasonGroup {
  season: number;
  episodes: Episode[];
}

interface DubTrack {
  subjectId: string;
  lanName: string;
  lanCode: string;
  type: number;
  original?: boolean;
  detailPath: string;
}

interface VideoPlayerProps {
  videoUrl?: string;
  streamServers?: StreamServer[];
  title?: string;
  episodes?: Episode[];
  currentEpisodeSlug?: string;
  onEpisodeSelect?: (slug: string, season?: number, episode?: number) => void;
  prevSlug?: string;
  nextSlug?: string;
  dubs?: DubTrack[];
  activeAudioId?: string;
  activeSubId?: string;
  onAudioChange?: (dub: DubTrack) => void;
  onSubtitleChange?: (dub: DubTrack) => void;
}

function isIframeUrl(url: string): boolean {
  return (
    url.includes("embed") ||
    url.includes("player") ||
    url.includes("iframe") ||
    url.includes("vidcloud") ||
    url.includes("streamtape") ||
    url.includes("streamsb") ||
    url.includes("doodstream") ||
    url.includes("mixdrop") ||
    url.includes("fembed") ||
    url.includes("filemoon") ||
    url.includes("upstream") ||
    url.includes("mp4upload") ||
    url.includes("ok.ru") ||
    url.includes("dailymotion") ||
    url.includes("youtube.com/embed") ||
    url.includes("youtu.be")
  );
}

function isDirectVideo(url: string): boolean {
  return (
    url.endsWith(".mp4") ||
    url.endsWith(".m3u8") ||
    url.endsWith(".webm") ||
    url.includes(".mp4?") ||
    url.includes(".m3u8?") ||
    url.includes("video/") ||
    url.includes("cdn") ||
    url.includes("/api/proxy-video")
  );
}

function getWatchedEpisodes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem("moviedate_watched_episodes");
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markEpisodeWatched(slug: string) {
  try {
    const stored = localStorage.getItem("moviedate_watched_episodes");
    const watched: string[] = stored ? JSON.parse(stored) : [];
    if (!watched.includes(slug)) {
      watched.push(slug);
      localStorage.setItem("moviedate_watched_episodes", JSON.stringify(watched));
    }
  } catch {}
}

function groupEpisodesBySeason(episodes: Episode[]): SeasonGroup[] {
  const groups: Record<number, Episode[]> = {};
  for (const ep of episodes) {
    const s = ep.season || 1;
    if (!groups[s]) groups[s] = [];
    groups[s].push(ep);
  }
  return Object.entries(groups)
    .map(([season, eps]) => ({ season: Number(season), episodes: eps }))
    .sort((a, b) => a.season - b.season);
}

function getEpisodeLabel(ep: Episode): string {
  if (ep.title && ep.title !== `Episode ${ep.number}` && ep.title !== `Season ${ep.season || 1} Episode ${ep.number}`) {
    return ep.title;
  }
  return "";
}

function getPrevNextEpisodeLabel(ep: Episode | undefined): string {
  if (!ep) return "";
  const label = getEpisodeLabel(ep);
  return label ? `Ep ${ep.number}: ${label}` : `Episode ${ep.number}`;
}

export default function VideoPlayer({
  videoUrl,
  streamServers = [],
  title = "",
  episodes = [],
  currentEpisodeSlug,
  onEpisodeSelect,
  prevSlug,
  nextSlug,
  dubs,
  activeAudioId: externalAudioId,
  activeSubId: externalSubId,
  onAudioChange,
  onSubtitleChange,
}: VideoPlayerProps) {
  const [activeServer, setActiveServer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(episodes.length > 0);
  const [watched, setWatched] = useState<Set<string>>(getWatchedEpisodes);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const episodeListRef = useRef<HTMLDivElement>(null);

  const activeUrl = videoUrl || streamServers[activeServer]?.url || "";

  useEffect(() => {
    setWatched(getWatchedEpisodes());
  }, [currentEpisodeSlug]);

  useEffect(() => {
    if (currentEpisodeSlug) {
      markEpisodeWatched(currentEpisodeSlug);
      setWatched(getWatchedEpisodes());
    }
  }, [currentEpisodeSlug]);

  useEffect(() => {
    if (videoUrl) {
      setActiveServer(0);
      setLoading(true);
      setError(false);
    }
  }, [videoUrl]);

  const seasonGroups = useMemo(() => groupEpisodesBySeason(episodes), [episodes]);
  const hasMultipleSeasons = seasonGroups.length > 1;
  const hasEpisodeTitles = episodes.some((ep) => getEpisodeLabel(ep));

  const currentEpisode = episodes.find((ep) => ep.slug === currentEpisodeSlug);
  const prevEpisode = episodes.find((ep) => ep.slug === prevSlug);
  const nextEpisode = episodes.find((ep) => ep.slug === nextSlug);

  const handleServerChange = useCallback((index: number) => {
    setActiveServer(index);
    setLoading(true);
    setError(false);
  }, []);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const scrollToEpisode = useCallback((slug: string) => {
    if (!episodeListRef.current) return;
    const btn = episodeListRef.current.querySelector(`[data-ep-slug="${slug}"]`);
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleEpisodeClick = useCallback((slug: string, season?: number, epNum?: number) => {
    onEpisodeSelect?.(slug, season, epNum);
    setTimeout(() => scrollToEpisode(slug), 100);
  }, [onEpisodeSelect, scrollToEpisode]);

  // Separate dubs into audio tracks and subtitle tracks
  const audioTracks = useMemo(() => dubs?.filter((d) => d.type === 0) || [], [dubs]);
  const subtitleTracks = useMemo(() => dubs?.filter((d) => d.type === 1) || [], [dubs]);

  if (!activeUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-3 text-gray-500">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm">No video available</p>
      </div>
    );
  }

  const useIframe = isIframeUrl(activeUrl);
  const useDirectVideo = isDirectVideo(activeUrl) && !useIframe;

  return (
    <div className="w-full">
      {/* Video / Iframe Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl shadow-black/50">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-gray-400">Failed to load video</p>
            <button
              onClick={() => { setError(false); setLoading(true); if (iframeRef.current) iframeRef.current.src = activeUrl; if (videoRef.current) videoRef.current.load(); }}
              className="px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {useIframe ? (
          <iframe
            ref={iframeRef}
            src={activeUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <video
            ref={videoRef}
            src={activeUrl}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
            onCanPlay={handleLoad}
            onError={handleError}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Current Episode Info */}
      {currentEpisode && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
          <Play className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="font-medium">
            {hasMultipleSeasons && `S${currentEpisode.season} `}Episode {currentEpisode.number}
          </span>
          {getEpisodeLabel(currentEpisode) && (
            <span className="text-gray-500 truncate">— {getEpisodeLabel(currentEpisode)}</span>
          )}
        </div>
      )}

      {/* Server Selector */}
      {streamServers.length > 1 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Monitor className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Servers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {streamServers.map((server, i) => (
              <button
                key={i}
                onClick={() => handleServerChange(i)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeServer === i
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/50"
                    : "bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
                }`}
              >
                <Film className="w-3 h-3" />
                {server.name}
                {server.resolution && (
                  <span className={`text-[10px] px-1 py-0.5 rounded ${
                    activeServer === i ? "bg-violet-500/40" : "bg-white/[0.08]"
                  }`}>
                    {server.resolution}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dubbing / Audio Selector */}
      {audioTracks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dubbing</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {audioTracks.map((dub) => (
              <button
                key={dub.subjectId}
                onClick={() => onAudioChange?.(dub)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  externalAudioId === dub.subjectId
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/50"
                    : "bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${externalAudioId === dub.subjectId ? "bg-white" : "bg-gray-500"}`} />
                {dub.lanName}
                {dub.original && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Original
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtitle Selector (separate from dubbing) */}
      {subtitleTracks.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subtitles</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSubtitleChange?.({
                subjectId: "",
                lanName: "Off",
                lanCode: "",
                type: 1,
                detailPath: "",
              })}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                !externalSubId
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/50"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
              }`}
            >
              <Languages className="w-3 h-3" />
              Off
            </button>
            {subtitleTracks.map((dub) => (
              <button
                key={dub.subjectId}
                onClick={() => onSubtitleChange?.(dub)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  externalSubId === dub.subjectId
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/50"
                    : "bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
                }`}
              >
                <Languages className="w-3 h-3" />
                {dub.lanName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episode Navigation */}
      {episodes.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Film className="w-4 h-4" />
              <span>Episodes ({episodes.length})</span>
              <svg className={`w-4 h-4 transition-transform ${showEpisodes ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="flex gap-2">
              {prevSlug && (
                <button
                  onClick={() => {
                    const prevEp = episodes.find(e => e.slug === prevSlug);
                    handleEpisodeClick(prevSlug, prevEp?.season, prevEp ? parseInt(prevEp.number) : undefined);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white rounded-lg border border-white/[0.08] transition-all"
                  title={getPrevNextEpisodeLabel(prevEpisode)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
              )}
              {nextSlug && (
                <button
                  onClick={() => {
                    const nextEp = episodes.find(e => e.slug === nextSlug);
                    handleEpisodeClick(nextSlug, nextEp?.season, nextEp ? parseInt(nextEp.number) : undefined);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white rounded-lg border border-white/[0.08] transition-all"
                  title={getPrevNextEpisodeLabel(nextEpisode)}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {showEpisodes && (
            <div
              ref={episodeListRef}
              className="max-h-[280px] overflow-y-auto pr-1 space-y-3 scroll-smooth"
            >
              {seasonGroups.map((group) => (
                <div key={group.season}>
                  {hasMultipleSeasons && (
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#0a0a0f] z-10 py-1">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Season {group.season}
                      </span>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                  )}

                  {hasEpisodeTitles ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.episodes.map((ep) => {
                        const isActive = ep.slug === currentEpisodeSlug;
                        const isWatched = watched.has(ep.slug) && !isActive;
                        const label = getEpisodeLabel(ep);
                        return (
                          <button
                            key={ep.slug}
                            data-ep-slug={ep.slug}
                            onClick={() => handleEpisodeClick(ep.slug, ep.season, parseInt(ep.number))}
                            className={`relative flex items-center gap-3 p-3 rounded-xl text-left transition-all group ${
                              isActive
                                ? "bg-violet-600/15 border border-violet-500/40 shadow-lg shadow-violet-500/10"
                                : isWatched
                                  ? "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                                  : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                              isActive
                                ? "bg-violet-600 text-white"
                                : isWatched
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-white/[0.06] text-gray-400 group-hover:bg-white/[0.1]"
                            }`}>
                              {isActive ? (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              ) : isWatched ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                ep.number
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-medium truncate ${
                                isActive ? "text-white" : isWatched ? "text-gray-400" : "text-gray-300"
                              }`}>
                                {hasMultipleSeasons && `S${ep.season} `}Episode {ep.number}
                              </div>
                              {label && (
                                <div className="text-[11px] text-gray-500 truncate mt-0.5">
                                  {label}
                                </div>
                              )}
                            </div>

                            {isWatched && !isActive && (
                              <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                <Eye className="w-3 h-3 text-emerald-400" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                      {group.episodes.map((ep) => {
                        const isActive = ep.slug === currentEpisodeSlug;
                        const isWatched = watched.has(ep.slug) && !isActive;
                        return (
                          <button
                            key={ep.slug}
                            data-ep-slug={ep.slug}
                            onClick={() => handleEpisodeClick(ep.slug, ep.season, parseInt(ep.number))}
                            className={`relative aspect-[3/2] rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all group ${
                              isActive
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-1 ring-violet-400/50"
                                : isWatched
                                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/15"
                                  : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                            }`}
                          >
                            {isActive ? (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            ) : isWatched ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span className="text-sm font-bold">{ep.number}</span>
                            )}
                            {!isActive && !isWatched && (
                              <span className="text-[10px] opacity-60">EP</span>
                            )}
                            {isWatched && (
                              <span className="text-[9px] opacity-70">Watched</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}