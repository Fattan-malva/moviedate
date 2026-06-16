import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { buildUrl, getDomain, httpClient } from "./http";
import type {
  ContentItem,
  DetailData,
  Episode,
  EpisodeDetail,
  Genre,
  GenrePageData,
  HomeData,
  HomeSection,
  ListResponse,
  StreamServer,
} from "./scraper-types";
import {
  parseGenres,
  parseRating,
  parseYear,
  resolveImageUrl,
  getProxiedImageUrl,
  resolveUrl,
} from "./scraper-utils";

const CARD_SELECTOR = "a.movie-card, a[href*='/detail/'], a[href*='/movies/'], .movie-card, [class*='movie-card'], .more-item, a[href*='/tv/']";
const SECTION_SELECTOR = ".movie-card-list-box, .comp-box.has-content, section, .work-list > div, .content-list, [class*='movie-grid'], [class*='card-list'], [class*='item-list']";

// ─── Nuxt 3 Payload Parser ──────────────────────────────────────────────────
// The site uses Nuxt 3 __NUXT_DATA__: a flat JSON array where objects store
// index references instead of inline values. We resolve these references to
// reconstruct the original data structures.

function resolveNuxtRef(arr: any[], idx: number, depth = 0): any {
  if (depth > 20 || idx < 0 || idx >= arr.length) return undefined;
  const val = arr[idx];
  if (val === null || val === undefined) return val;
  if (typeof val === "number" || typeof val === "string" || typeof val === "boolean") return val;
  // ShallowReactive / ShallowRef / Ref wrapper: ["ShallowReactive", refIdx]
  if (Array.isArray(val) && val.length === 2 && typeof val[0] === "string") {
    return resolveNuxtRef(arr, val[1], depth + 1);
  }
  if (Array.isArray(val)) {
    return val.map((i) => (typeof i === "number" ? resolveNuxtRef(arr, i, depth + 1) : i));
  }
  if (typeof val === "object") {
    const result: any = {};
    for (const [key, refIdx] of Object.entries(val)) {
      result[key] = typeof refIdx === "number" ? resolveNuxtRef(arr, refIdx, depth + 1) : refIdx;
    }
    return result;
  }
  return val;
}

/** Parse __NUXT_DATA__ script tag and return the resolved flat array */
function parseNuxtPayload(html: string): any[] | null {
  const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/** Extract all sections with subjects (movies) from Nuxt 3 payload */
function extractSectionsFromNuxtPayload(html: string): { sections: HomeSection[]; hero: ContentItem[] } {
  const arr = parseNuxtPayload(html);
  if (!arr) return { sections: [], hero: [] };

  const sections: HomeSection[] = [];
  const hero: ContentItem[] = [];
  const seenSlugs = new Set<string>();

  // Find the root sections array — it's an array of indices pointing to section objects
  // Each section object has: type, position, title, subjects, banner, etc.
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    if (!("subjects" in val) || !("title" in val)) continue;

    const section = resolveNuxtRef(arr, i);
    if (!section || !section.title) continue;

    const sectionTitle = String(section.title);
    const sectionSlug = sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Extract banner/hero items
    if (section.banner?.items?.length > 0) {
      for (const bannerItem of section.banner.items) {
        const item = nuxtSubjectToContentItem(bannerItem.subject || bannerItem, bannerItem.detailPath || "");
        if (item && item.thumbnail && !seenSlugs.has(item.slug)) {
          // Ensure hero thumbnails are also proxied
          if (item.thumbnail.includes("pbcdn") && !item.thumbnail.includes("/api/proxy")) {
            item.thumbnail = getProxiedImageUrl(item.thumbnail);
          }
          seenSlugs.add(item.slug);
          hero.push(item);
        }
      }
    }

    // Extract subjects (movie cards)
    if (Array.isArray(section.subjects) && section.subjects.length > 0) {
      const items: ContentItem[] = [];
      for (const subject of section.subjects) {
        const item = nuxtSubjectToContentItem(subject, subject.detailPath || "");
        if (item && item.title && !seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          items.push(item);
        }
      }
      if (items.length > 0) {
        sections.push({
          name: sectionTitle.replace(/More$/i, "").trim(),
          slug: sectionSlug,
          items,
        });
      }
    }
  }

  return { sections, hero };
}

