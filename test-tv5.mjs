import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Check Jack Ryan - likely has multiple episodes
const slug = 'tom-clancys-jack-ryan-ghost-war-m9L6Jm8rn49';
const { data: html } = await axios.get(`${BASE_URL}/detail/${slug}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const payloadMatch = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr = JSON.parse(payloadMatch[1]);

function resolveRef(idx, depth = 0) {
  if (depth > 10) return '...';
  if (typeof idx !== 'number' || idx >= arr.length) return idx;
  const val = arr[idx];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const resolved = {};
    for (const [k, refIdx] of Object.entries(val)) {
      resolved[k] = resolveRef(refIdx, depth + 1);
    }
    return resolved;
  }
  if (Array.isArray(val)) {
    return val.map(v => resolveRef(v, depth + 1));
  }
  return val;
}

// Index 10 is the main data: {subject, stars, resource, metadata, ...}
const mainData = resolveRef(10);
console.log('=== Resource ===');
console.log(JSON.stringify(mainData.resource, null, 2).substring(0, 5000));

console.log('\n=== Subject (partial) ===');
const subject = mainData.subject;
console.log('subjectType:', subject.subjectType);
console.log('title:', subject.title);
console.log('season:', subject.season);
console.log('hasResource:', subject.hasResource);
console.log('detailPath:', subject.detailPath);

// Check if there's an episode list somewhere
console.log('\n=== Looking for episode-related keys in full payload ===');
for (let i = 0; i < arr.length; i++) {
  const val = arr[i];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.some(k => k.toLowerCase().includes('ep') || k.toLowerCase().includes('episode') || k.toLowerCase().includes('list') || k.toLowerCase().includes('season'))) {
      console.log(`  [${i}] keys: ${keys.join(', ')}`);
      const resolved = resolveRef(i);
      console.log(`    resolved: ${JSON.stringify(resolved).substring(0, 300)}`);
    }
  }
}

// Check the HTML for episode structure
const cheerio = await import('cheerio');
const $ = cheerio.load(html);
console.log('\n=== HTML structure ===');
// Look for any container with episodes
$('.episode-list, .ep-list, .season-list, [class*="episode"], [class*="season"], [class*="ep-"]').each((i, el) => {
  console.log(`Found: ${$(el).prop('tagName')}.${$(el).attr('class')}`);
  console.log(`  HTML: ${$(el).html().substring(0, 500)}`);
});

// Check all divs with data attributes
$('[data-ep], [data-episode], [data-season]').each((i, el) => {
  console.log(`Data attr: ${$(el).prop('tagName')} ${JSON.stringify(el.attribs)}`);
});

// Check for any script tags with episode data
$('script').each((i, el) => {
  const text = $(el).html() || '';
  if (text.includes('episode') || text.includes('Episode')) {
    console.log(`Script with episode: ${text.substring(0, 200)}`);
  }
});
