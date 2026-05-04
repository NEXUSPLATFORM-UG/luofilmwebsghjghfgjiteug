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
      : `LUOFILM.SITE — #1 Luo Translated Movies, Series & All Genres | VJ Paul UG | Uganda`;

    const fullDescription =
      description ||
      "LUOFILM.SITE — Kakube me neno film ki series i luo. Streaming platform madit ki ber loyo weng i Uganda. Neno ki download film ma lubo i luo — action, comedy, horror, thriller, war, drama, Indian series, Korean, family movies, animation, romance, documentary, anime ki weng — ma gico ki VJ Paul UG. Website matek, video ma gipwodo, ki app ma twero neno offline. Free ki VIP. #1 Luo streaming platform i world.";

    const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

    document.title = fullTitle;

    setMeta("title", fullTitle);
    setMeta("description", fullDescription);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    setLink("canonical", fullUrl);

    setMeta("og:title", fullTitle, true);
    setMeta("og:description", fullDescription, true);
    setMeta("og:url", fullUrl, true);
    setMeta("og:image", image, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", SITE_NAME, true);

    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", fullDescription);
    setMeta("twitter:image", image);
    setMeta("twitter:card", "summary_large_image");

  }, [title, description, keywords, image, url, type, noIndex]);
}