/** Convert a Nuxt payload subject object to a ContentItem */
function nuxtSubjectToContentItem(subject: any, detailPath?: string): ContentItem | null {
  if (!subject || typeof subject !== "object") return null;

  const title = subject.title || subject.name || "";
  if (!title) return null;

  // cover is an object with { url, width, height, ... }
  let thumbnail = "";
  const cover = subject.cover || subject.image || subject.poster;
  if (cover && typeof cover === "object") {
    thumbnail = cover.url || "";
  } else if (typeof cover === "string") {
    thumbnail = cover;
  }

  const slug = detailPath || subject.detailPath || subject.subjectId ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Parse genres from comma-separated string
  const genreStr = subject.genre || subject.genres || "";
  const genres = typeof genreStr === "string" && genreStr.length > 0
    ? genreStr.split(",").map((g: string) => g.trim()).filter(Boolean)
    : Array.isArray(genreStr) ? genreStr : undefined;

  return {
    slug,
    title,
    thumbnail: getProxiedImageUrl(thumbnail),
    rating: subject.imdbRatingValue || undefined,
    year: parseYear(subject.releaseDate || "") || undefined,
    genres,
    type: subject.subjectType === 2 ? "movie" : subject.subjectType === 1 ? "tv-series" : undefined,
    synopsis: subject.description || undefined,
    duration: subject.duration ? String(subject.duration) : undefined,
    country: subject.countryName || undefined,
  };
}

/** Extract detail data from Nuxt 3 payload on a detail page */
function extractDetailFromNuxtPayload(html: string, slug: string): DetailData | null {
  const arr = parseNuxtPayload(html);
  if (!arr) return null;

  // Find the subject object with cover and title
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    if (!("cover" in val) || !("title" in val)) continue;

    const subject = resolveNuxtRef(arr, i);
    if (!subject || !subject.title) continue;

    const cover = subject.cover || subject.image || subject.poster;
    const thumbnail = (cover && typeof cover === "object") ? (cover.url || "") : (typeof cover === "string" ? cover : "");

    if (!thumbnail || !thumbnail.includes("pbcdn")) continue;

    const genreStr = subject.genre || "";
    const genres = typeof genreStr === "string" && genreStr.length > 0
      ? genreStr.split(",").map((g: string) => g.trim()).filter(Boolean)
      : undefined;

    // Extract cast from staffList
    const cast = Array.isArray(subject.staffList)
      ? subject.staffList.map((s: any) => ({
          name: s.name || s.actorName || "",
          role: s.role || s.characterName || "",
          image: s.image?.url || s.avatar?.url || undefined,
        })).filter((c: any) => c.name)
      : undefined;

    return {
      slug: subject.detailPath || slug,
      title: subject.title,
      thumbnail: getProxiedImageUrl(thumbnail),
      poster: getProxiedImageUrl(thumbnail),
      type: subject.subjectType === 2 ? "movie" : "tv-series",
      rating: subject.imdbRatingValue || undefined,
      year: parseYear(subject.releaseDate || "") || undefined,
      synopsis: subject.description || undefined,
      genres,
      duration: subject.duration ? String(subject.duration) : undefined,
      country: subject.countryName || undefined,
      cast,
    };
  }

  return null;
}

async function fetchPage(path: string): Promise<cheerio.CheerioAPI> {
  const { data } = await httpClient.get<string>(path);
  return cheerio.load(data);
}

/** Fetch page and return both cheerio $ and raw HTML for Nuxt 3 payload parsing */
async function fetchPageWithHtml(path: string): Promise<{ $: cheerio.CheerioAPI; html: string }> {
  const { data } = await httpClient.get<string>(path);
  return { $: cheerio.load(data), html: data };
}

// Server-only: Puppeteer is not available in Vercel serverless
// Use HTTP-based fetching with Nuxt 3 __NUXT_DATA__ payload extraction
async function fetchPageDynamic(path: string): Promise<cheerio.CheerioAPI> {
  try {
    const { $, html } = await fetchPageWithHtml(path);
    
    // Store raw HTML for Nuxt 3 payload extraction
    (globalThis as any).__MOVIBOX_RAW_HTML__ = html;
    
    return $;
  } catch {
    return cheerio.load("<html><body></body></html>");
  }
}

// ─── Legacy Nuxt 2 extraction (kept as fallback) ────────────────────────────

