import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Clock, Play, Trash2, Film, Tv } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fbApi } from "../lib/firebaseApi";

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-UG", { day: "numeric", month: "short" });
}

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = d.toLocaleDateString("en-UG", { weekday: "long", day: "numeric", month: "long" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups);
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fbApi.userActions.getHistory(user.uid)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const grouped = groupByDate(history);

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div style={{ height: 54 }} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: "#00a9f5" }} />
            <span style={{ fontSize: 18, fontWeight: 700 }}>Watch History</span>
            {history.length > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>{history.length} items</span>
            )}
          </div>
        </div>

        {!user ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Clock size={48} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Log in to see your watch history.</p>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 72, borderRadius: 10, background: "#1a1a1a", animation: "pulse 1.2s ease-in-out infinite" }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Clock size={52} color="rgba(255,255,255,0.08)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 8 }}>No watch history yet.</p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Start watching to build your history.</p>
            <Link href="/">
              <button style={{ marginTop: 20, padding: "10px 24px", borderRadius: 20, background: "#00a9f5", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Browse Content
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  {date}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {items.map((item, i) => (
                    <Link key={i} href={item.contentId ? `/play/${item.contentId}` : "#"}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: "#1a1a1a", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.contentTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Play size={18} color="rgba(255,255,255,0.2)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.contentTitle || "Unknown Title"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            {item.contentType === "movie" ? <Film size={10} color="rgba(255,255,255,0.3)" /> : <Tv size={10} color="rgba(255,255,255,0.3)" />}
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                              {item.contentType === "movie" ? "Movie" : "Series"} · {timeAgo(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Play size={14} color="rgba(255,255,255,0.2)" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
