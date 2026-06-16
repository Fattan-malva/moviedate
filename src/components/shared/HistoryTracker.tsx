"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function HistoryTracker({ slug }: { slug: string }) {
  const params = useParams();

  useEffect(() => {
    const s = slug || params?.slug;
    if (!s || typeof s !== "string") return;
    const stored = localStorage.getItem("moviedate_history");
    let history: string[] = stored ? JSON.parse(stored) : [];
    history = history.filter((h) => h !== s);
    history.push(s);
    if (history.length > 100) history = history.slice(-100);
    localStorage.setItem("moviedate_history", JSON.stringify(history));
  }, [slug, params?.slug]);

  return null;
}
