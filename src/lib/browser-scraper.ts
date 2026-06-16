import puppeteer from "puppeteer";

const BASE_URL = process.env.URL_SCRAPPING?.replace(/\/+$/, "") ?? "https://movibox.net";

export interface BrowserResult {
  html: string;
  nuxtData: any[] | null;
  nuxtState: Record<string, unknown> | null;
}

export async function fetchPageWithBrowser(path: string): Promise<BrowserResult> {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox", 
      "--disable-dev-shm-usage", 
      "--disable-gpu",
      "--disable-web-security",
    ] 
  });
  
  try {
    const page = await browser.newPage();
    
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");
    
    await page.goto(`${BASE_URL}${path}`, { 
      waitUntil: "networkidle0", 
      timeout: 25000 
    });
    
    // Wait for Nuxt to hydrate
    await page.waitForFunction(() => {
      const nuxt = (window as any).__NUXT__;
      return nuxt && nuxt.data && nuxt.data.length > 0;
    }, { timeout: 12000 }).catch(() => {});
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract Nuxt state
    const nuxtRaw = await page.evaluate(() => {
      const nuxt = (window as any).__NUXT__;
      return {
        nuxtData: nuxt?.data ? JSON.stringify(nuxt.data) : null,
        nuxtState: nuxt?.state ? JSON.stringify(nuxt.state) : null,
      };
    });
    
    const html = await page.content();
    
    return {
      html,
      nuxtData: nuxtRaw.nuxtData ? JSON.parse(nuxtRaw.nuxtData) : null,
      nuxtState: nuxtRaw.nuxtState ? JSON.parse(nuxtRaw.nuxtState) : null,
    };
  } finally {
    await browser.close();
  }
}