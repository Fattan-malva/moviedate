import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Check the actual HTML for episode-related elements and API calls
const slug = 'tom-clancys-jack-ryan-ghost-war-m9L6Jm8rn49';
const { data: html } = await axios.get(`${BASE_URL}/detail/${slug}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const cheerio = await import('cheerio');
const $ = cheerio.load(html);

// Look for episode-related elements
console.log('=== Episode-related elements ===');
$('[class*="ep"], [class*="season"], [class*="episode"]').each((i, el) => {
  console.log(`${$(el).prop('tagName')}.${$(el).attr('class')}: ${$(el).text().trim().substring(0, 100)}`);
});

// Look for type-item elements (stream servers)
console.log('\n=== Type items (stream servers) ===');
$('.type-item').each((i, el) => {
  const parent = $(el).parent();
  console.log(`${$(el).text().trim()} - parent: ${parent.prop('tagName')}.${parent.attr('class')}`);
  // Check for data attributes
  const attrs = el.attribs;
  console.log(`  attrs: ${JSON.stringify(attrs)}`);
});

// Look for video player area
console.log('\n=== Video player area ===');
$('.player, .video-player, [class*="player"], [class*="video"]').each((i, el) => {
  console.log(`${$(el).prop('tagName')}.${$(el).attr('class')}: ${$(el).html().substring(0, 200)}`);
});

// Look for any API endpoints in scripts
console.log('\n=== API endpoints in scripts ===');
$('script').each((i, el) => {
  const text = $(el).html() || '';
  // Find API calls
  const apiMatches = text.match(/\/api\/[^\s'"]+/g);
  if (apiMatches) {
    console.log(`Script ${i}: ${apiMatches.join(', ')}`);
  }
  // Find fetch/axios calls
  const fetchMatches = text.match(/fetch\(['"]([^'"]+)['"]/g);
  if (fetchMatches) {
    console.log(`Fetch calls: ${fetchMatches.join(', ')}`);
  }
});

// Look for episode list container
console.log('\n=== Episode list containers ===');
$('.episode-list, .ep-list, .season-list, [class*="episode"], [class*="season"]').each((i, el) => {
  console.log(`${$(el).prop('tagName')}.${$(el).attr('class')}`);
  console.log(`  HTML: ${$(el).html().substring(0, 500)}`);
});

// Check for any data attributes with episode info
console.log('\n=== Data attributes ===');
$('[data-episode], [data-season], [data-ep], [data-se]').each((i, el) => {
  console.log(`${$(el).prop('tagName')}: ${JSON.stringify(el.attribs)}`);
});

// Check the Nuxt state for episode data
const stateMatch = html.match(/<script[^>]*>window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/);
if (stateMatch) {
  console.log('\n=== Window __NUXT__ state ===');
  console.log(stateMatch[1].substring(0, 1000));
}

// Check for any inline scripts with episode data
console.log('\n=== Inline scripts with episode data ===');
$('script:not([src])').each((i, el) => {
  const text = $(el).html() || '';
  if (text.includes('episode') || text.includes('Episode') || text.includes('season') || text.includes('Season')) {
    console.log(`Script ${i}: ${text.substring(0, 500)}`);
  }
});
