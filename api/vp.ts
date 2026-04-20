import type { VercelRequest, VercelResponse } from "@vercel/node";

const XOR_KEY = 0x7E;

function decodeUrl(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ (XOR_KEY + (i % 7));
  }
  return out.toString("utf8");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { u } = req.query;
  if (!u || typeof u !== "string") return res.status(400).end();

  let videoUrl: string;
  try {
    videoUrl = decodeUrl(u);
    new URL(videoUrl);
  } catch {
    return res.status(400).end();
  }

  try {
    const range = req.headers["range"];
    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (compatible; StreamBot/1.0)",
      "Accept": "*/*",
    };
    if (range) upstreamHeaders["Range"] = range;

    const upstream = await fetch(videoUrl, { headers: upstreamHeaders });

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    const ct = upstream.headers.get("content-type") || "video/mp4";
    res.setHeader("Content-Type", ct);

    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);

    const cr = upstream.headers.get("content-range");
    if (cr) res.setHeader("Content-Range", cr);

    res.status(upstream.status);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } finally {
        res.end();
      }
    } else {
      res.end();
    }
  } catch {
    res.status(502).end();
  }
}
