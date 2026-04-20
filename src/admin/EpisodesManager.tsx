import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { api } from "./api";

const inp = {
  width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: 580, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function EpisodeForm({ seriesId, initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    seasonNumber: 1, episodeNumber: 1, title: "", description: "",
    videoUrl: "", thumbnailUrl: "", duration: 45, ...initial
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (initial?.id) await api.content.episodes.update(seriesId, initial.id, form);
      else await api.content.episodes.create(seriesId, form);
      onSave();
    } catch (e) { alert(String(e)); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Season #</label>
          <input style={inp} type="number" min="1" value={form.seasonNumber} onChange={e => set("seasonNumber", Number(e.target.value))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Episode #</label>
          <input style={inp} type="number" min="1" value={form.episodeNumber} onChange={e => set("episodeNumber", Number(e.target.value))} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Episode Title</label>
          <input style={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Episode title" autoFocus />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Description</label>
          <textarea style={{ ...inp, minHeight: 56, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Duration (mins)</label>
          <input style={inp} type="number" value={form.duration} onChange={e => set("duration", Number(e.target.value))} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, marginTop: 14 }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
          Paste URLs from any CDN, Google Drive, or video hosting provider.
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Video URL (Streaming)</label>
          <input style={inp} value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://cdn.example.com/episode.mp4" />
          {form.videoUrl && <span style={{ fontSize: 11, color: "#10b981", marginTop: 4, display: "block" }}>✓ URL set</span>}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Thumbnail Image URL</label>
          <input style={inp} value={form.thumbnailUrl} onChange={e => set("thumbnailUrl", e.target.value)} placeholder="https://cdn.example.com/thumb.jpg" />
          {form.thumbnailUrl && (
            <img src={form.thumbnailUrl} alt="" style={{ height: 38, borderRadius: 4, marginTop: 6, objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fb923c" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Download Links by Quality</span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
          Add a download URL for each quality. Only qualities with a URL will show to users.
        </p>
        {[
          { key: "360p", label: "360p (Low)" },
          { key: "480p", label: "480p (Standard)" },
          { key: "720p", label: "720p HD" },
          { key: "1080p", label: "1080p Full HD" },
        ].map(q => (
          <div key={q.key} style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontWeight: 600 }}>{q.label}</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#fb923c22", color: "#fb923c", border: "1px solid #fb923c44", borderRadius: 5, padding: "4px 8px", flexShrink: 0 }}>{q.key}</span>
              <input
                style={inp}
                value={form.downloadLinks?.[q.key] || ""}
                onChange={e => setForm((f: any) => ({ ...f, downloadLinks: { ...(f.downloadLinks || {}), [q.key]: e.target.value } }))}
                placeholder={`https://cdn.example.com/ep-${q.key}.mp4`}
              />
            </div>
            {form.downloadLinks?.[q.key] && <span style={{ fontSize: 11, color: "#10b981", marginTop: 3, display: "block" }}>✓ URL set</span>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: "8px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <button onClick={save} style={{ padding: "8px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Saving..." : (initial?.id ? "Update Episode" : "Add Episode")}
        </button>
      </div>
    </div>
  );
}

export default function EpisodesManager() {
  const { id } = useParams<{ id: string }>();
  const seriesId = id || "";
  const [seriesInfo, setSeriesInfo] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.content.get(seriesId),
      api.content.episodes.list(seriesId)
    ]).then(([d, eps]) => {
      const episodeList = eps.episodes || [];
      setSeriesInfo(d.content);
      setEpisodes(episodeList);
      if ((d.content?.episodeCount ?? 0) !== episodeList.length) {
        api.content.update(seriesId, { episodeCount: episodeList.length }).catch(() => {});
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [seriesId]);

  const del = async (epId: string) => {
    if (!confirm("Delete this episode?")) return;
    await api.content.episodes.delete(seriesId, epId);
    load();
  };

  const grouped: Record<number, any[]> = {};
  episodes.forEach(ep => {
    const season = ep.seasonNumber || 1;
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(ep);
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/admin/content">
          <button style={{ padding: "7px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} /> Back
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Episodes: {seriesInfo?.title || "..."}</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{episodes.length} episodes — paste video URLs to add content</p>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setModal("create")} style={{ padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={15} /> Add Episode
        </button>
      </div>

      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📺</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No episodes yet</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Click "Add Episode" above to add each episode with its video stream link.</div>
          <button onClick={() => setModal("create")} style={{ padding: "10px 24px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            + Add First Episode
          </button>
        </div>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([season, eps]) => (
          <div key={season} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, color: "#818cf8", fontWeight: 600, marginBottom: 12 }}>Season {season}</h3>
            <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Ep#","Thumbnail","Title","Duration","Video","Views","Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(eps as any[]).sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0)).map((ep: any) => (
                    <tr key={ep.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 14px", color: "#818cf8", fontWeight: 700 }}>E{ep.episodeNumber}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {ep.thumbnailUrl
                          ? <img src={ep.thumbnailUrl} alt="" style={{ width: 60, height: 38, objectFit: "cover", borderRadius: 4 }} />
                          : <div style={{ width: 60, height: 38, borderRadius: 4, background: "#1a1a2e" }} />}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#fff", maxWidth: 240 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.title || `Episode ${ep.episodeNumber}`}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>{ep.duration ? `${ep.duration}m` : "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {ep.videoUrl
                          ? <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 11, background: "#10b98122", color: "#34d399" }}>✓ URL set</span>
                          : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>No URL</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>{ep.views || 0}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setModal(ep)} style={{ padding: "4px 8px", background: "#6366f122", border: "none", borderRadius: 6, color: "#818cf8", cursor: "pointer" }}><Edit size={13} /></button>
                          <button onClick={() => del(ep.id)} style={{ padding: "4px 8px", background: "#ef444422", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer" }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {modal && (
        <Modal title={modal === "create" ? "Add New Episode" : `Edit Episode ${modal.episodeNumber}`} onClose={() => setModal(null)}>
          <EpisodeForm seriesId={seriesId} initial={modal === "create" ? null : modal} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
