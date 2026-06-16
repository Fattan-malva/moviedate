const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = process.env.URL_SCRAPPING?.replace(/\/+$/, "") ?? "https://movibox.net";

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

async function fetchPage(path) {
  const { data } = await httpClient.get(path);
  return cheerio.load(data);
}

function slugFromHref(href) {
  const pathname = href.startsWith("http") ? new URL(href).pathname : href;
  const parts = pathname.split("/").filter(Boolean);
  return parts.slice(1).join("/") || parts.at(-1) || "";
}

function imageFromElement($, root) {
  const img = root.is("img") ? root : root.find("img").first();
  const srcset = img.attr("srcset") || img.attr("data-srcset") || "";
  const srcsetUrl = srcset
    .split(",")
    .map((e) => e.trim().split(/\s+/)[0])
    .filter(Boolean)
    .at(-1);
  const style = root.attr("style") || "";
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

function titleFromCard($, el) {
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

function itemFromCard($, el) {
  const card = $(el);
  const href = card.attr("href") || card.find("a").first().attr("href") || "";
  const slug = slugFromHref(href);
  const title = titleFromCard($, el);
  if (!href || !slug || !title) return null;

  const text = card.text().replace(/\s+/g, " ").trim();
  const genreText = card.find(".genre, .categories, .tag-list").first().text().trim();
  const thumbnail = imageFromElement($, card);

  return {
    slug,
    title,
    thumbnail,
    rating: text.match(/[★]\s*([\d.]+)/)?.[1],
    year: text.match(/\b(19|20)\d{2}\b/)?.[0],
  };
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

async function getHome() {
  const $ = await fetchPage("/");

  const sections = [];
  $(".movie-card-list-box, .comp-box.has-content, section, .work-list > div").each((_, el) => {
    const root = $(el);
    const title = root.find(".title, h2, h3").first().text().trim();
    const cards = root.find("a[href*='/detail/']");
    const items = [];
    cards.each((_, c) => {
      const item = itemFromCard($, c);
      if (item) items.push(item);
    });
    if (!title || items.length === 0) return;
    sections.push({ name: title, items: uniqueItems(items) });
  });

  const allItems = uniqueItems(
    $("a[href*='/detail/']")
      .toArray()
      .map((el) => itemFromCard($, el))
      .filter(Boolean)
  );

  if (sections.length === 0) {
    sections.push({ name: "All", items: allItems });
  }
  if (!sections.find((s) => s.name === "All Movies")) {
    sections.unshift({ name: "All Movies", items: allItems });
  }

  return {
    hero: allItems.slice(0, 12),
    sections,
    totalItems: allItems.length,
  };
}

async function main() {
  try {
    const home = await getHome();
    console.log("=== HOME DATA ===");
    console.log("Total items scraped:", home.totalItems);
    console.log("Sections:", home.sections.map((s) => `${s.name} (${s.items.length})`).join(", "));
    console.log("\n=== HERO (first 3) ===");
    home.hero.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`);
      console.log(`   slug: ${item.slug}`);
      console.log(`   thumbnail: ${item.thumbnail || "(empty)"}`);
      console.log(`   rating: ${item.rating || "N/A"}`);
      console.log(`   year: ${item.year || "N/A"}`);
    });
    console.log("\n=== FIRST SECTION SAMPLE ===");
    const first = home.sections[0];
    console.log(`Section: ${first.name} (${first.items.length} items)`);
    first.items.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`);
      console.log(`   thumbnail: ${item.thumbnail || "(empty)"}`);
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();