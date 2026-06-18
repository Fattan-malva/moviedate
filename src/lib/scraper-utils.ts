import * as cheerio from "cheerio";
import type { Element } from "domhandler";

export function extractText($: cheerio.CheerioAPI, selector: string): string {
  return $(selector).first().text().trim();
}

export function extractAttr(
  $: cheerio.CheerioAPI,
  selector: string,
  attr: string
): string {
  return $(selector).first().attr(attr) ?? "";
}

export function extractTextAll($: cheerio.CheerioAPI, selector: string): string[] {
  const results: string[] = [];
  $(selector).each((_, el) => {
    const text = $(el).text().trim();
    if (text) results.push(text);
  });
  return results;
}

export function extractAttrAll(
  $: cheerio.CheerioAPI,
  selector: string,
  attr: string
): string[] {
  const results: string[] = [];
  $(selector).each((_, el) => {
    const val = $(el).attr(attr);
    if (val) results.push(val);
  });
  return results;
}

export function parseGenres(genreText: string): string[] {
  return genreText
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

export function parseRating(text: string): string | undefined {
  const match = text.match(/[★]\s*([\d.]+)/);
  return match?.[1];
}

export function parseYear(text: string): string | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

export function parseMovieCard($: cheerio.CheerioAPI, card: Element) {
  const $card = $(card);
  const linkEl = $card.find("a").first();
  const href = linkEl.attr("href") ?? "";
  const title =
    ($card.find(".card-title, h3, .movie-title").first().text().trim() ||
    $card.find("img").attr("alt")) ??
    "";
  const thumbnail =
    $card.find("img").attr("src") ??
    $card.find("img").attr("data-src") ??
    $card.find("[data-src]").attr("data-src") ??
    "";
  const rating = parseRating($card.text());
  const year = parseYear($card.text());
  const typeLabel = $card.find(".badge, .type, .label").first().text().trim() || undefined;
  const genres = parseGenres(
    $card.find(".genre, .categories").first().text().trim()
  );

  return { href, title, thumbnail, rating, year, typeLabel, genres };
}

export function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith("http")) return href;
  const base = baseUrl.replace(/\/+$/, "");
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${base}${path}`;
}

export function resolveImageUrl(src: string, baseUrl: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return resolveUrl(src, baseUrl);
}

export function getProxiedImageUrl(absoluteImageUrl: string): string {
  if (!absoluteImageUrl) return "";

  // If it's a data URL, return it directly
  if (absoluteImageUrl.startsWith("data:")) {
    return absoluteImageUrl;
  }

  // Proxy pbcdn images through our API to avoid hotlinking blocks
  if (absoluteImageUrl.includes("pbcdn")) {
    return `/api/proxy-image?url=${encodeURIComponent(absoluteImageUrl)}`;
  }

  // Return other URLs directly
  return absoluteImageUrl;
}

export function getProxiedVideoUrl(videoUrl: string): string {
  if (!videoUrl) return "";

  // Proxy video CDN URLs through our API to avoid referer/hotlinking blocks.
  // The browser's referer (e.g. localhost:3000) is rejected by CDNs that
  // only accept requests from movibox.net. Our proxy sets the correct referer.
  if (
    videoUrl.includes("hakunaymatata.com") ||
    videoUrl.includes("macdn") ||
    videoUrl.includes("aoneroom") ||
    videoUrl.includes("pbcdn")
  ) {
    return `/api/proxy-video?url=${encodeURIComponent(videoUrl)}`;
  }

  // Return other URLs directly (e.g. external embed URLs)
  return videoUrl;
}

export function getTextBetweenMarkers(
  text: string,
  startMarker: string,
  endMarker: string
): string | null {
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startMarker.length;
  const endIdx = text.indexOf(endMarker, contentStart);
  if (endIdx === -1) return null;
  return text.slice(contentStart, endIdx).trim();
}
