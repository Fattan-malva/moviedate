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

const CARD_SELECTOR = "a[href^='/detail/'], a[href*='/detail/']";
const SECTION_SELECTOR = ".movie-card-list-box, .comp-box.has-content, section, .work-list > div";

async function fetchPage(path: string): Promise<cheerio.CheerioAPI> {
  const { data } = await httpClient.get<string>(path);
  return cheerio.load(data);
}

function slugFromHref(href: string): string {
  const pathname = href.startsWith("http") ? new URL(href).pathname : href;
  const parts = pathname.split("/").filter(Boolean);
  return parts.slice(1).join("/") || parts.at(-1) || "";
}

function imageFromElement($: cheerio.CheerioAPI, root: cheerio.Cheerio<Element>): string {
  const img = root.is("img") ? root : root.find("img").first();
  const srcset = img.attr("srcset") || img.attr("data-srcset") || "";
  const srcsetUrl = srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean)
    .at(-1);
  const style = root.attr("style") || root.find("[style*='background']").first().attr("style") || "";
  const bgUrl = style.match(/url\((['"]?)(.*?)\1\)/)?.[2];

  return (
    img.attr("src") ||
    img.attr("data-src") ||
    img.attr("data-original") ||
    img.attr("data-lazy-src") ||
    img.attr("data-nuxt-img") ||
    srcsetUrl ||
    bgUrl ||
    ""
  );
}

function titleFromCard($: cheerio.CheerioAPI, el: Element): string {
  const card = $(el);
  return (
    card.attr("title")?.trim() ||
    card.attr("aria-label")?.trim() ||
    card.find("[title]").first().attr("title")?.trim() ||
    card.find("img[alt]").first().attr("alt")?.trim() ||
    card.find(".card-title, .title, h3, h2").first().text().trim() ||
    card.text().replace(/★\s*[\d.]+/g, "").replace(/\b(19|20)\d{2}\b/g, "").trim()
  );
}

function itemFromCard($: cheerio.CheerioAPI, el: Element): ContentItem | null {
  const card = $(el);
  const href = card.attr("href") || card.find("a").first().attr("href") || "";
  const slug = slugFromHref(href);
  const title = titleFromCard($, el);
  if (!href || !slug || !title) return null;

  const text = card.text().replace(/\s+/g, " ").trim();
  const genreText = card.find(".genre, .categories, .tag-list").first().text().trim();
   const thumbnail = getProxiedImageUrl(resolveImageUrl(imageFromElement($, card), getDomain()));

  return {
    slug,
    title,
    thumbnail,
    rating: parseRating(text),
    year: parseYear(text),
    genres: genreText ? parseGenres(genreText) : undefined,
    type: href.includes("/tv") ? "tv-series" : href.includes("animated") ? "animation" : "movie",
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

function extractItems($: cheerio.CheerioAPI, root?: cheerio.Cheerio<Element>): ContentItem[] {
  const items: ContentItem[] = [];
  const cards = root ? root.find(CARD_SELECTOR) : $(CARD_SELECTOR);
  cards.each((_, el) => {
    const item = itemFromCard($, el);
    if (item) items.push(item);
  });
  return uniqueItems(items);
}

function extractSections($: cheerio.CheerioAPI): HomeSection[] {
  const sections: HomeSection[] = [];

  $(SECTION_SELECTOR).each((_, el) => {
    const root = $(el);
    const title = root.find(".title, h2, h3").first().text().trim();
    const items = extractItems($, root);
    if (!title || items.length === 0) return;
    sections.push({
      name: title.replace(/More$/i, "").trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      items,
    });
  });

  if (sections.length === 0) {
    const items = extractItems($);
    if (items.length) sections.push({ name: "All", slug: "all", items });
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
  const $ = await fetchPage("/");
  const sections = extractSections($);
  const allItems = uniqueItems(sections.flatMap((section) => section.items));

  return {
    hero: allItems.slice(0, 12),
    trending: sections.filter((section) => /trend|hot|most/i.test(section.name)),
    latest: sections.filter((section) => /latest|recent|new/i.test(section.name)),
    sections,
  };
}

export async function getTrending(): Promise<ListResponse<ContentItem>> {
  const $ = await fetchPage("/ranking-list");
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
  const $ = await fetchPage(path);
  const title = $("h1").first().text().trim() || $("meta[property='og:title']").attr("content") || "";
  const description = $("meta[name='description']").attr("content") || $(".desc, .description, .synopsis").first().text().trim();
  const image =
    $("meta[property='og:image']").attr("content") ||
    $(".cover img, .poster img, img").first().attr("src") ||
    "";
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const genres = $("a[href*='genre'], .genre a, .tag-list a")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  return {
    slug,
    title,
    thumbnail: getProxiedImageUrl(resolveImageUrl(image, getDomain())),
    poster: getProxiedImageUrl(resolveImageUrl(image, getDomain())),
    rating: parseRating(bodyText),
    year: parseYear(bodyText),
    synopsis: description,
    genres: genres.length ? [...new Set(genres)] : undefined,
    episodes: extractEpisodes($),
    streamServers: extractStreamServers($),
    relatedContent: extractItems($),
  };
}

export async function getEpisodeList(slug: string): Promise<Episode[]> {
  const detail = await getDetail(slug);
  return detail.episodes ?? [];
}

export async function getEpisodeDetail(slug: string): Promise<EpisodeDetail> {
  const path = slug.startsWith("/") ? slug : `/video/${slug}`;
  const $ = await fetchPage(path);
  const servers = extractStreamServers($);
  return {
    videoUrl: servers.at(0)?.url || $("video source, video").first().attr("src"),
    streamServers: servers,
    prev: $("a[href*='prev'], .prev a").first().attr("href"),
    next: $("a[href*='next'], .next a").first().attr("href"),
    episodes: extractEpisodes($),
  };
}

export async function getGenres(): Promise<Genre[]> {
  const $ = await fetchPage("/tv-series");
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
  const $ = await fetchPage(path);
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
  $("a[href*='/video/'], a[href*='episode'], .episode a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!href) return;
    episodes.push({
      slug: slugFromHref(href),
      number: text.match(/\d+/)?.[0] ?? String(episodes.length + 1),
      title: text || undefined,
    });
  });
  return [...new Map(episodes.map((episode) => [episode.slug, episode])).values()];
}

function extractStreamServers($: cheerio.CheerioAPI): StreamServer[] {
  const servers: StreamServer[] = [];
  $("iframe[src], video[src], video source[src], a[href*='m3u8'], a[href*='mp4']").each((i, el) => {
    const url = $(el).attr("src") || $(el).attr("href") || "";
    if (!url) return;
    servers.push({ name: $(el).text().trim() || `Server ${i + 1}`, url: resolveUrl(url, getDomain()) });
  });
  return servers;
}

export { buildUrl, getDomain };