// Extract Nuxt data from raw HTML (legacy Nuxt 2 format)
function extractNuxtFromHtml($: cheerio.CheerioAPI, html: string) {
  const nuxtItems: ContentItem[] = [];
  
  // Look for JSON-LD structured data (schema.org VideoObject)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      if (json["@type"] === "VideoObject" || json["@type"] === "Movie") {
        const slug = slugFromHref(json.url || json.mainEntityOfPage?.url || "");
        if (slug) {
          nuxtItems.push({
            slug,
            title: json.name || "",
            thumbnail: Array.isArray(json.thumbnailUrl) ? json.thumbnailUrl[0] : json.thumbnailUrl || json.image || "",
            synopsis: json.description || "",
          });
        }
      }
    } catch {}
  });
  
  // Look for __NUXT__ data in script tags
  const nuxtScriptMatch = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
  if (nuxtScriptMatch) {
    try {
      const nuxtStr = nuxtScriptMatch[1]
        .replace(/function[\s\S]*?\}\s*/g, "null")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*\]/g, "]");
      const nuxt = JSON.parse(nuxtStr);
      
      // Extract data arrays from Nuxt
      if (nuxt.data && Array.isArray(nuxt.data)) {
        for (const item of nuxt.data) {
          if (item && typeof item === "object") {
            const movie = extractMovieFromObject(item);
            if (movie) nuxtItems.push(movie);
          }
        }
      }
    } catch {}
  }
  
  // Also search raw HTML for image URLs with patterns
  const imgPatterns = html.match(/https:\/\/pbcdn[a-z0-9]*\.aoneroom\.com\/image\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi) || [];
  const titlePatterns = html.match(/title:\s*["']([^"']{3,100})["']/gi) || [];
  
  // Match titles with images
  const seen = new Set<string>();
  for (let i = 0; i < Math.min(imgPatterns.length, titlePatterns.length); i++) {
    const imgUrl = imgPatterns[i];
    const titleMatch = titlePatterns[i]?.match(/title:\s*["']([^"']+)["']/);
    const title = titleMatch?.[1] || "";
    
    if (imgUrl && title && !seen.has(imgUrl)) {
      seen.add(imgUrl);
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      nuxtItems.push({
        slug,
        title,
        thumbnail: imgUrl,
      });
    }
  }
  
  // Also look for og:image meta tags
  $("meta[property='og:image']").each((_, el) => {
    const img = $(el).attr("content") || "";
    if (img.includes("pbcdn")) {
      // Try to find related title
      const nearbyTitle = $(el).closest("div, section, article").find("h1, h2, h3, a[href*='/detail/']").first().text().trim();
      if (nearbyTitle && nearbyTitle.length > 2 && nearbyTitle.length < 100) {
        const slug = nearbyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!nuxtItems.some(i => i.thumbnail === img)) {
          nuxtItems.push({ slug, title: nearbyTitle, thumbnail: img });
        }
      }
    }
  });
  
  // Merge into global state
  if (nuxtItems.length > 0) {
    const existing = (globalThis as any).__MOVIBOX_NUXT_DATA__ || [];
    (globalThis as any).__MOVIBOX_NUXT_DATA__ = [...existing, ...nuxtItems];
  }
}

// Extract movie items from Nuxt state JSON (most reliable)
function extractFromNuxtState(): ContentItem[] {
  const items: ContentItem[] = [];
  const seen = new Set<string>();
  
  const nuxtData = (globalThis as any).__MOVIBOX_NUXT_DATA__;
  const nuxtState = (globalThis as any).__MOVIBOX_NUXT_STATE__;
  
  function deepExtract(obj: any, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 10) return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const movie = extractMovieFromObject(item);
        if (movie && movie.title && movie.thumbnail && !seen.has(movie.slug || movie.title)) {
          seen.add(movie.slug || movie.title);
          items.push(movie);
        }
        // Recurse into array items
        if (depth < 5) deepExtract(item, depth + 1);
      }
    } else {
      // Check nested properties
      const nestedArrays = ["data", "list", "items", "movies", "result", "homeData", "banner", "hotList", "newList", "recommend"];
      for (const key of nestedArrays) {
        if (obj[key]) {
          if (Array.isArray(obj[key])) {
            for (const item of obj[key]) {
              const movie = extractMovieFromObject(item);
              if (movie && movie.title && movie.thumbnail && !seen.has(movie.slug || movie.title)) {
                seen.add(movie.slug || movie.title);
                items.push(movie);
              }
            }
          } else {
            deepExtract(obj[key], depth + 1);
          }
        }
      }
    }
  }
  
  // Extract from data arrays
  if (nuxtData) {
    if (Array.isArray(nuxtData)) {
      deepExtract(nuxtData);
    } else if (typeof nuxtData === "object") {
      deepExtract(nuxtData);
    }
  }
  
  // Extract from state
  if (nuxtState && typeof nuxtState === "object") {
    deepExtract(nuxtState);
  }
  
  return items;
}

