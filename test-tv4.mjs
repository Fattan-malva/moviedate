import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

const slug = 'colony-06FbDRS87x3';
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

// Resource.seasons -> index 109
console.log('=== Resource.seasons (index 109) ===');
const seasons = resolveRef(109);
console.log(JSON.stringify(seasons, null, 2).substring(0, 5000));
