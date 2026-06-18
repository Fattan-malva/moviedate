import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const range = request.headers.get("range");

  // Try multiple referer strategies for CDN compatibility.
  // movibox.net referer is tried first since most CDNs check for this.
  const refererStrategies = [
    "https://movibox.net/",
    new URL(url).origin + "/",
    undefined,
  ];

  let lastError = "";

  for (const referer of refererStrategies) {
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity;q=1, *;q=0",
      };

      if (referer) {
        headers["Referer"] = referer;
        headers["Origin"] = new URL(referer).origin;
      }

      if (range) {
        headers["Range"] = range;
      }

      const response = await fetch(url, { headers, redirect: "follow" });

      if (response.ok || response.status === 206) {
        const responseHeaders: Record<string, string> = {
          "Content-Type": response.headers.get("Content-Type") || "video/mp4",
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Range",
          "Access-Control-Expose-Headers": "Content-Range, Content-Length",
          "Cache-Control": "public, max-age=3600",
        };

        const cl = response.headers.get("Content-Length");
        const cr = response.headers.get("Content-Range");
        if (cl) responseHeaders["Content-Length"] = cl;
        if (cr) responseHeaders["Content-Range"] = cr;

        return new NextResponse(response.body, {
          status: response.status === 206 ? 206 : 200,
          headers: responseHeaders,
        });
      }

      lastError = `${response.status} ${response.statusText} (referer=${referer})`;
    } catch (err: any) {
      lastError = `${err.message} (referer=${referer})`;
    }
  }

  console.error(`Video proxy failed for ${url}: ${lastError}`);
  return new NextResponse(`Failed to fetch video: ${lastError}`, { status: 502 });
}
