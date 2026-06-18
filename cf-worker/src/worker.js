export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Range",
          "Access-Control-Expose-Headers": "Content-Range, Content-Length",
        },
      });
    }

    const url = new URL(request.url);
    const videoUrl = url.searchParams.get("url");

    if (!videoUrl) {
      return new Response("Missing url parameter", { status: 400 });
    }

    try {
      new URL(videoUrl);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    const range = request.headers.get("Range");
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://movibox.net/",
      Origin: "https://movibox.net",
    };

    if (range) {
      headers["Range"] = range;
    }

    const response = await fetch(videoUrl, { headers });

    if (!response.ok && response.status !== 206) {
      return new Response(`Upstream error: ${response.status}`, { status: 502 });
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "Range");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Range, Content-Length");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  },
};
