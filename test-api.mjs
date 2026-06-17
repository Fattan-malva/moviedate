import axios from 'axios';

const API_BASE = 'https://h5-api.aoneroom.com';
const BASE_URL = process.env.URL_SCRAPPING || 'https://movibox.net';

// First, get the subjectId from the detail page
const slug = 'tom-clancys-jack-ryan-ghost-war-m9L6Jm8rn49';
const { data: html } = await axios.get(`${BASE_URL}/detail/${slug}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  timeout: 15000,
});

const payloadMatch = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const arr = JSON.parse(payloadMatch[1]);

// subjectId is at index 12
const subjectId = arr[12];
console.log('SubjectId:', subjectId);

// Try various API endpoints for episodes
const endpoints = [
  `/api/v2/subject/episode?subjectId=${subjectId}`,
  `/api/v2/subject/resource?subjectId=${subjectId}`,
  `/api/v2/subject/episodes?subjectId=${subjectId}`,
  `/api/v2/subject/season?subjectId=${subjectId}`,
  `/api/v2/subject/seasons?subjectId=${subjectId}`,
  `/api/v2/subject/detail?subjectId=${subjectId}`,
  `/api/v2/subject/info?subjectId=${subjectId}`,
  `/api/v2/resource/episodes?subjectId=${subjectId}`,
  `/api/v2/resource/seasons?subjectId=${subjectId}`,
  `/api/v2/episode/list?subjectId=${subjectId}`,
  `/api/v2/season/list?subjectId=${subjectId}`,
];

for (const ep of endpoints) {
  try {
    const { data } = await axios.get(`${API_BASE}${ep}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://movibox.net',
        'Referer': 'https://movibox.net/',
      },
      timeout: 5000,
    });
    console.log(`\n✅ ${ep}:`);
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
  } catch (err) {
    console.log(`❌ ${ep}: ${err.response?.status || err.message}`);
  }
}
