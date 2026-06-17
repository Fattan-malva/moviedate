import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Check the actual HTML structure for stream servers and episodes
const slug = 'spider-noir-true-hue-full-color-eZnPfAZAfM4';

try {
  const { data } = await axios.get(`${BASE_URL}/detail/${slug}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 15000,
  });
  const $ = cheerio.load(data);
  
  // Check resource-container
  console.log('=== resource-container ===');
  $('.resource-container').each((i, el) => {
    console.log($(el).html()?.substring(0, 500));
  });
  
  // Check type-tab-container
  console.log('\n=== type-tab-container ===');
  $('.type-tab-container').each((i, el) => {
    console.log($(el).html()?.substring(0, 500));
  });
  
  // Check all elements with data attributes
  console.log('\n=== Elements with data-url/data-video/data-src ===');
  $('[data-url], [data-video], [data-src]').each((i, el) => {
    const $el = $(el);
    console.log(`${$el.prop('tagName')} class="${$el.attr('class')}" data-url="${$el.attr('data-url')}" data-video="${$el.attr('data-video')}" data-src="${$el.attr('data-src')}"`);
  });
  
  // Check Nuxt payload for stream server data
  const payloadMatch = data.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (payloadMatch) {
    const arr = JSON.parse(payloadMatch[1]);
    console.log('\n=== Nuxt payload stream/video data ===');
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (typeof val === 'string' && (val.includes('macdn') || val.includes('mp4') || val.includes('m3u8') || val.includes('stream') || val.includes('server') || val.includes('lklk') || val.includes('Netflix') || val.includes('Plex'))) {
        console.log(`  [${i}] =`, val.substring(0, 200));
      }
    }
  }
  
} catch (err) {
  console.error('Error:', err.message);
}
