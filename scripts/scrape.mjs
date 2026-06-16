import puppeteer from "puppeteer";

const BASE = process.env.URL_SCRAPPING || "https://moviebox.ph/";

interface CastMember {
  actor: string;
  character: string;
}

interface Episode {
  season: number;
  episode: number;
  title: string;
}

interface Review {
  author: string;
  rating: number;
  comment: string;
}

interface MovieItem {
  id: string;
  slug: string;
  title: string;
  year: number;
  rating: string;
  duration: string;
  country: string;
  genres: string[];
  description: string;
  poster: string;
  cast: CastMember[];
  episodes: Episode[];
  type: string;
  category: string;
  imdbRating: number;
  reviews: Review[];
  url: string;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractSlug(url) {
  if (!url) return "";
  const parts = url.split("/");
  return parts[parts.length - 1] || "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function scrapeHomepage(page) {
  console.log("Scraping homepage...");
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(3000);

  const sections = await page.evaluate(() => {
    const results = [];
    const allLinks = document.querySelectorAll("a[href*='/detail/'], a[href*='/moviedetail/']");

    const linkData = [];
    allLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const title =
        link.getAttribute("title") ||
        link.querySelector("h1, h2, h3, h4, h5, h6")?.textContent?.trim() ||
        link.textContent?.trim() ||
        "";
      if (href && title) {
        linkData.push({ href, title });
      }
    });

    // Group into categories based on section headings
    const headings = document.querySelectorAll("h2");
    headings.forEach((h) => {
      const sectionTitle = h.textContent?.trim() || "";
      if (!sectionTitle || sectionTitle.length > 40) return;

      const parent = h.closest("section, div");
      if (!parent) return;

      const items = [];
      const links = parent.querySelectorAll("a[href*='/detail/'], a[href*='/moviedetail/']");
      links.forEach((link) => {
        const href = link.getAttribute("href");
        const title =
          link.getAttribute("title") ||
          link.querySelector("h1, h2, h3, h4, h5, h6")?.textContent?.trim() ||
          link.textContent?.trim() ||
          "";
        if (href && title) {
          items.push({ href, title: title.replace(/\[.*?\]/g, "").trim() });
        }
      });

      if (items.length >= 3) {
        results.push({ name: sectionTitle, items });
      }
    });

    return results;
  });

  console.log(`Found ${sections.length} sections on homepage`);

  const typeMap = {
    "k-drama": "kdrama",
    "k-drama ": "kdrama",
    "k-show": "kshow",
    "c-drama": "cdrama",
    anime: "anime",
    "tagalog": "tagalog",
    "english": "english",
    "marvel": "marvel",
    "dc": "dc",
    "disney": "disney",
    "horror": "horror",
    "romance": "romance",
    "fantasy": "fantasy",
    "action": "action",
    "sci-fi": "scifi",
    "tv series": "tv-series",
    "movie": "movie",
  };

  function detectType(name) {
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(typeMap)) {
      if (lower.includes(key)) return val;
    }
    return "movie";
  }

  const heroItems = sections[0]?.items?.slice(0, 7) || [];

  const categories = sections.map((section) => ({
    name: section.name,
    type: detectType(section.name),
    items: section.items.map((item) => ({
      id: extractSlug(item.href),
      slug: extractSlug(item.href),
      title: item.title,
      year: 0,
      rating: "",
      duration: "",
      country: "",
      genres: [],
      description: "",
      poster: "",
      cast: [],
      episodes: [],
      type: detectType(section.name),
      category: section.name,
      imdbRating: 0,
      reviews: [],
      url: item.href.startsWith("http") ? item.href : `${BASE.replace(/\/$/, "")}${item.href}`,
    })),
  }));

  const allLinks = new Map();
  categories.forEach((cat) =>
    cat.items.forEach((item) => {
      if (!allLinks.has(item.id)) allLinks.set(item.id, item);
    })
  );

  return {
    hero: heroItems.map((item) => ({
      id: extractSlug(item.href),
      slug: extractSlug(item.href),
      title: item.title,
      url: item.href.startsWith("http") ? item.href : `${BASE.replace(/\/$/, "")}${item.href}`,
    })),
    categories,
    linkMap: allLinks,
  };
}

