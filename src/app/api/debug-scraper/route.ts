import { NextResponse } from "next/server";
import { getHome } from "@/lib/scraper";

export async function GET() {
  try {
    const home = await getHome();
    
    // Sample items to see structure
    const sampleItems = home.sections.flatMap(s => s.items).slice(0, 5);
    
    // Also check nuxt data
    const nuxtData = (globalThis as any).__MOVIBOX_NUXT_DATA__;
    
    return NextResponse.json({
      sectionCount: home.sections.length,
      totalItems: home.sections.reduce((acc, s) => acc + s.items.length, 0),
      heroCount: home.hero.length,
      allItemsWithImages: home.sections.flatMap(s => s.items).filter(i => i.thumbnail).length,
      allItemsWithTitles: home.sections.flatMap(s => s.items).filter(i => i.title).length,
      sampleItems: sampleItems.map(i => ({
        title: i.title,
        thumbnail: i.thumbnail,
        slug: i.slug,
      })),
      nuxtDataLength: nuxtData ? nuxtData.length : 0,
      nuxtDataSample: nuxtData && nuxtData.length > 0 ? JSON.stringify(nuxtData[0]).substring(0, 1000) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}