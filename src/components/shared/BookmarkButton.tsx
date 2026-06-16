"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  slug: string;
  title: string;
}

export default function BookmarkButton({ slug, title }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("moviedate_bookmarks");
    if (stored) {
      const bookmarks = JSON.parse(stored);
      setIsBookmarked(!!bookmarks[slug]);
    }
  }, [slug]);

  const toggle = () => {
    const stored = localStorage.getItem("moviedate_bookmarks");
    let bookmarks: Record<string, string> = stored ? JSON.parse(stored) : {};
    if (bookmarks[slug]) {
      delete bookmarks[slug];
      setIsBookmarked(false);
    } else {
      bookmarks[slug] = title;
      setIsBookmarked(true);
    }
    localStorage.setItem("moviedate_bookmarks", JSON.stringify(bookmarks));
    window.dispatchEvent(new Event("bookmark-changed"));
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isBookmarked
          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
          : "bg-white/5 text-gray-400 border border-[#2d2d44] hover:border-pink-500/30 hover:text-pink-400"
      }`}
    >
      <Heart className={`w-4 h-4 ${isBookmarked ? "fill-pink-400" : ""}`} />
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
