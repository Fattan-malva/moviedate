# MoviBox Scraper Discovery

Target domain is configured by `URL_SCRAPPING` and is not hardcoded in scraper calls.

## Website Behavior

- Framework: Nuxt SSR app.
- Main content is server-rendered HTML and can be parsed with Cheerio.
- Static assets load from `spa.aoneroom.com` and images load from external CDN hosts.
- Public runtime config in `window.__NUXT__.config` references `https://h5-api.aoneroom.com`, but tested direct API guesses returned 404. The scraper therefore uses rendered pages first and falls back to local filtering where needed.
- Standard desktop browser headers are accepted; no special cookies were required for the pages tested.

## Pages Tested

- `/`: home page with hero content and section rows.
- `/movie`: movie category page with category sections.
- `/tv-series`: listing/filter page with genres, countries, years, languages, and sort labels.
- `/ranking-list`: trending/ranking page with ranked entries.
- `/search?q=action`: returned 404, so search uses alternative paths and a home-page fallback.

## Selectors

- Content cards: `a[href^='/detail/'], a[href*='/detail/']`
- Sections: `.movie-card-list-box, .comp-box.has-content, section, .work-list > div`
- Section titles: `.title, h2, h3`
- Card title: `.card-title, .title, h3, h2`, then `img[alt]`, then cleaned text fallback
- Card thumbnail: `img[src]`, then `img[data-src]`
- Detail title: `h1`, then `meta[property='og:title']`
- Detail synopsis: `meta[name='description']`, then `.desc, .description, .synopsis`
- Detail image: `meta[property='og:image']`, then `.cover img, .poster img, img`
- Detail genres: `a[href*='genre'], .genre a, .tag-list a`
- Episodes: `a[href*='/video/'], a[href*='episode'], .episode a`
- Video servers: `iframe[src], video[src], video source[src], a[href*='m3u8'], a[href*='mp4']`
- Pagination: `a[href*='page='], .pagination a, .pager a`

## Implemented API Routes

- `GET /api/scraper/home`
- `GET /api/scraper/trending`
- `GET /api/scraper/latest`
- `GET /api/scraper/search?q=keyword&page=1`
- `GET /api/scraper/detail/[...slug]`
- `GET /api/scraper/episodes/[...slug]`
- `GET /api/scraper/episode/[...slug]`
- `GET /api/scraper/genres`
- `GET /api/scraper/genre/[...slug]?page=1`

## Notes

- MoviBox markup is heavily class-scoped and may change with Nuxt builds, so selectors prefer semantic URL patterns and meta tags over generated classes.
- The scraper keeps all parsing in `src/lib/scraper.ts`; API routes only call scraper functions and return JSON.
