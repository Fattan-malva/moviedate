const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.URL_SCRAPPING?.replace(/\/+$/, "") ?? "https://movibox.net";

// Nuxt payload deserializer
function deserializeNuxtPayload(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (!Array.isArray(data) || data.length < 2) return null;

  const state = data[1]?.state;
  if (!state) return null;

  // Find the array that contains movie data (typically indexed 51)
  const items = state[51];
  if (!Array.isArray(items)) return null;

  return items.map((item, idx) => {
    if (!item || typeof item !== "object") return null;
    
    // Extract fields using known indices from debug
    const title = item[0];
    const imageUrl = item[1]?.url || item[1] || "";
    const detailPath = item[3];
    const genre = item[5];
    const rating = item[7];
    const releaseDate = item[4];
    const description = item[2];
    const coverUrl = item[6]?.url || item[6] || "";

    if (!title) return null;

    return {
      title,
      thumbnail: imageUrl || coverUrl,
      slug: detailPath || "",
      genres: genre ? genre.split(",").map(g => g.trim()) : [],
      rating: rating || "",
      year: releaseDate ? String(releaseDate).split("-")[0] : "",
      synopsis: description,
      type: detailPath?.includes("/tv") ? "tv-series" : "movie",
    };
  }).filter(Boolean);
}

// Alternative simple regex-based extraction for faster parsing
function extractMoviesSimple(html) {
  const movies = [];
  
  // Pattern 1: Look for "title" strings followed by movie data
  // From debug, structure is: "Title",{...image...},"slug",date,genre,...
  const titlePattern = /"((?:Every Year After|Devil's Market|Ahlan Singapore|Teach You A Lesson|Bound by Promise|Michael|Di Luar Nurul|Pasar Setan|Teach you a lesson|Michael|Mortal Kombat II)[^"]*)"/g;
  
  // Pattern 2: Extract URLs from pbcdnw.aoneroom.com
  const imagePattern = /https:\/\/pbcdnw\.aoneroom\.com\/image\/[^"']+/g;
  
  // Pattern 3: Look for detail path patterns
  const pathPattern = /detailPath":"([^"]+)"/g;
  
  // Better approach: Find all movie blocks in the data
  // The structure is: {id, title, image, url, subjectId, subjectType, subject, detailPath}
  const movieBlockPattern = /\{\s*"id"\s*:\s*\d+\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"image"\s*:\s*\{[^}]+"url"\s*:\s*"([^"]+)"[^}]*\}\s*,\s*"url"\s*:\s*"[^"]*"\s*,\s*"subjectId"\s*:\s*[^,]+,\s*"subjectType"\s*:\s*\d+\s*,\s*"subject"\s*:\s*\{[^}]*\}\s*,\s*"detailPath"\s*:\s*"([^"]+)"[^}]*\}/g;
  
  let match;
  const uniqueMovies = new Map();
  
  while ((match = movieBlockPattern.exec(html)) !== null) {
    const [full, title, image, slug] = match;
    if (title && slug && !uniqueMovies.has(slug)) {
      uniqueMovies.set(slug, { title, thumbnail: image, slug });
    }
  }
  
  // Also extract genre and rating separately
  const genreRatingPattern = /"genre"\s*:\s*"([^"]+)".*?"imdbRatingValue"\s*:\s*"([^"]+)"/gs;
  const genreRatingMap = new Map();
  while ((match = genreRatingPattern.exec(html)) !== null) {
    genreRatingMap.set(match[1], { genre: match[1], rating: match[2] });
  }
  
  // Merge data
  const result = [];
  uniqueMovies.forEach((movie, slug) => {
    const gr = genreRatingMap.get(slug) || {};
    result.push({
      title: movie.title,
      thumbnail: movie.thumbnail,
      slug,
      genres: gr.genre ? gr.genre.split(",").map(g => g.trim()) : [],
      rating: gr.rating || "",
      year: "",
      synopsis: "",
      type: slug.includes("/tv") ? "tv-series" : "movie",
    });
  });
  
  return result;
}

// Main
const htmlPath = path.join(__dirname, "movibox_home.html");
const html = fs.readFileSync(htmlPath, "utf-8");

// Find the script with data
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const scriptContent = scriptMatch[1];
  console.log("Script content sample:", scriptContent.slice(0, 500));
  
  const movies = extractMoviesSimple(scriptContent);
  console.log("\n=== EXTRACTED MOVIES ===");
  console.log("Total:", movies.length);
  console.log("\nFirst 5 movies:");
  movies.slice(0, 5).forEach((m, i) => {
    console.log(`${i+1}. ${m.title}`);
    console.log(`   slug: ${m.slug}`);
    console.log(`   thumbnail: ${m.thumbnail}`);
    console.log(`   rating: ${m.rating}`);
    console.log(`   genres: ${m.genres.join(", ")}`);
  });
}