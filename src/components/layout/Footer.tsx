import Link from "next/link";
import { Film } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#1f1f2e] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-violet-500" />
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                MovieDate
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Discover and track your favorite movies, TV series, and anime.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Navigate</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Home</Link>
              <Link href="/search" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Search</Link>
              <Link href="/bookmark" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Bookmark</Link>
              <Link href="/history" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">History</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Browse</h4>
            <div className="flex flex-col gap-2">
              <Link href="/search?type=movie" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Movies</Link>
              <Link href="/search?type=tv-series" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">TV Series</Link>
              <Link href="/search?type=anime" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Anime</Link>
              <Link href="/search?type=kdrama" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">K-Drama</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3">Genres</h4>
            <div className="flex flex-col gap-2">
              <Link href="/genre/action" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Action</Link>
              <Link href="/genre/horror" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Horror</Link>
              <Link href="/genre/romance" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Romance</Link>
              <Link href="/genre/sci-fi" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">Sci-Fi</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#1f1f2e] mt-8 pt-6 text-center text-sm text-gray-600">
          MovieDate &copy; {new Date().getFullYear()}. Data sourced from MovieBox.
        </div>
      </div>
    </footer>
  );
}
