import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Check "Colony" which is likely a TV series with episodes
const slug = 'colony-06FbDRS87x3';
console.log(`=== Checking detail for: ${slug} ===`);

const { data: html } = await axios.get(`${BASE_URL}/detail/${slug}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const payloadMatch = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr = JSON.parse(payloadMatch[1]);

console.log('Nuxt payload length:', arr.length);
console.log('\n=== Full Nuxt payload (first 100 items) ===');
for (let i = 0; i < Math.min(100, arr.length); i++) {
  const val = arr[i];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const keys = Object.keys(val);
    const resolved = {};
    for (const [k, refIdx] of Object.entries(val)) {
      resolved[k] = typeof refIdx === 'number' && refIdx < arr.length ? arr[refIdx] : refIdx;
    }
    console.log(`  [${i}] {${keys.join(', ')}} =>`, JSON.stringify(resolved).substring(0, 200));
  } else if (typeof val === 'string' && val.length > 0) {
    console.log(`  [${i}] "${val.substring(0, 100)}"`);
  } else if (typeof val === 'number' || typeof val === 'boolean') {
    console.log(`  [${i}] ${val}`);
  }
}

// Also check "Tom Clancy's Jack Ryan: Ghost War" - likely a series
console.log('\n\n=== Checking: tom-clancys-jack-ryan-ghost-war-m9L6Jm8rn49 ===');
const slug2 = 'tom-clancys-jack-ryan-ghost-war-m9L6Jm8rn49';
const { data: html2 } = await axios.get(`${BASE_URL}/detail/${slug2}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const payloadMatch2 = html2.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr2 = JSON.parse(payloadMatch2[1]);

console.log('Nuxt payload length:', arr2.length);
for (let i = 0; i < Math.min(100, arr2.length); i++) {
  const val = arr2[i];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const keys = Object.keys(val);
    const resolved = {};
    for (const [k, refIdx] of Object.entries(val)) {
      resolved[k] = typeof refIdx === 'number' && refIdx < arr2.length ? arr2[refIdx] : refIdx;
    }
    console.log(`  [${i}] {${keys.join(', ')}} =>`, JSON.stringify(resolved).substring(0, 200));
  } else if (typeof val === 'string' && val.length > 0) {
    console.log(`  [${i}] "${val.substring(0, 100)}"`);
  } else if (typeof val === 'number' || typeof val === 'boolean') {
    console.log(`  [${i}] ${val}`);
  }
}

// Check HTML for episodes
const cheerio = await import('cheerio');
const $ = cheerio.load(html2);
console.log('\nHTML episode links:');
$('a[href*="/video/"], a[href*="/episode/"]').each((i, el) => {
  console.log(`  ${$(el).text().trim().substring(0, 30)} -> ${$(el).attr('href')}`);
});
console.log('\nType items:');
$('.type-item').each((i, el) => {
  console.log(`  ${$(el).text().trim()}`);
});
console.log('\nAll links with "episode" or "video":');
$('a').each((i, el) => {
  const href = $(el).attr('href') || '';
  if (href.includes('episode') || href.includes('video')) {
    console.log(`  ${$(el).text().trim().substring(0, 30)} -> ${href}`);
  }
});
