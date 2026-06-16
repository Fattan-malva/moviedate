import { getMoviesByGenre, getAllMovies } from "@/lib/data";
import { notFound } from "next/navigation";
import MovieGrid from "@/components/movie/MovieGrid";
import Badge from "@/components/ui/Badge";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const movies = await getAllMovies();
  const genres = new Set<string>();
  movies.forEach((m) => m.genres.forEach((g) => genres.add(g)));
  return Array.from(genres).map((g) => ({ slug: g.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Movies - MovieDate`,
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const genreName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const movies = await getMoviesByGenre(genreName);

  if (movies.length === 0) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white capitalize">{slug}</h1>
        <Badge label={`${movies.length} titles`} />
      </div>
      <MovieGrid items={movies} showType />
    </div>
  );
}