async function scrapeDetailPage(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(2000);
  } catch (e) {
    return null;
  }

  const data = await page.evaluate(() => {
    const title =
      document.querySelector("h1")?.textContent?.trim() ||
      document.title?.replace(/ - Watch.*| Watch.*| Streaming.*/gi, "").trim() ||
      "";

    const headings = document.querySelectorAll("h4");
    let year = 0,
      rating = "",
      duration = "",
      country = "",
      description = "";

    headings.forEach((h) => {
      const text = h.textContent?.trim() || "";
      if (/^\d{4}$/.test(text)) year = parseInt(text);
      else if (/^\d+h\s*\d*m$|^\d+\s*min/i.test(text)) duration = text;
      else if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(text) && text.length < 30 && !duration && !year)
        country = text;
    });

    // Rating badges
    const allH4 = Array.from(document.querySelectorAll("h4"));
    for (const h of allH4) {
      const t = h.textContent?.trim() || "";
      if (/^[RPG]|PG-13|TV-MA|TV-14|NC-17/i.test(t) && t.length < 8) {
        rating = t.toUpperCase();
        break;
      }
    }

    // Genres
    const genres = [];
    allH4.forEach((h) => {
      const t = h.textContent?.trim() || "";
      if (
        ["Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Adventure",
         "Fantasy", "Animation", "Mystery", "Crime", "Documentary", "Family", "Music",
         "War", "History", "Western", "Sport", "Biography", "Musical", "Film-Noir", "Reality"].includes(t)
      ) {
        genres.push(t);
      }
    });

    // Description
    const descEl = document.querySelector('[class*="description"], [class*="synopsis"], [class*="overview"], p');
    if (descEl) description = descEl.textContent?.trim() || "";

    // Fallback: find the longest paragraph
    if (!description) {
      const paras = document.querySelectorAll("p");
      paras.forEach((p) => {
        const t = p.textContent?.trim() || "";
        if (t.length > 100) description = t;
      });
    }

    // Cast
    const cast = [];
    const castEls = document.querySelectorAll('[class*="cast"] [class*="name"], [class*="cast"] [class*="actor"], [class*="Top"] [class*="Cast"] [class*="member"], [class*="top"] [class*="cast"] > div, [class*="Cast"] > div');
    castEls.forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (text && text.length < 50) {
        const parts = text.split(/\n|(?<=[a-z])(?=[A-Z])/);
        if (parts.length >= 2) {
          cast.push({ actor: parts[0].trim(), character: parts[1].trim() });
        } else {
          cast.push({ actor: text, character: "" });
        }
      }
    });

    // Poster
    const poster =
      (document.querySelector('[class*="poster"] img, [class*="thumbnail"] img, main img, article img') as HTMLImageElement)
        ?.src || "";

    return {
      title,
      year,
      rating,
      duration,
      country,
      genres: [...new Set(genres)],
      description,
      cast: cast.slice(0, 20),
      poster,
    };
  });

  return data;
}

async function main() {
  console.log("Starting MovieBox scraper...");
  console.log(`Base URL: ${BASE}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  );

  // Scrape homepage
  const homepage = await scrapeHomepage(page);
  const linkMap = homepage.linkMap;

  console.log(`Found ${linkMap.size} unique items to scrape details for`);

  // Scrape detail pages (limit to avoid overloading)
  const detailLimit = Math.min(linkMap.size, 100);
  const entries = Array.from(linkMap.entries()).slice(0, detailLimit);

  for (let i = 0; i < entries.length; i++) {
    const [id, item] = entries[i];
    console.log(`[${i + 1}/${entries.length}] Scraping: ${item.title} (${id})`);

    const detail = await scrapeDetailPage(page, item.url);
    if (detail) {
      Object.assign(item, detail);
    }

    // Progress save every 20 items
    if ((i + 1) % 20 === 0) {
      console.log(`Progress: ${i + 1}/${entries.length} done`);
    }
  }

  await browser.close();

  // Build output data
  const allMovies = Array.from(linkMap.values());
  const heroSlugs = new Set(homepage.hero.map((h) => h.id));

  const heroMovies = allMovies.filter((m) => heroSlugs.has(m.id)).slice(0, 7);
  const fallbackHero = allMovies.filter((m) => m.poster).slice(0, 7);

  const output = {
    hero: heroMovies.length >= 3 ? heroMovies : fallbackHero,
    categories: homepage.categories.map((cat) => ({
      name: cat.name,
      type: cat.type,
      items: cat.items
        .map((item) => allMovies.find((m) => m.id === item.id))
        .filter(Boolean),
    })),
  };

  // Write files using Bun or fs
  const fs = await import("fs");
  const path = await import("path");

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "movies.json"),
    JSON.stringify(allMovies, null, 2)
  );
  console.log(`Written ${allMovies.length} movies to data/movies.json`);

  fs.writeFileSync(
    path.join(dataDir, "homepage.json"),
    JSON.stringify(output, null, 2)
  );
  console.log(`Written homepage data to data/homepage.json`);

  console.log("Scraping complete!");
}

main().catch(console.error);
