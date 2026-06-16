# TASK: Implement a Scraper Using the Existing Project Architecture

You are working inside an existing Next.js/TypeScript project.

## Primary Objective

Implement a new scraper for the website defined in:

```env
URL_SCRAPPING=https://movibox.net/
```

The scraper must follow the existing project's architecture, coding conventions, folder structure, separation of concerns, typing strategy, and API design.

Important:

* Do not assume the target website structure.
* Do not hardcode selectors before analyzing the site.
* Discover all selectors directly from the website defined in `URL_SCRAPPING`.
* Build the scraper based on the actual HTML structure and network behavior of the target site.

---

# Architecture Requirements

Use the following stack and approach:

### HTTP Layer

* Axios
* Centralized HTTP client
* Custom User-Agent
* Standard browser headers
* Configurable timeout
* Reusable request utilities

### Parsing Layer

* Cheerio
* Server-side HTML parsing
* Reusable selector extraction helpers

### Scraper Layer

Create dedicated scraper functions for:

* Home page content
* Trending content
* Latest content
* Search
* Detail page
* Episode list
* Episode detail
* Genre/category list
* Genre/category page
* Pagination support

### API Layer

API routes must:

* Call scraper functions only
* Return typed JSON responses
* Contain no scraping logic

### Configuration Layer

All domains and URLs must come from environment variables.

Never hardcode the target domain.

---

# Discovery Phase (Required Before Coding)

Analyze the target website and identify:

1. Home page sections
2. Trending content section
3. Latest content section
4. Search implementation
5. Detail page structure
6. Episode list structure
7. Episode detail structure
8. Embedded player/video sources
9. Genre/category pages
10. Pagination system
11. AJAX endpoints
12. API endpoints (if any)
13. Required headers/cookies
14. Lazy-loaded content
15. Dynamic content loading behavior

Document every selector and endpoint discovered.

---

# Data Models

Create strongly typed interfaces based on the actual website structure.

Example:

```ts
interface ContentItem {
  slug: string
  title: string
  thumbnail: string

  type?: string
  status?: string
  rating?: string
  synopsis?: string

  genres?: string[]

  releaseDate?: string
  duration?: string

  latestEpisode?: string
}
```

```ts
interface Episode {
  slug: string
  number: string

  title?: string
  date?: string
}
```

```ts
interface EpisodeDetail {
  videoUrl?: string

  streamServers?: StreamServer[]

  prev?: string
  next?: string

  episodes?: Episode[]
}
```

```ts
interface Genre {
  name: string
  slug: string
  count?: number
}
```

```ts
interface ListResponse<T> {
  items: T[]
  totalPages?: number
  currentPage?: number
}
```

Adjust these interfaces according to the actual data available on the target website.

---

# Required Functions

Implement scraper functions equivalent to:

```ts
getHome()
getTrending()
getLatest()

search(query, page)

getDetail(slug)

getEpisodeList(slug)
getEpisodeDetail(slug)

getGenres()
getGenre(slug, page)
```

Rename functions if needed to match project conventions.

---

# Environment Variables

Use:

```env
URL_SCRAPPING=https://movibox.net/
```

Create reusable helpers:

```ts
getDomain()
buildUrl()
```

All URLs must be generated dynamically from environment configuration.

---

# HTTP Client Requirements

Create a reusable Axios instance that includes:

* User-Agent
* Accept
* Accept-Language
* Referer (when required)
* Timeout configuration
* Error handling
* Retry strategy (if already used in the project)

Example structure:

```ts
httpClient.ts
scraper.ts
types.ts
utils.ts
```

---

# Output Requirements

Generate:

1. Folder structure
2. Type definitions
3. Axios client
4. Utility helpers
5. Scraper implementation
6. API route examples
7. Selector documentation
8. Endpoint documentation
9. Pagination handling
10. Search handling
11. Detail-page extraction logic
12. Episode extraction logic
13. Video/player extraction logic

The implementation must integrate seamlessly with the current project architecture and be maintainable, strongly typed, reusable, and production-ready.
