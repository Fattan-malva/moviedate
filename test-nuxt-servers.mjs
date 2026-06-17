import axios from 'axios';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';
const slug = 'spider-noir-true-hue-full-color-eZnPfAZAfM4';

const { data } = await axios.get(`${BASE_URL}/detail/${slug}`, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  },
  timeout: 15000,
});

const payloadMatch = data.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr = JSON.parse(payloadMatch[1]);

// Print all entries around the video URL (index 36)
console.log('=== Nuxt payload indices 25-50 ===');
for (let i = 25; i < Math.min(50, arr.length); i++) {
  const val = arr[i];
  const type = typeof val === 'object' && val !== null ? (Array.isArray(val) ? 'array' : 'object') : typeof val;
  console.log(`[${i}] (${type}) =`, JSON.stringify(val)?.substring(0, 200));
}

// Find all objects that might be stream servers
console.log('\n=== Objects with name/url-like keys ===');
for (let i = 0; i < arr.length; i++) {
  const val = arr[i];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.includes('name') || keys.includes('url') || keys.includes('src') || keys.includes('serverName')) {
      console.log(`[${i}] keys:`, keys.join(', '));
      // Resolve refs
      const resolved = {};
      for (const [k, refIdx] of Object.entries(val)) {
        resolved[k] = typeof refIdx === 'number' && refIdx < arr.length ? arr[refIdx] : refIdx;
      }
      console.log(`  resolved:`, JSON.stringify(resolved).substring(0, 300));
    }
  }
}

// Find arrays that might contain server lists
console.log('\n=== Arrays with server-like items ===');
for (let i = 0; i < arr.length; i++) {
  const val = arr[i];
  if (Array.isArray(val) && val.length > 0 && val.length < 20) {
    const firstItem = val[0];
    if (typeof firstItem === 'number' && firstItem < arr.length) {
      const item = arr[firstItem];
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.includes('name') || keys.includes('url') || keys.includes('src')) {
          console.log(`[${i}] array of ${val.length} items, first item keys:`, keys.join(', '));
        }
      }
    }
  }
}
