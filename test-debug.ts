import { httpClient } from './src/lib/http';

async function main() {
const { data } = await httpClient.get('/');

// Find __NUXT_DATA__ script
const payloadMatch = data.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!payloadMatch) { console.log('No __NUXT_DATA__'); return; }

const arr = JSON.parse(payloadMatch[1]);
console.log('Array length:', arr.length);

// Resolve a reference chain
function resolve(idx: number, depth = 0): any {
  if (depth > 15 || idx < 0 || idx >= arr.length) return undefined;
  const val = arr[idx];
  if (val === null || val === undefined) return val;
  if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val;
  if (Array.isArray(val) && val.length === 2 && typeof val[0] === 'string') {
    // ShallowReactive/Ref wrapper
    return resolve(val[1], depth + 1);
  }
  if (Array.isArray(val)) {
    return val.map(i => typeof i === 'number' ? resolve(i, depth + 1) : i);
  }
  if (typeof val === 'object') {
    const result: any = {};
    for (const [key, refIdx] of Object.entries(val)) {
      result[key] = typeof refIdx === 'number' ? resolve(refIdx, depth + 1) : refIdx;
    }
    return result;
  }
  return val;
}

// Check detail page
const { data: detailData } = await httpClient.get('/detail/teach-you-a-lesson-tagalog-yD5Dt6HRpJ7');
const detailPayload = detailData.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (detailPayload) {
  const darr = JSON.parse(detailPayload[1]);
  console.log('\n=== DETAIL PAGE ===');
  console.log('Array length:', darr.length);
  
  // Find pbcdn URLs
  const pbcdnIndices: number[] = [];
  for (let i = 0; i < darr.length; i++) {
    if (typeof darr[i] === 'string' && darr[i].includes('pbcdn')) {
      pbcdnIndices.push(i);
    }
  }
  console.log('pbcdn URLs:', pbcdnIndices.length);
  
  // Find cover/poster - resolve deeply
  function deepResolve(idx: number, depth = 0): any {
    if (depth > 15 || idx < 0 || idx >= darr.length) return undefined;
    const val = darr[idx];
    if (val === null || val === undefined) return val;
    if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val;
    if (Array.isArray(val) && val.length === 2 && typeof val[0] === 'string') return deepResolve(val[1], depth + 1);
    if (Array.isArray(val)) return val.map(i => typeof i === 'number' ? deepResolve(i, depth + 1) : i);
    if (typeof val === 'object') {
      const result: any = {};
      for (const [k, v] of Object.entries(val)) result[k] = typeof v === 'number' ? deepResolve(v, depth + 1) : v;
      return result;
    }
    return val;
  }
  
  // Find first object with cover that has a pbcdn url
  for (let i = 0; i < darr.length; i++) {
    const val = darr[i];
    if (val && typeof val === 'object' && !Array.isArray(val) && 'cover' in val) {
      const resolved = deepResolve(i);
      const coverUrl = resolved?.cover?.url;
      if (typeof coverUrl === 'string' && coverUrl.includes('pbcdn')) {
        console.log(`\nFound at [${i}]:`);
        console.log('  title:', resolved.title);
        console.log('  cover.url:', coverUrl);
        console.log('  detailPath:', resolved.detailPath);
        console.log('  genre:', resolved.genre);
        console.log('  imdbRatingValue:', resolved.imdbRatingValue);
        break;
      }
    }
  }
}
}

main().catch(console.error);
