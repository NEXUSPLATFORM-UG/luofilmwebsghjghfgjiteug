import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { fbApi } from "../lib/firebaseApi";
import { auth } from "../lib/firebase";
import { useSEO } from "../hooks/useSEO";

interface CategoryPageProps {
  genre: string;
  title: string;
  description: string;
}

interface Show {
  id: string;
  title: string;
  type: string;
  episodeCount?: number;
  badge?: string;
  genre?: string;
  year?: number;
  rating?: number;
  description?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  updatedAt?: number;
}

const GENRE_KEYWORDS: Record<string, string[]> = {
  drama: ["romance", "drama", "campus", "modern", "period", "medical", "thriller", "comedy"],
  movie: ["movie"],
  variety: ["comedy", "variety", "campus", "modern"],
  sports: ["action", "wuxia", "sports"],
  documentary: ["historical", "mystery", "documentary"],
  anime: ["fantasy", "xianxia", "anime"],
};

const GENRE_COLORS: Record<string, string> = {
  drama: "#e05a7a",
  movie: "#e06a20",
  variety: "#7c3aed",
  sports: "#059669",
  documentary: "#2563eb",
  anime: "#db2777",
};

function toShow(d: any): Show {
  return {
    id: d.id,
    title: d.title || "",
    type: d.type || "series",
    episodeCount: d.episodeCount || 0,
    badge: d.badge || "none",
    genre: d.genre || "",
    year: d.year || new Date().getFullYear(),
    rating: d.rating || 0,
    description: d.description || "",
    coverUrl: d.coverUrl || d.thumbnailUrl || "",
    thumbnailUrl: d.thumbnailUrl || d.coverUrl || "",
    updatedAt: typeof d.updatedAt === "number" ? d.updatedAt : (d.updatedAt?.toMillis?.() ?? d.createdAt ?? 0),
  };
}

