import Link from "next/link";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <Film className="w-16 h-16 text-violet-500 mb-4" />
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-sm font-medium transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
