import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// Try a TV series that should have episodes
const slugs = [
  'spider-noir-true-hue-full-color-eZnPfAZAfM4',
];

for (const slug of slugs) {
  console.log(`\n=== ${slug} ===`);
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
    
    // Check Nuxt payload for episodes
    const payloadMatch = data.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (payloadMatch) {
      const arr = JSON.parse(payloadMatch[1]);
      console.log('Nuxt payload length:', arr.length);
      
      // Find episode-related data
      for (let i = 0; i < arr.length; i++) {
        const val = arr[i];
        if (typeof val === 'string' && (val.includes('episode') || val.includes('Episode') || val.includes('ep ') || val.includes('Ep '))) {
          console.log(`  [${i}] =`, val.substring(0, 100));
        }
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          const keys = Object.keys(val);
          if (keys.some(k => k.includes('episode') || k.includes('Episode') || k.includes('epList') || k.includes('resourceList'))) {
            console.log(`  [${i}] object keys:`, keys.join(', '));
          }
        }
      }
    }
    
    // Check HTML for episode links
    console.log('\nHTML episode links:');
    $('a[href*="/video/"], a[href*="/episode/"], a[href*="episode"]').each((i, el) => {
      console.log(`  ${$(el).text().trim().substring(0, 30)} -> ${$(el).attr('href')}`);
    });
    
    // Check for episode containers
    console.log('\nEpisode containers:');
    $('[class*="episode"], [class*="Episode"], .type-tab-container, .resource-container').each((i, el) => {
      console.log(`  class="${$(el).attr('class')}" children=${$(el).children().length}`);
    });
    
    // Check for video/iframe
    console.log('\nVideo/iframe elements:');
    $('video, iframe').each((i, el) => {
      console.log(`  ${$(el).prop('tagName')} src=${$(el).attr('src')?.substring(0, 100)}`);
    });
    
    // Check for type-item (episode tabs)
    console.log('\nType items:');
    $('.type-item, [class*="type-item"]').each((i, el) => {
      console.log(`  ${$(el).text().trim().substring(0, 50)} href=${$(el).attr('href') || $(el).find('a').attr('href') || 'none'}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}
