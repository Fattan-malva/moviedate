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

  // Determine the app's origin. Use NEXT_PUBLIC_APP_URL from env, or fallback.
  // This is crucial for server-side rendering and API routes.
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // If it's a data URL, return it directly
  if (absoluteImageUrl.startsWith("data:")) {
    return absoluteImageUrl;
  }

  // Check if the image is already served from our domain.
  // This prevents unnecessary proxying for images already on our CDN or served locally.
  try {
    const imageUrlOrigin = new URL(absoluteImageUrl).origin;
    if (imageUrlOrigin === new URL(appOrigin).origin) {
      return absoluteImageUrl;
    }
  } catch (e) {
    // If URL parsing fails, it might be an invalid URL, log and proceed to proxy.
    console.error("Error parsing image URL origin:", e);
  }

  // Otherwise, construct and return the proxy URL
  const proxyUrl = new URL("/api/proxy-image", appOrigin);
  proxyUrl.searchParams.set("url", absoluteImageUrl);
  return proxyUrl.href;
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
