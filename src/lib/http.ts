import axios, { AxiosInstance, AxiosError } from "axios";

const BASE_URL = process.env.URL_SCRAPPING?.replace(/\/+$/, "") ?? "https://movibox.net";
const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: BASE_URL + "/",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  },
  decompress: true,
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as { retryCount?: number; url?: string } | undefined;
    if (!config) return Promise.reject(error);

    config.retryCount = config.retryCount ?? 0;

    if (config.retryCount < MAX_RETRIES && shouldRetry(error)) {
      config.retryCount += 1;
      await delay(RETRY_DELAY * config.retryCount);
      return httpClient(config);
    }

    return Promise.reject(error);
  }
);

function shouldRetry(error: AxiosError): boolean {
  if (!error.response) return true;
  const status = error.response.status;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDomain(): string {
  return BASE_URL;
}

export function buildUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

export function buildRelativePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
