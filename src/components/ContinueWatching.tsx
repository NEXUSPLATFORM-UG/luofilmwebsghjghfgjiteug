import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Play, X, Clock } from "lucide-react";

export interface WatchProgress {
  id: string;
  title: string;
  thumbnailUrl: string;
  type: string;
  genre: string;
  percent: number;
  currentTime: number;
  duration: number;
  episode?: number;
  lastWatched: number;
}

const STORAGE_KEY = "lf_watch_progress";
const MAX_ITEMS = 20;

export function saveWatchProgress(
  id: string,
  info: { title: string; thumbnailUrl: string; type: string; genre: string; episode?: number },
  currentTime: number,
  duration: number,
  percent: number
) {
  try {
    const existing = getAllProgress();
    const filtered = existing.filter((p) => p.id !== id);
    const entry: WatchProgress = {
      id,
      title: info.title,
      thumbnailUrl: info.thumbnailUrl,
      type: info.type,
      genre: info.genre,
      episode: info.episode,
      percent: Math.min(99, percent),
      currentTime,
      duration,
      lastWatched: Date.now(),
    };
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeWatchProgress(id: string) {
  try {
    const updated = getAllProgress().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getAllProgress(): WatchProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ContinueWatching() {
  const [items, setItems] = useState<WatchProgress[]>([]);

  useEffect(() => {
    const load = () => {
      const all = getAllProgress().filter((p) => p.percent > 2 && p.percent < 98);
      setItems(all.slice(0, 10));
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("lf_progress_updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("lf_progress_updated", load);
    };
  }, []);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeWatchProgress(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  if (items.length === 0) return null;

  return (
    <div style={{ padding: "0 12px 4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          paddingTop: 8,
        }}
      >
        <Clock size={15} color="#00a9f5" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Continue Watching
        </span>
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.07)",
            padding: "2px 7px",
            borderRadius: 20,
            fontWeight: 600,
          }}
        >
          {items.length}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 6,
          scrollbarWidth: "none",
        }}
        className="hide-scrollbar"
      >
        {items.map((item) => (
          <Link key={item.id} href={`/play/${item.id}`}>
            <div
              style={{
                position: "relative",
                flexShrink: 0,
                width: 150,
                cursor: "pointer",
                borderRadius: 8,
                overflow: "hidden",
                background: "#1a1a22",
                border: "1px solid rgba(255,255,255,0.07)",
                transition: "transform 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,169,245,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              <div style={{ position: "relative", paddingTop: "56.25%", background: "#111" }}>
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.75) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "rgba(0,169,245,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 12px rgba(0,169,245,0.5)",
                  }}
                >
                  <Play size={14} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />
                </div>
                {item.episode && (
                  <div
                    style={{
                      position: "absolute",
                      top: 5,
                      left: 5,
                      background: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    EP {item.episode}
                  </div>
                )}
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 38,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${item.percent}%`,
                    background: "linear-gradient(90deg, #00a9f5, #0070c0)",
                    borderRadius: 2,
                    transition: "width 0.3s",
                  }}
                />
              </div>

              <div style={{ padding: "6px 8px 7px" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: "15px",
                  }}
                  title={item.title}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 3,
                  }}
                >
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                    {item.percent}%{item.duration ? ` · ${formatDuration(item.duration)}` : ""}
                  </span>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                    {timeAgo(item.lastWatched)}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => handleRemove(e, item.id)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.65)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
                title="Remove from Continue Watching"
              >
                <X size={10} />
              </button>
            </div>
          </Link>
        ))}
      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
