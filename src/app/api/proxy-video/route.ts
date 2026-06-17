import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  try {
    // Handle range requests for video seeking
    const range = request.headers.get("range");

    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Referer": "https://movibox.net/",
      "Origin": "https://movibox.net",
    };

    if (range) {
      headers["Range"] = range;
    }

    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Failed to fetch video: ${response.statusText}`, { status: response.status });
    }

    // Forward relevant headers
    const responseHeaders: Record<string, string> = {
      "Content-Type": response.headers.get("Content-Type") || "video/mp4",
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
    };

    const contentLength = response.headers.get("Content-Length");
    const contentRange = response.headers.get("Content-Range");

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    // Stream the response body
    return new NextResponse(response.body, {
      status: response.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Video proxy error:", error);
    return new NextResponse("Error fetching video", { status: 500 });
  }
}
