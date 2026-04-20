import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { fbApi } from "../lib/firebaseApi";

interface Show {
  id: string;
  title: string;
  type: string;
  episodeCount?: number;
  badge?: string;
  genre?: string;
  year?: number;
  rating?: number;
  coverUrl?: string;
  thumbnailUrl?: string;
}

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
    coverUrl: d.coverUrl || d.thumbnailUrl || "",
    thumbnailUrl: d.thumbnailUrl || d.coverUrl || "",
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
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, backgroundImage: "linear-gradient(180deg, transparent, rgba(0,0,0,0.55))" }} />
          {show.badge && show.badge !== "none" && (
            <span style={{
              position: "absolute", top: 0, right: 0, height: 18, lineHeight: "18px", padding: "0 6px",
              borderRadius: "0 6px 0 6px", fontSize: 11, fontWeight: 700,
              background: show.badge === "VIP" ? "linear-gradient(45deg,#ffc552,#ffdd9a)" : show.badge === "Express" ? "linear-gradient(45deg,#00a3f5,#00c9fd)" : "linear-gradient(45deg,#8819ff,#ad61ff)",
              color: show.badge === "VIP" ? "#4e2d03" : "#fff",
            }}>{show.badge}</span>
          )}
        </div>
        <div style={{ paddingTop: 7, paddingBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: hovered ? "#00a9f5" : "rgba(255,255,255,0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "20px", transition: "color 0.2s" }} title={show.title}>
            {show.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            {show.rating ? (
              <>
                <Star size={10} fill="#ffc552" color="#ffc552" />
                <span style={{ fontSize: 11, color: "#ffc552", fontWeight: 600 }}>{show.rating}</span>
              </>
            ) : null}
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {show.type === "series" ? `${show.episodeCount} EPS` : "MOVIE"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const query = new URLSearchParams(window.location.search).get("q") || "";
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) { setLoading(false); return; }
    setLoading(true);
    fbApi.publicContent.listAll()
      .then((docs) => {
        const q = query.toLowerCase();
        const filtered = docs
          .map(toShow)
          .filter(s =>
            s.title.toLowerCase().includes(q) ||
            (s.genre || "").toLowerCase().includes(q)
          );
        setShows(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div style={{ height: 54 }} />
      <div className="category-page-pad" style={{ padding: "32px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: "#00a9f5" }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {query ? `Results for "${query}"` : "Search"}
          </span>
          {!loading && query && (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>
              {shows.length} title{shows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, paddingTop: 40 }}>Searching...</div>
        ) : !query.trim() ? (
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, paddingTop: 40 }}>Type something to search for shows and movies.</div>
        ) : shows.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, paddingTop: 40 }}>
            No results found for <strong style={{ color: "rgba(255,255,255,0.6)" }}>"{query}"</strong>. Try a different keyword.
          </div>
        ) : (
          <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
            {shows.map(show => <ShowCard key={show.id} show={show} />)}
          </div>
        )}
      </div>
    </div>
  );
}
