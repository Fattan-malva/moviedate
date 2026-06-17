import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Fetch the /movies/ page (the actual video player page)
const { data } = await axios.get(BASE_URL + '/movies/your-heart-will-be-broken-Sd9JnEVRmr7?id=6245590300333851720&type=/movie/detail&detailSe=&detailEp=&lang=en', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  timeout: 15000,
});
const $ = cheerio.load(data);

console.log('=== Page title ===');
console.log($('title').text());

console.log('\n=== Video elements ===');
$('video, video source, iframe').each((i, el) => {
  const tag = $(el).prop('tagName');
  const src = $(el).attr('src') || '';
  const dataSrc = $(el).attr('data-src') || '';
  console.log(`${tag}: src=${src.substring(0, 150)} data-src=${dataSrc.substring(0, 150)}`);
});

console.log('\n=== Nuxt payload video data ===');
const payloadMatch = data.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (payloadMatch) {
  const arr = JSON.parse(payloadMatch[1]);
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (typeof val === 'string' && (
      val.includes('.mp4') || val.includes('.m3u8') || val.includes('video') || 
      val.includes('player') || val.includes('embed') || val.includes('stream') ||
      val.includes('macdn') || val.includes('aoneroom') || val.includes('iframe')
    )) {
      console.log(`[${i}] =`, val.substring(0, 200));
    }
  }
}

console.log('\n=== iframes ===');
$('iframe').each((i, el) => {
  console.log(`iframe[${i}]: src=${$(el).attr('src')}, title=${$(el).attr('title')}`);
});

console.log('\n=== data attributes with video ===');
$('[data-src*="mp4"], [data-src*="m3u8"], [data-video], [data-url], [data-src]').each((i, el) => {
  const $el = $(el);
  console.log(`${$el.prop('tagName')}: data-src=${$el.attr('data-src')}, data-video=${$el.attr('data-video')}, data-url=${$el.attr('data-url')}`);
});
