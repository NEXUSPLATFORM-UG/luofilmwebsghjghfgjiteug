import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bookmark, Star, Play, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fbApi } from "../lib/firebaseApi";

export default function WatchlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fbApi.userActions.getWatchlist(user.uid)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleRemove(item: any) {
    if (!user || removing) return;
    setRemoving(item.contentId);
    try {
      await fbApi.userActions.toggleSave(item.contentId, user.uid);
      setItems(prev => prev.filter(i => i.contentId !== item.contentId));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div style={{ height: 54 }} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px 80px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: "#e05a7a" }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>My Watchlist</span>
          {items.length > 0 && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>{items.length} saved</span>
          )}
        </div>

        {!user ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Bookmark size={48} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Log in to see your saved shows.</p>
          </div>
        ) : loading ? (
          <div className="watchlist-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ paddingTop: "133%", borderRadius: 8, background: "#1a1a1a", animation: "pulse 1.2s ease-in-out infinite" }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Bookmark size={52} color="rgba(255,255,255,0.08)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 8 }}>Your watchlist is empty.</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Save shows and movies to watch later.</p>
            <Link href="/">
              <button style={{ marginTop: 20, padding: "10px 24px", borderRadius: 20, background: "#e05a7a", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Browse Content
              </button>
            </Link>
          </div>
        ) : (
          <div className="watchlist-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
            {items.map((item) => (
              <div key={item.contentId} style={{ position: "relative" }}>
                <Link href={`/play/${item.contentId}`}>
                  <div style={{ cursor: "pointer" }}>
                    <div style={{ position: "relative", paddingTop: "133.33%", borderRadius: 8, overflow: "hidden", background: "#1a1a1a" }}>
                      {item.thumbnailUrl || item.coverUrl ? (
                        <img src={item.thumbnailUrl || item.coverUrl} alt={item.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={28} color="rgba(255,255,255,0.15)" />
                        </div>
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
                      {item.badge && item.badge !== "none" && (
                        <span style={{
                          position: "absolute", top: 0, right: 0, height: 18, lineHeight: "18px", padding: "0 6px",
                          borderRadius: "0 8px 0 6px", fontSize: 10, fontWeight: 700,
                          background: item.badge === "VIP" ? "linear-gradient(45deg,#ffc552,#ffdd9a)" : "linear-gradient(45deg,#00a3f5,#00c9fd)",
                          color: item.badge === "VIP" ? "#4e2d03" : "#fff",
                        }}>{item.badge}</span>
                      )}
                    </div>
                    <div style={{ paddingTop: 7 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title || "Untitled"}
                      </div>
                      {item.rating ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                          <Star size={10} fill="#ffc552" color="#ffc552" />
                          <span style={{ fontSize: 10, color: "#ffc552" }}>{item.rating}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(item)}
                  disabled={removing === item.contentId}
                  title="Remove from watchlist"
                  style={{
                    position: "absolute", top: 6, left: 6, width: 26, height: 26, borderRadius: 6,
                    background: "rgba(0,0,0,0.65)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: removing === item.contentId ? 0.5 : 1,
                  }}>
                  <Trash2 size={12} color="#ff6b6b" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
