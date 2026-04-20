import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

const FIREBASE_PROJECT = "luo-film-site";
const FIREBASE_API_KEY = "AIzaSyDLTChrn95RRzf-iVEhKjh5JJoX9rKTvNY";

const BOT_KEYWORDS = [
  "whatsapp", "telegram", "telegrambot", "discordbot", "facebook",
  "twitterbot", "facebookexternalhit", "linkedinbot", "slackbot",
  "googlebot", "applebot", "pinterest", "ia_archiver", "msnbot",
  "bingbot", "yandex", "baidu", "bot/", "crawler", "spider", "curl",
  "wget", "python-requests", "java/", "scrapy",
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_KEYWORDS.some((k) => lower.includes(k));
}

function parseFirestoreField(val: any): string {
  if (!val) return "";
  if (val.stringValue !== undefined) return String(val.stringValue);
  if (val.integerValue !== undefined) return String(val.integerValue);
  if (val.doubleValue !== undefined) return String(val.doubleValue);
  if (val.booleanValue !== undefined) return String(val.booleanValue);
  return "";
}

async function getContent(id: string) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/content/${id}?key=${FIREBASE_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.fields) return null;
    const f = data.fields;
    return {
      title: parseFirestoreField(f.title),
      description: parseFirestoreField(f.description),
      coverUrl:
        parseFirestoreField(f.coverUrl) ||
        parseFirestoreField(f.thumbnailUrl),
      type: parseFirestoreField(f.type),
    };
  } catch {
    return null;
  }
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = req.headers["user-agent"] || "";
  const id = (req.query.id as string) || "";

  if (!id) {
    res.status(404).send("Not found");
    return;
  }

  const host = req.headers.host || "luofilm.site";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;
  const pageUrl = `${baseUrl}/play/${id}`;

  if (!isBot(ua)) {
    const candidates = [
      path.join(process.cwd(), "dist", "index.html"),
      path.join(process.cwd(), "public", "index.html"),
      path.join(process.cwd(), "index.html"),
    ];
    for (const p of candidates) {
      try {
        const html = fs.readFileSync(p, "utf8");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        return res.send(html);
      } catch {}
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=/"></head><body></body></html>`);
  }

  const content = await getContent(id);

  const movieTitle = content?.title || "LUOFILM.SITE";
  const typeLabel = content?.type === "series" ? "Series" : "Movie";
  const ogTitle = `${movieTitle} — VJ PAUL UG FREE DOWNLOAD | LUOFILM.SITE`;
  const ogDesc = content?.description
    ? `${content.description} | VJ PAUL UG FREE DOWNLOAD on LUOFILM.SITE`
    : `Watch ${typeLabel}: ${movieTitle} free — VJ PAUL UG FREE DOWNLOAD on LUOFILM.SITE`;
  const ogImage = content?.coverUrl
    ? content.coverUrl
    : `${baseUrl}/logo.png`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escHtml(ogTitle)}</title>
  <meta name="description" content="${escHtml(ogDesc)}">

  <meta property="og:type" content="video.movie">
  <meta property="og:url" content="${escHtml(pageUrl)}">
  <meta property="og:title" content="${escHtml(ogTitle)}">
  <meta property="og:description" content="${escHtml(ogDesc)}">
  <meta property="og:image" content="${escHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="LUOFILM.SITE">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(ogTitle)}">
  <meta name="twitter:description" content="${escHtml(ogDesc)}">
  <meta name="twitter:image" content="${escHtml(ogImage)}">

  <meta http-equiv="refresh" content="0;url=${escHtml(pageUrl)}">
</head>
<body style="background:#0e0e0e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:16px;padding:32px;box-sizing:border-box">
  ${ogImage !== `${baseUrl}/logo.png` ? `<img src="${escHtml(ogImage)}" alt="${escHtml(movieTitle)}" style="max-width:280px;max-height:420px;object-fit:cover;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.6)">` : `<img src="${baseUrl}/logo.png" style="width:80px;height:80px;object-fit:contain">`}
  <h1 style="margin:0;font-size:22px;text-align:center">${escHtml(movieTitle)}</h1>
  <p style="margin:0;color:#cc00cc;font-weight:700;font-size:14px">VJ PAUL FREE DOWNLOAD | LUOFILM.SITE</p>
  <a href="${escHtml(pageUrl)}" style="background:#cc00cc;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px">▶ Watch Now</a>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
  return res.send(html);
}
