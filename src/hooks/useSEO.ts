import { useEffect } from "react";

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://luofilm.site";
const DEFAULT_IMAGE = `${BASE_URL}/logo.png`;
const SITE_NAME = "LUOFILM.SITE";

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
}: SEOConfig) {
  useEffect(() => {
    const fullTitle = title
      ? `${SITE_NAME} — ${title}`
      : `${SITE_NAME} — Luo Translated Movies & Drama | VJ Paul UG`;

    const fullDescription =
      description ||
      "Stream and download Luo translated movies, drama, series and anime — translated by VJ Paul UG. The #1 Luo streaming platform worldwide.";

    const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    // Title
    document.title = fullTitle;

    // Primary meta
    setMeta("title", fullTitle);
    setMeta("description", fullDescription);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Canonical
    setLink("canonical", fullUrl);

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", fullDescription, true);
    setMeta("og:url", fullUrl, true);
    setMeta("og:image", image, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", SITE_NAME, true);

    // Twitter
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", fullDescription);
    setMeta("twitter:image", image);
    setMeta("twitter:card", "summary_large_image");

  }, [title, description, keywords, image, url, type, noIndex]);
}
