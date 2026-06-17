import { getMovieBySlug, getAllMovies } from "@/lib/data";
import { notFound } from "next/navigation";
import { Clock, MapPin, Star, Calendar } from "lucide-react";
import BookmarkButton from "@/components/shared/BookmarkButton";
import CastCard from "@/components/shared/CastCard";
import Badge from "@/components/ui/Badge";
import MovieGrid from "@/components/movie/MovieGrid";
import HistoryTracker from "@/components/shared/HistoryTracker";
import MoviePlayerWrapper from "@/components/movie/MoviePlayerWrapper";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Not Found" };
  return {
    title: `${movie.title} - MovieDate`,
    description: movie.description?.slice(0, 160),
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);

  if (!movie) notFound();

  const allMovies = await getAllMovies();
  const moreLikeThis = allMovies
    .filter((m) => m.slug !== slug && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 12);

  return (
    <div className="min-h-screen">
      <HistoryTracker slug={movie.slug} />

      <section className="relative h-[40vh] md:h-[55vh] min-h-[350px] overflow-hidden">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/40 via-indigo-900/40 to-pink-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 md:w-64 shrink-0 hidden md:block">
            <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-white/5 backdrop-blur-xl">
              {movie.poster ? (
                <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg p-4 text-center">
                  {movie.title}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 pt-4 md:pt-20">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
              {movie.year > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {movie.year}
                </span>
              )}
              {movie.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.duration}
                </span>
              )}
              {movie.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {movie.country}
                </span>
              )}
              {movie.imdbRating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {movie.imdbRating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((g) => (
                <Badge key={g} label={g} variant="genre" />
              ))}
              <Badge label={movie.type} variant="type" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <BookmarkButton slug={movie.slug} title={movie.title} />
              <a
                href="#player"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25"
              >
                Watch Now
              </a>
            </div>

            {movie.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-2">Synopsis</h2>
                <p className="text-gray-400 leading-relaxed">{movie.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Embedded Video Player */}
        <section id="player" className="mt-8 scroll-mt-20">
          <MoviePlayerWrapper
            slug={movie.slug}
            title={movie.title}
            initialStreamServers={movie.streamServers}
            subjectId={movie.subjectId}
            episodes={movie.episodes.map((ep) => ({
              slug: ep.slug || `${movie.slug}-s${ep.season || 1}e${ep.episode}`,
              number: String(ep.episode),
              title: ep.title,
              season: ep.season || 1,
            }))}
          />
        </section>

        {movie.cast && movie.cast.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-white mb-4">Top Cast</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {movie.cast.map((member, i) => (
                <CastCard key={i} member={member} />
              ))}
            </div>
          </section>
        )}

        {moreLikeThis.length > 0 && (
          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-white mb-4">More Like This</h2>
            <MovieGrid items={moreLikeThis} showType />
          </section>
        )}
      </div>
    </div>
  );
}
