import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Find a TV series with episodes
const { data: homeData } = await axios.get(`${BASE_URL}/`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const payloadMatch = homeData.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr = JSON.parse(payloadMatch[1]);

// Find subjects with subjectType=1 (TV series)
console.log('=== TV Series subjects ===');
for (let i = 0; i < arr.length; i++) {
  const val = arr[i];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.includes('subjectType') && keys.includes('title') && keys.includes('detailPath')) {
      const resolved = {};
      for (const [k, refIdx] of Object.entries(val)) {
        resolved[k] = typeof refIdx === 'number' && refIdx < arr.length ? arr[refIdx] : refIdx;
      }
      if (resolved.subjectType === 1) {
        console.log(`  [${i}] title=${resolved.title} path=${resolved.detailPath}`);
      }
    }
  }
}

// Now check a TV series detail page for episodes
console.log('\n=== Checking a TV series detail ===');
// Pick first TV series found
let tvSlug = null;
for (let i = 0; i < arr.length; i++) {
  const val = arr[i];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.includes('subjectType') && keys.includes('detailPath')) {
      const resolved = {};
      for (const [k, refIdx] of Object.entries(val)) {
        resolved[k] = typeof refIdx === 'number' && refIdx < arr.length ? arr[refIdx] : refIdx;
      }
      if (resolved.subjectType === 1 && resolved.detailPath) {
        tvSlug = resolved.detailPath;
        break;
      }
    }
  }
}

if (tvSlug) {
  console.log('TV Series slug:', tvSlug);
  const { data: detailData } = await axios.get(`${BASE_URL}/detail/${tvSlug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 15000,
  });
  
  const detailMatch = detailData.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  const darr = JSON.parse(detailMatch[1]);
  
  // Find episode-related data
  console.log('\nNuxt payload length:', darr.length);
  for (let i = 0; i < darr.length; i++) {
    const val = darr[i];
    if (typeof val === 'string' && (val.includes('episode') || val.includes('Episode') || val.includes('epList') || val.includes('resourceList') || val.includes('videoAddress'))) {
      console.log(`  [${i}] =`, val.substring(0, 100));
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const keys = Object.keys(val);
      if (keys.some(k => k.includes('episode') || k.includes('Episode') || k.includes('epList') || k.includes('resourceList') || k.includes('videoAddress') || k.includes('definition'))) {
        console.log(`  [${i}] object keys:`, keys.join(', '));
        const resolved = {};
        for (const [k, refIdx] of Object.entries(val)) {
          resolved[k] = typeof refIdx === 'number' && refIdx < darr.length ? darr[refIdx] : refIdx;
        }
        console.log(`    resolved:`, JSON.stringify(resolved).substring(0, 300));
      }
    }
  }
  
  // Check HTML for episodes
  const cheerio = await import('cheerio');
  const $ = cheerio.load(detailData);
  console.log('\nHTML episode links:');
  $('a[href*="/video/"], a[href*="/episode/"]').each((i, el) => {
    console.log(`  ${$(el).text().trim().substring(0, 30)} -> ${$(el).attr('href')}`);
  });
  
  console.log('\nType items (servers):');
  $('.type-item').each((i, el) => {
    console.log(`  ${$(el).text().trim()}`);
  });
}