function ShowCard({ show }: { show: Show }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/play/${show.id}`}>
      <div style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{ position: "relative", paddingTop: "133.33%", borderRadius: 6, overflow: "hidden", background: "#1a1a1a" }}>
          <img src={show.thumbnailUrl} alt={show.title} loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.35s ease" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, backgroundImage: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55))" }} />
          {show.badge && show.badge !== "none" && (
            <span style={{
              position: "absolute", top: 0, right: 0, height: 18, lineHeight: "18px", padding: "0 6px",
              borderRadius: "0 6px 0 6px", fontSize: 11, fontWeight: 700,
              background: show.badge === "VIP" ? "linear-gradient(45deg,#ffc552,#ffdd9a)" : show.badge === "Express" ? "linear-gradient(45deg,#00a3f5,#00c9fd)" : "linear-gradient(45deg,#8819ff,#ad61ff)",
              color: show.badge === "VIP" ? "#4e2d03" : "#fff",
            }}>{show.badge}</span>
          )}
          {show.type === "series" && (show.episodeCount || 0) > 0 && show.updatedAt && (Date.now() - show.updatedAt) < 48 * 60 * 60 * 1000 && (
            <span style={{
              position: "absolute", bottom: 5, left: 0, right: 0, textAlign: "center",
              fontSize: 10, fontWeight: 800, color: "#fff",
              background: "linear-gradient(90deg,#00c853,#00e676)",
              padding: "2px 0", letterSpacing: "0.5px",
            }}>NEW · EP {show.episodeCount}</span>
          )}
        </div>
        <div style={{ paddingTop: 6, paddingBottom: 4 }}>
          <div className="cat-card-title" style={{ fontSize: 13, fontWeight: 500, color: hovered ? "#00a9f5" : "rgba(255,255,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "18px", transition: "color 0.2s" }} title={show.title}>
            {show.title}
          </div>
          <div className="cat-card-sub" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {show.type === "series" ? `${show.episodeCount} EPS · ` : "MOVIE · "}{(show.genre || "").split(" · ")[0].toUpperCase()}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryPage({ genre, title, description: _description }: CategoryPageProps) {
  const keywords = GENRE_KEYWORDS[genre] || [];
  const accentColor = GENRE_COLORS[genre] || "#00a9f5";
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  const seoDescriptions: Record<string, string> = {
    drama: "Watch Luo translated series & drama — Korean drama, Indian series, Chinese drama, Turkish series, romance, family, historical, short series and ALL types — all translated by VJ Paul UG (Senior Paul) on LUOFILM.SITE. Free streaming.",
    movie: "Stream and download ALL Luo translated movies — action, comedy, horror, thriller, romance, sci-fi, war, family, biography, animation & every genre — Hollywood, Bollywood, Korean, Indian, Chinese and more — all translated by VJ Paul UG (Senior Paul) on LUOFILM.SITE.",
    anime: "Watch Luo translated anime — action anime, fantasy, xianxia, adventure, comedy anime and all types — translated by VJ Paul UG (Senior Paul) on LUOFILM.SITE.",
    variety: "Watch Luo translated variety, comedy shows, reality TV, game shows and talk shows on LUOFILM.SITE, all translated by VJ Paul UG (Senior Paul).",
    sports: "Watch Luo translated sports and martial arts content on LUOFILM.SITE, translated by VJ Paul UG (Senior Paul).",
    documentary: "Watch Luo translated documentaries — history, nature, true stories and historical shows — all translated by VJ Paul UG (Senior Paul) on LUOFILM.SITE.",
  };
  const seoKeywords: Record<string, string> = {
    drama: "luo translated drama, luo translated series, luo drama series, luo short series, vj paul drama, senior paul drama, luo romance drama, luo korean drama, luo chinese drama, luo indian series, luo turkish series, luo translated 2025, luofilm series",
    movie: "luo translated movies, luo movies 2025, luo movies download, vj paul movies, senior paul movies, luo action movies, luo comedy, luo horror, luo thriller, luo romance movies, luo film, luofilm movies, watch luo movies free",
    anime: "luo translated anime, luo anime series, vj paul anime, senior paul anime, luo fantasy anime, luo xianxia, luo action anime",
    variety: "luo variety shows, luo comedy shows, vj paul variety, senior paul variety, luo translated variety, luo reality tv",
    sports: "luo sports, luo martial arts, vj paul sports, senior paul sports, luo translated action",
    documentary: "luo documentary, luo historical documentary, vj paul documentary, senior paul documentary, luo translated documentary",
  };
  useSEO({
    title: `Luo Translated ${title} — All Genres | VJ Paul UG (Senior Paul)`,
    description: seoDescriptions[genre] || `Watch Luo translated ${title} — all genres, all types — translated by VJ Paul UG (Senior Paul). Free streaming on LUOFILM.SITE.`,
    keywords: seoKeywords[genre] || `luo translated ${genre}, vj paul, senior paul, luofilm`,
    url: `/${genre === "movie" ? "movie" : genre}`,
  });

  useEffect(() => {
    const cu = auth.currentUser;
    fbApi.activities.log({
      userId: cu?.uid || null,
      userName: cu?.displayName || null,
      userEmail: cu?.email || null,
      actionType: "page_view",
      page: `/${genre}`,
    }).catch(() => {});
  }, [genre]);

  useEffect(() => {
    fbApi.publicContent.listAll()
      .then((docs) => {
        const all = docs.map(toShow);
        if (genre === "movie") {
          // Movies page: all content with type "movie"
          setShows(all.filter(s => s.type === "movie"));
        } else if (genre === "drama") {
          // Drama page: only series
          setShows(all.filter(s => s.type === "series"));
        } else {
          // Other pages: genre keyword match, but also include series that match
          const matched = all.filter(s =>
            keywords.some(kw =>
              (s.genre || "").toLowerCase().includes(kw) ||
              (s.title || "").toLowerCase().includes(kw)
            )
          );
          setShows(matched);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genre]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
        <div style={{ height: 54 }} />
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: accentColor }} />
            <span style={{ fontSize: 22, fontWeight: 700 }}>{title}</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
            No {title.toLowerCase()} content published yet. The admin can add content from the admin panel.
          </div>
        </div>
      </div>
    );
  }

  const featured = shows[0];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div style={{ height: 54 }} />
      <div className="category-page-pad" style={{ padding: "32px 20px 60px" }}>
        {featured && (
          <div style={{ marginBottom: 40 }}>
            <Link href={`/play/${featured.id}`}>
              <div className="category-featured" style={{ position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer", height: 280, background: "#1a1a1a" }}>
                <img src={featured.coverUrl || featured.thumbnailUrl} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.85) 40%, transparent)" }} />
                <div className="category-featured-inner" style={{ position: "absolute", bottom: 28, left: 28, maxWidth: 480 }}>
                  {featured.badge !== "none" && (
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 700, background: "linear-gradient(90deg,#ffc552,#ffdd9a)", color: "#4e2d03", marginBottom: 8 }}>{featured.badge}</span>
                  )}
                  <h2 className="category-featured-title" style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>{featured.title}</h2>
                  <div className="cat-featured-meta" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    {featured.rating ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={13} fill="#ffc552" color="#ffc552" />
                        <span className="cat-featured-rating" style={{ fontSize: 14, fontWeight: 700, color: "#ffc552" }}>{featured.rating}</span>
                      </div>
                    ) : null}
                    <span className="cat-featured-info" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{featured.year}</span>
                    <span className="cat-featured-info" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{featured.type === "series" ? `${featured.episodeCount} EPS` : "Movie"}</span>
                  </div>
                  <p className="category-featured-desc" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {featured.description}
                  </p>
                  <div className="category-featured-btns" style={{ marginTop: 14, display: "flex", gap: 10 }}>
                    <button style={{ padding: "8px 22px", borderRadius: 20, background: accentColor, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>▶ PLAY NOW</button>
                    <button style={{ padding: "8px 18px", borderRadius: 20, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>DETAILS</button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div className="cat-section-bar" style={{ width: 3, height: 18, borderRadius: 2, background: accentColor }} />
            <span className="cat-section-label" style={{ fontSize: 18, fontWeight: 700 }}>ALL {title}</span>
            <span className="cat-count-label" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>{shows.length} TITLES</span>
          </div>
          <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
            {shows.map((show) => <ShowCard key={show.id} show={show} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