function extractMovieFromObject(obj: any): ContentItem | null {
  if (!obj || typeof obj !== "object") return null;
  
  // Try to find the actual movie data object (Nuxt wraps data differently)
  const data = obj.data || obj;
  
  const id = data.id || data._id || data.movieId || data.vodId || data.cid || "";
  const title = data.title || data.name || data.vodName || data.movieName || data.vodTitle || "";
  
  // Image fields - check many variations
  const imageFields = [
    data.poster,
    data.cover,
    data.thumbnail,
    data.thumb,
    data.img,
    data.image,
    data.latestThumbnail,
    data.pic,
    data.picUrl,
    data.thumbUrl,
    data.posterUrl,
    data.coverUrl,
    data.vodPic,
    data.type_pic,
    data.cat_icon,
    // Nested structures
    data.images?.poster,
    data.images?.cover,
    data.images?.thumbnail,
    data.images?.[0],
    data.imageList?.[0],
    data.pics?.[0],
    data.thumbnails?.[0],
    data.poster_thumb,
    data.thumb_pic,
  ];
  
  let cover = "";
  for (const f of imageFields) {
    if (f && typeof f === "string" && f.length > 5 && !f.includes("undefined")) {
      cover = f;
      break;
    }
  }
  
  // Also check for full URL in data.src or data.href
  const urlFields = [data.src, data.href, data.url, data.link, data.detailUrl, data.slugUrl, data.shareUrl];
  let href = "";
  for (const f of urlFields) {
    if (f && typeof f === "string" && f.length > 5) {
      href = f;
      break;
    }
  }
  
  const rating = data.rating || data.score || data.star || data.imdb || data.vod_score || data.favorite || "";
  const year = data.year || data.releaseYear || data.createTime || data.updateTime || data.pubDate || "";
  
  // Extract genres/categories
  const genreFields = [
    data.genres,
    data.category,
    data.categories,
    data.tags,
    data.type,
    data.typeName,
    data.vodType,
    data.vodClass,
  ];
  
  let genres: string[] | undefined;
  for (const f of genreFields) {
    if (Array.isArray(f) && f.length > 0) {
      genres = f.map(g => typeof g === "string" ? g : g.name || g.title || "").filter(Boolean);
      break;
    } else if (typeof f === "string" && f.length > 0 && f.length < 50) {
      genres = f.split(",").map(g => g.trim()).filter(Boolean);
      break;
    }
  }
  
  if (!title && !id) return null;
  
  let slug = "";
  if (href) {
    slug = slugFromHref(href);
  } else if (id) {
    slug = String(id);
  } else {
    slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  
  return {
    slug,
    title,
    thumbnail: resolveImageUrl(cover, getDomain()),
    rating: parseRating(String(rating)) || undefined,
    year: parseYear(String(year)) || undefined,
    genres,
    type: data.type || (href?.includes("/tv") ? "tv-series" : href?.includes("/animated") ? "animation" : "movie"),
  };
}

function slugFromHref(href: string): string {
  const pathname = href.startsWith("http") ? new URL(href).pathname : href;
  const parts = pathname.split("/").filter(Boolean);
  return parts.slice(1).join("/") || parts.at(-1) || "";
}

function imageFromElement($: cheerio.CheerioAPI, root: cheerio.Cheerio<Element>): string {
  const img = root.is("img") ? root : root.find("img").first();
  
  const attrs = [
    "data-nuxt-img",
    "data-nuxt-img-src",
    "data-src",
    "data-lazy-src",
    "data-original",
    "data-bg",
    "src",
  ];
  
  for (const attr of attrs) {
    const val = img.attr(attr);
    if (val && !val.startsWith("data:") && val.length > 5) {
      return val;
    }
  }
  
  const srcset = img.attr("srcset") || img.attr("data-srcset") || "";
  const srcsetUrls = srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
  
  for (const url of srcsetUrls) {
    if (url.startsWith("http") && url.match(/\.(jpg|jpeg|png|webp)/i)) {
      return url;
    }
  }
  
  const style = root.attr("style") || root.find("[style*='background']").first().attr("style") || "";
  const bgUrl = backdropFromStyle(style);
  if (bgUrl) return bgUrl;
  
  // Check parent for background image
  const parentStyle = root.parent()?.attr("style") || "";
  return backdropFromStyle(parentStyle);
}

function backdropFromStyle(style: string): string {
  const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
  return match?.[1] || "";
}

function titleFromCard($: cheerio.CheerioAPI, el: Element): string {
  const card = $(el);
  return (
    card.find(".card-title, .title, h3, h2").first().text().trim() ||
    card.find("img[alt]").first().attr("alt")?.trim() ||
    card.attr("aria-label")?.trim() ||
    card.attr("title")?.trim() ||
    card.text().replace(/★\s*[\d.]+/g, "").replace(/\b(19|20)\d{2}\b/g, "").trim()
  );
}

function itemFromCard($: cheerio.CheerioAPI, el: Element): ContentItem | null {
  const card = $(el);
  const $card = card.is("a") ? card : card.find("a").first();
  const href = $card.attr("href") || card.filter("a").attr("href") || "";
  const slug = slugFromHref(href);
  
  // Get title from various possible locations
  const title = 
    card.find(".card-title, .title, .movie-title, h3").first().text().trim() ||
    card.find("img[alt]").first().attr("alt")?.trim() ||
    card.attr("aria-label")?.trim() ||
    card.attr("title")?.trim() ||
    card.find(".more-name").first().text().trim() ||
    $card.find(".card-title, .title").first().text().trim() ||
    "";
  
  if (!slug && !href) return null;
  if (!title && !slug) return null;

  // Get thumbnail from various possible locations
  const imgEl = card.find("img").first();
  
  // NuxtImg lazy-loading: check data attributes first
  const imageAttrs = [
    "data-nuxt-img",
    "data-nuxt-img-src",
    "data-src",
    "data-lazy-src",
    "data-original",
    "data-bg",
    "src",
  ];
  
  let thumbnailUrl = "";
  for (const attr of imageAttrs) {
    const val = imgEl.attr(attr);
    if (val && !val.startsWith("data:") && val.length > 5) {
      thumbnailUrl = val;
      break;
    }
  }
  
  // Fallback to srcset
  if (!thumbnailUrl) {
    const srcset = imgEl.attr("srcset") || imgEl.attr("data-srcset") || "";
    const srcsetUrls = srcset.split(",").map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
    thumbnailUrl = srcsetUrls.find(url => url.match(/\.(jpg|jpeg|png|webp)/i)) || "";
  }
  
  // Fallback to background image
  if (!thumbnailUrl) {
    const imgStyle = card.find("[style*='background']").first().attr("style") || "";
    thumbnailUrl = backdropFromStyle(imgStyle) || "";
  }
  
  // Fallback to cover wrap background (for cards with lazy images)
  if (!thumbnailUrl) {
    const coverWrap = card.find(".cover-wrap, .cover, .img-wrap, [class*='cover']").first();
    const coverStyle = coverWrap.attr("style") || "";
    thumbnailUrl = backdropFromStyle(coverStyle) || "";
  }
  
  const thumbnail = getProxiedImageUrl(
    resolveImageUrl(thumbnailUrl, getDomain())
  );

  const text = card.text().replace(/\s+/g, " ").trim();
  const genreText = card.find(".genre, .categories, .tag-list, .type-item").first().text().trim();
  const ratingText = card.find(".rating, .score, .imdb-badge").first().text().trim() || 
    parseRating(text) || "";
  
  // Determine type from URL
  const type = 
    href.includes("/tv") ? "tv-series" : 
    href.includes("/animated") ? "animation" : 
    href.includes("/movie") ? "movie" : undefined;

  return {
    slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    thumbnail,
    rating: parseRating(ratingText) || undefined,
    year: parseYear(text),
    genres: genreText ? parseGenres(genreText) : undefined,
    type,
  };
}

function uniqueItems(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.slug || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isValidMovieItem(item: ContentItem): boolean {
  if (!item.title) return false;
  if (item.title.length < 2) return false;
  if (item.title.length > 200) return false;
  // Filter emoji-only or weird titles
  if (/^[🔥❤️⭐🎬🎥💥🎉✅❌]+$/.test(item.title)) return false;
  // Filter section headers that got scraped as items
  if (item.title.match(/^(Trending|Hot|New|Popular|Latest|Top|Featured|Recommended|Rekomendasi|Terbaru|Populer)/i) && !item.thumbnail) return false;
  // Filter slugs with query params (not real movie slugs)
  if (item.slug && (item.slug.includes("?") || item.slug.includes("&") || item.slug.includes("="))) return false;
  return true;
}

function extractItems($: cheerio.CheerioAPI, root?: cheerio.Cheerio<Element>): ContentItem[] {
  const items: ContentItem[] = [];
  const cards = root ? root.find(CARD_SELECTOR) : $(CARD_SELECTOR);
  cards.each((_, el) => {
    const item = itemFromCard($, el);
    if (item && isValidMovieItem(item)) items.push(item);
  });
  
  return uniqueItems(items);
}

function extractSections($: cheerio.CheerioAPI): HomeSection[] {
  // Primary: Use Nuxt 3 __NUXT_DATA__ payload (has images)
  const rawHtml = (globalThis as any).__MOVIBOX_RAW_HTML__ || $.html();
  const nuxtResult = extractSectionsFromNuxtPayload(rawHtml);
  
  if (nuxtResult.sections.length > 0) {
    return nuxtResult.sections;
  }
  
  // Fallback: HTML scraping (no images on this site)
  const sections: HomeSection[] = [];
  const seenSlugs = new Set<string>();

  $(SECTION_SELECTOR).each((_, el) => {
    const root = $(el);
    const title = root.find(".title, h2, h3").first().text().trim();
    const items = extractItems($, root);
    if (!title || items.length === 0) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (seenSlugs.has(slug)) return;
    seenSlugs.add(slug);
    sections.push({
      name: title.replace(/More$/i, "").trim(),
      slug,
      items,
    });
  });

  // Add Nuxt items to sections if they're missing
  const nuxtItems = extractFromNuxtState();
  if (nuxtItems.length > 0) {
    const existingSlugs = new Set(sections.flatMap(s => s.items.map(i => i.slug)));
    const newItems = nuxtItems.filter(i => !existingSlugs.has(i.slug));
    if (newItems.length > 0) {
      sections.push({ name: "Recommended", slug: "recommended", items: newItems });
    }
  }

  const allItems = extractItems($);
  if (allItems.length && !sections.some((section) => section.slug === "all-movies")) {
    sections.unshift({ name: "All Movies", slug: "all-movies", items: allItems });
  }

  return sections;
}

function pagination($: cheerio.CheerioAPI, currentPage: number): Pick<ListResponse<ContentItem>, "currentPage" | "totalPages"> {
  const pages = [currentPage];
  $("a[href*='page='], .pagination a, .pager a").each((_, el) => {
    const value = Number($(el).text().trim());
    if (Number.isFinite(value)) pages.push(value);
  });
  return { currentPage, totalPages: Math.max(...pages) };
}

export async function getHome(): Promise<HomeData> {
  const $ = await fetchPageDynamic("/");
  const sections = extractSections($);
  const allItems = uniqueItems(sections.flatMap((section) => section.items));

  // Primary: Use Nuxt 3 payload hero items (has images)
  const rawHtml = (globalThis as any).__MOVIBOX_RAW_HTML__ || $.html();
  const nuxtResult = extractSectionsFromNuxtPayload(rawHtml);
  const heroItems = nuxtResult.hero.length > 0 ? nuxtResult.hero : [];

  // Fallback: HTML banner extraction
  if (heroItems.length === 0) {
    $(".banner-bg-item, .hero-backdrop, .banner-slide, [class*='banner'] [class*='slide']").each((_, el) => {
      const $el = $(el);
      const href = $el.find("a").first().attr("href") || $el.closest("a").attr("href") || "";
      const imgEl = $el.find("img").first();
      const srcset = imgEl.attr("srcset") || "";
      const srcsetUrl = srcset.split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).at(-1);
      const image = imgEl.attr("src") || imgEl.attr("data-src") || srcsetUrl || "";
      const style = $el.attr("style") || $el.find("[style*='background']").first().attr("style") || "";
      const bgUrl = backdropFromStyle(style);
      const finalImg = image || bgUrl || "";
      const title = $el.find(".title, .card-title, h2, h3").first().text().trim() ||
        imgEl.attr("alt")?.trim() || "";
      
      if (href || finalImg) {
        heroItems.push({
          slug: slugFromHref(href),
          title,
          thumbnail: getProxiedImageUrl(resolveImageUrl(finalImg, getDomain())),
        });
      }
    });
  }

  return {
    hero: heroItems.length > 0 ? uniqueItems(heroItems) : allItems.slice(0, 12),
    trending: sections.filter((section) => /trend|hot|most|watch/i.test(section.name)),
    latest: sections.filter((section) => /latest|recent|new/i.test(section.name)),
    sections,
  };
}

export async function getTrending(): Promise<ListResponse<ContentItem>> {
  const $ = await fetchPageDynamic("/ranking-list");
  return { items: extractItems($), ...pagination($, 1) };
}

export async function getLatest(): Promise<ListResponse<ContentItem>> {
  const home = await getHome();
  const latest = home.latest.length ? home.latest.flatMap((section) => section.items) : home.sections.at(-1)?.items ?? [];
  return { items: uniqueItems(latest), currentPage: 1, totalPages: 1 };
}

export async function search(query: string, page = 1): Promise<ListResponse<ContentItem>> {
  const q = encodeURIComponent(query.trim());
  const paths = [`/search/${q}?page=${page}`, `/search?keyword=${q}&page=${page}`, `/?keyword=${q}&page=${page}`];

  for (const path of paths) {
    try {
      const $ = await fetchPage(path);
      const items = extractItems($);
      if (items.length) return { items, ...pagination($, page) };
    } catch {
      continue;
    }
  }

  const home = await getHome();
  const needle = query.toLowerCase();
  const items = uniqueItems(home.sections.flatMap((section) => section.items)).filter((item) =>
    item.title.toLowerCase().includes(needle)
  );
  return { items, currentPage: page, totalPages: 1 };
}

export async function getDetail(slug: string): Promise<DetailData> {
  const path = slug.startsWith("/") ? slug : `/detail/${slug}`;
  const $ = await fetchPageDynamic(path);
  
  // Primary: Use Nuxt 3 payload (has images)
  const rawHtml = (globalThis as any).__MOVIBOX_RAW_HTML__ || $.html();
  const nuxtDetail = extractDetailFromNuxtPayload(rawHtml, slug);
  if (nuxtDetail) {
    // Still extract episodes and stream servers from HTML
    nuxtDetail.episodes = extractEpisodes($);
    nuxtDetail.streamServers = extractStreamServers($);
    nuxtDetail.relatedContent = extractItems($);
    return nuxtDetail;
  }
  
  // Fallback: HTML scraping
  const title = $(".pc-sub-title, h1").first().text().trim() || $("meta[property='og:title']").attr("content") || "";
  const description = $("meta[name='description']").attr("content") || $(".desc, .description, .synopsis").first().text().trim();
  
  // Extract poster/cover image
  const posterImage =
    $(".pc-detail-cover img, .cover img, .poster img").first().attr("src") ||
    $("meta[property='og:image']").attr("content") || "";
  
  // Extract backdrop image from style
  const backdropStyle = $(".hero-backdrop, .backdrop, [class*='backdrop']").first().attr("style") || "";
  const backdropImage = backdropFromStyle(backdropStyle) || "";
  
  const image = posterImage || backdropImage;
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  
  // Extract genres/tags from type-item elements
  const genres = $(".type-item, a[href*='genre'], .genre a, .tag-list a")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .filter(g => g.length < 30); // Filter out long text
  
  // Extract cast/actors
  const cast: { name: string; role?: string; image?: string }[] = [];
  $(".starring-name, .staff-item, .cast-item, [class*='actor']").each((_, el) => {
    const name = $(el).find(".starring-name, .name, [class*='name']").first().text().trim();
    const role = $(el).find(".role, [class*='role']").first().text().trim();
    const imgEl = $(el).find("img").first();
    const img = imgEl.attr("src") || imgEl.attr("data-src") || "";
    if (name) {
      cast.push({ name, role: role || undefined, image: img || undefined });
    }
  });
  
  // Extract meta info: year, duration, country
  const metaText = $(".meta-item, .meta-row, [class*='meta']").first().text().replace(/\s+/g, " ").trim();
  const year = parseYear(metaText) || parseYear(bodyText);
  
  // Extract rating from rating elements
  const ratingText = $(".rating-score, .score, [class*='rating']").first().text().trim() || parseRating(bodyText) || "";
  
  // Get video URL from meta tags
  const videoUrl = $("meta[name='video']").attr("content") || 
    $("meta[property='og:video']").attr("content") || "";

  return {
    slug,
    title,
    thumbnail: getProxiedImageUrl(resolveImageUrl(image, getDomain())),
    poster: getProxiedImageUrl(resolveImageUrl(posterImage, getDomain())),
    rating: ratingText || parseRating(bodyText),
    year,
    synopsis: description,
    genres: genres.length ? [...new Set(genres)].slice(0, 10) : undefined,
    episodes: extractEpisodes($),
    streamServers: extractStreamServers($),
    relatedContent: extractItems($),
    cast: cast.length > 0 ? cast : undefined,
  };
}

export async function getEpisodeList(slug: string): Promise<Episode[]> {
  const detail = await getDetail(slug);
  return detail.episodes ?? [];
}

export async function getEpisodeDetail(slug: string): Promise<EpisodeDetail> {
  // Try both /video/ and /movies/ paths for player page
  const paths = [slug.startsWith("/") ? slug : `/video/${slug}`, `/movies/${slug}`];
  
  for (const path of paths) {
    try {
      const $ = await fetchPage(path);
      const servers = extractStreamServers($);
      
      // Get video URL from video element or source tag
      const videoUrl = 
        $("video").first().attr("src") ||
        $("video source").first().attr("src") ||
        $("iframe[src*='player'], iframe[src*='video']").first().attr("src") ||
        servers.at(0)?.url || "";
      
      if (videoUrl || servers.length > 0) {
        return {
          videoUrl: resolveUrl(videoUrl, getDomain()),
          streamServers: servers,
          prev: $("a[href*='prev'], .prev a, a[rel='prev']").first().attr("href"),
          next: $("a[href*='next'], .next a, a[rel='next']").first().attr("href"),
          episodes: extractEpisodes($),
        };
      }
    } catch {
      continue;
    }
  }
  
  return { videoUrl: undefined, streamServers: [], episodes: [] };
}

export async function getGenres(): Promise<Genre[]> {
  const $ = await fetchPageDynamic("/tv-series");
  const genres: Genre[] = [];
  $("a[href*='genre'], a[href*='genres'], .filter a, .category a").each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr("href") || "";
    if (!name || /^all$/i.test(name)) return;
    genres.push({ name, slug: slugFromHref(href) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
  });
  return [...new Map(genres.map((genre) => [genre.slug, genre])).values()];
}

export async function getGenre(slug: string, page = 1): Promise<GenrePageData> {
  const path = `/${slug}${page > 1 ? `?page=${page}` : ""}`;
  const $ = await fetchPageDynamic(path);
  const items = extractItems($);
  const pageInfo = pagination($, page);
  return {
    genre: { name: slug.replace(/-/g, " "), slug, count: items.length },
    items,
    currentPage: pageInfo.currentPage ?? page,
    totalPages: pageInfo.totalPages ?? 1,
  };
}

function extractEpisodes($: cheerio.CheerioAPI): Episode[] {
  const episodes: Episode[] = [];
  
  // Handle various episode link patterns
  const episodeSelectors = [
    "a[href*='/video/']",
    "a[href*='/episode/']",
    "a[href*='episode']",
    ".episode a",
    ".type-item a",
    "[class*='episode'] a",
    ".resource-container a",
    ".episodes-list a",
    ".episode-list a",
    ".type-tab-container a"
  ];
  
  const seen = new Set<string>();
  
  for (const selector of episodeSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      let href = $el.attr("href") || "";
      let text = $el.text().replace(/\s+/g, " ").trim();
      
      if (!href) return;
      
      // Extract episode number from text or slug
      const episodeNum = text.match(/\d+/)?.[0] || 
        href.match(/[_-]?episode[_-]?(\d+)/i)?.[1] ||
        href.match(/[_-]?ep[_-]?(\d+)/i)?.[1] ||
        href.match(/\/(\d+)(?:\/|$)/)?.[1];
      
      const slug = slugFromHref(href);
      if (seen.has(slug)) return;
      seen.add(slug);
      
      episodes.push({
        slug,
        number: episodeNum || String(episodes.length + 1),
        title: text || undefined,
      });
    });
  }
  
  return episodes;
}

