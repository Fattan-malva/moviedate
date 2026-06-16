import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

const BASE_URL = process.env.URL_SCRAPPING?.replace(/\/+$/, "") ?? "https://movibox.net";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/";
  
  try {
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage", 
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process"
      ] 
    });
    
    try {
      const page = await browser.newPage();
      
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      });
      
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");
      
      await page.goto(`${BASE_URL}${path}`, { 
        waitUntil: "networkidle0", 
        timeout: 25000 
      });
      
      // Wait for Nuxt hydration
      await page.waitForFunction(() => {
        const nuxt = (window as any).__NUXT__;
        return nuxt && nuxt.data && nuxt.data.length > 0;
      }, { timeout: 12000 }).catch(() => {});
      
      // Extra wait for all network requests to settle
      await page.waitForFunction(() => {
        return document.readyState === "complete";
      }, { timeout: 10000 }).catch(() => {});
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract __NUXT__ state for structured data
      const nuxtData = await page.evaluate(() => {
        const nuxt = (window as any).__NUXT__;
        return {
          nuxtData: nuxt ? JSON.stringify(nuxt.data) : null,
          nuxtState: nuxt ? JSON.stringify(nuxt.state) : null,
          error: nuxt ? null : "__NUXT__ not found"
        };
      });
      
      // Get HTML content
      const html = await page.content();
      
      // Return both HTML and Nuxt state
      return NextResponse.json({ 
        html,
        nuxtData: nuxtData.nuxtData,
        nuxtState: nuxtData.nuxtState,
        error: nuxtData.error
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    return NextResponse.json({ error: "Browser fetch failed", details: String(error) }, { status: 500 });
  }
}