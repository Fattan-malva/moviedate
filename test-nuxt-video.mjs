import https from 'https';

// Fetch the /movies/ page (the actual player page)
const url = 'https://movibox.net/movies/your-heart-will-be-broken-Sd9JnEVRmr7?id=6245590300333851720&type=/movie/detail&detailSe=&detailEp=&lang=en';
const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }};

function resolveRef(arr, idx, depth = 0) {
  if (depth > 10 || idx === null || idx === undefined) return null;
  const val = arr[idx];
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map((v, i) => resolveRef(arr, v, depth + 1));
  const obj = {};
  for (const [k, v] of Object.entries(val)) {
    obj[k] = resolveRef(arr, v, depth + 1);
  }
  return obj;
}

https.get(url, opts, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const matches = d.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/g);
    if (!matches) { console.log('No NUXT_DATA'); return; }
    
    const content = matches[0].replace(/<\/?script[^>]*>/g, '');
    const arr = JSON.parse(content);
    
    // Find all video-related strings
    console.log('=== Video-related strings ===');
    for (let j = 0; j < arr.length; j++) {
      const v = arr[j];
      if (typeof v === 'string' && (v.includes('hakunaymatata') || v.includes('bcdnxw') || v.includes('mp4') || v.includes('m3u8') || v.includes('videoAddress') || v.includes('playUrl') || v.includes('serverList') || v.includes('filmList'))) {
        console.log('  idx', j, ':', JSON.stringify(v).slice(0, 300));
      }
    }
    
    // Find objects with video-related keys
    console.log('\n=== Objects with video keys ===');
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
      const keys = Object.keys(val);
      if (keys.some(k => ['videoAddress', 'playUrl', 'serverList', 'filmList', 'sourceList', 'videoUrl', 'url', 'playSrc'].includes(k))) {
        console.log('  idx', i, 'keys:', keys.join(', '));
        const resolved = resolveRef(arr, i);
        console.log('  resolved:', JSON.stringify(resolved).slice(0, 500));
      }
    }
    
    // Also look for the main data structure
    console.log('\n=== Top-level structure (idx 0-15) ===');
    for (let j = 0; j < Math.min(15, arr.length); j++) {
      console.log('  idx', j, ':', JSON.stringify(arr[j]).slice(0, 200));
    }
  });
});
