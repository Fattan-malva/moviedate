import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Check Colony detail - look at resource field (index 107)
const slug = 'colony-06FbDRS87x3';
const { data: html } = await axios.get(`${BASE_URL}/detail/${slug}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const payloadMatch = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr = JSON.parse(payloadMatch[1]);

// Resolve a Nuxt reference
function resolveRef(idx) {
  if (typeof idx !== 'number' || idx >= arr.length) return idx;
  const val = arr[idx];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const resolved = {};
    for (const [k, refIdx] of Object.entries(val)) {
      resolved[k] = resolveRef(refIdx);
    }
    return resolved;
  }
  return val;
}

// Index 10 is the main data object: {subject, stars, resource, metadata, ...}
// Index 107 is resource
console.log('=== Resource field (index 107) ===');
const resource = resolveRef(107);
console.log(JSON.stringify(resource, null, 2).substring(0, 3000));

// Also check metadata (index 118)
console.log('\n=== Metadata field (index 118) ===');
const metadata = resolveRef(118);
console.log(JSON.stringify(metadata, null, 2).substring(0, 2000));

// Check season field in subject
console.log('\n=== Subject season field ===');
const subject = resolveRef(11);
console.log('season:', JSON.stringify(subject.season));
console.log('subjectType:', subject.subjectType);
console.log('hasResource:', subject.hasResource);