function extractStreamServers($: cheerio.CheerioAPI): StreamServer[] {
  const servers: StreamServer[] = [];
  const seen = new Set<string>();
  
  // Extract from video elements
  $("video source[src], video[src]").each((i, el) => {
    const url = $(el).attr("src") || "";
    if (!url || seen.has(url)) return;
    seen.add(url);
    servers.push({ name: "Direct", url: resolveUrl(url, getDomain()) });
  });
  
  // Extract from iframes (embed players)
  $("iframe[src*='player'], iframe[src*='embed'], iframe[src*='video']").each((i, el) => {
    const url = $(el).attr("src") || "";
    if (!url || seen.has(url)) return;
    seen.add(url);
    servers.push({ name: $(el).attr("title") || `Server ${i + 1}`, url: resolveUrl(url, getDomain()) });
  });
  
  // Extract from m3u8/mp4 links
  $("a[href*='m3u8'], a[href*='mp4'], a[href*='embed']").each((i, el) => {
    const url = $(el).attr("href") || "";
    if (!url || seen.has(url)) return;
    seen.add(url);
    servers.push({ name: $(el).text().trim() || `Link ${i + 1}`, url: resolveUrl(url, getDomain()) });
  });
  
  // Extract from data attributes
  $("[data-src*='m3u8'], [data-src*='mp4'], [data-video], [data-url]").each((i, el) => {
    const $el = $(el);
    const url = $el.attr("data-src") || $el.attr("data-video") || $el.attr("data-url") || "";
    if (!url || seen.has(url)) return;
    seen.add(url);
    servers.push({ name: $el.attr("data-name") || `Source ${i + 1}`, url: resolveUrl(url, getDomain()) });
  });
  
  return servers;
}

export { buildUrl, getDomain };

