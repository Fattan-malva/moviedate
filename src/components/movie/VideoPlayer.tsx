"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

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

interface VideoPlayerProps {
  /** Direct video URL (mp4, m3u8) or iframe embed URL */
  videoUrl?: string;
  /** Available stream servers */
  streamServers?: StreamServer[];
  /** Movie/show title for accessibility */
  title?: string;
  /** Episode list for series */
  episodes?: Episode[];
  /** Current episode slug */
  currentEpisodeSlug?: string;
  /** Callback when episode is selected */
  onEpisodeSelect?: (slug: string, season?: number, episode?: number) => void;
  /** Previous episode slug */
  prevSlug?: string;
  /** Next episode slug */
  nextSlug?: string;
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

export default function VideoPlayer({
  videoUrl,
  streamServers = [],
  title = "",
  episodes = [],
  currentEpisodeSlug,
  onEpisodeSelect,
  prevSlug,
  nextSlug,
}: VideoPlayerProps) {
  const [activeUrl, setActiveUrl] = useState(videoUrl || streamServers[0]?.url || "");
  const [activeServer, setActiveServer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(episodes.length > 0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleServerChange = useCallback((index: number) => {
    setActiveServer(index);
    setActiveUrl(streamServers[index]?.url || "");
    setLoading(true);
    setError(false);
  }, [streamServers]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

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

      {/* Server Selector */}
      {streamServers.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {streamServers.map((server, i) => (
            <button
              key={i}
              onClick={() => handleServerChange(i)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                activeServer === i
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
              }`}
            >
              {server.name}
            </button>
          ))}
        </div>
      )}

      {/* Episode Navigation */}
      {episodes.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
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
                    onEpisodeSelect?.(prevSlug, prevEp?.season, prevEp ? parseInt(prevEp.number) : undefined);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white rounded-full border border-white/[0.08] transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
              )}
              {nextSlug && (
                <button
                  onClick={() => {
                    const nextEp = episodes.find(e => e.slug === nextSlug);
                    onEpisodeSelect?.(nextSlug, nextEp?.season, nextEp ? parseInt(nextEp.number) : undefined);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/[0.05] text-gray-400 hover:bg-white/[0.1] hover:text-white rounded-full border border-white/[0.08] transition-all"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {showEpisodes && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {episodes.map((ep) => {
                const isActive = ep.slug === currentEpisodeSlug;
                return (
                  <button
                    key={ep.slug}
                    onClick={() => onEpisodeSelect?.(ep.slug, ep.season, parseInt(ep.number))}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 border border-violet-400/50"
                        : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    {isActive && (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>{ep.number}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
