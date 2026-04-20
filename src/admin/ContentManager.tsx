import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Search, Film, List } from "lucide-react";
import { api } from "./api";

const GENRES = ["Romance","Drama","Action","Thriller","Fantasy","Historical","Comedy","Mystery","Xianxia","Wuxia","Campus","Medical","Period","Modern","Variety","Documentary","Sports","Anime"];
const BADGES = ["none","VIP","Express","New"];

function Btn({ children, onClick, color = "#6366f1", small }: any) {
  return (
    <button onClick={onClick} style={{
      padding: small ? "5px 12px" : "8px 18px",
      background: color, color: "#fff", border: "none", borderRadius: 8,
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6
    }}>{children}</button>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

const inp = {
  width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

function UrlField({ label, urlKey, placeholder, form, setForm }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>{label}</label>
      <input
        style={inp}
        value={form[urlKey] || ""}
        onChange={e => setForm((f: any) => ({ ...f, [urlKey]: e.target.value }))}
        placeholder={placeholder || "https://..."}
      />
      {form[urlKey] && (
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.3)", wordBreak: "break-all" }}>
          {urlKey.includes("thumbnail") || urlKey.includes("cover") || urlKey.includes("Cover") ? (
            <img src={form[urlKey]} alt="" style={{ height: 40, borderRadius: 4, marginTop: 4, objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
          ) : (
            <span style={{ color: "#10b981" }}>✓ URL set</span>
          )}
        </div>
      )}
    </div>
  );
}

function ContentForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    title: "", type: "movie", genre: "Romance", description: "", thumbnailUrl: "", coverUrl: "",
    videoUrl: "", trailerUrl: "", year: new Date().getFullYear(), rating: 8.0, badge: "none",
    duration: 120, status: "published", episodeCount: 0, ...initial
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { alert("Title is required"); return; }
    setSaving(true);
    try {
      if (initial?.id) await api.content.update(initial.id, form);
      else await api.content.create(form);
      onSave();
    } catch (e) { alert(String(e)); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Title</label>
          <input style={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Content title" autoFocus />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Type</label>
          <select style={inp} value={form.type} onChange={e => set("type", e.target.value)}>
            <option value="movie">Movie</option>
            <option value="series">Series</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Genre</label>
          <select style={inp} value={form.genre} onChange={e => set("genre", e.target.value)}>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Year</label>
          <input style={inp} type="number" value={form.year} onChange={e => set("year", Number(e.target.value))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Rating (0–10)</label>
          <input style={inp} type="number" step="0.1" min="0" max="10" value={form.rating} onChange={e => set("rating", Number(e.target.value))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Badge</label>
          <select style={inp} value={form.badge} onChange={e => set("badge", e.target.value)}>
            {BADGES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        {form.type === "movie" ? (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Duration (mins)</label>
            <input style={inp} type="number" value={form.duration} onChange={e => set("duration", Number(e.target.value))} />
          </div>
        ) : (
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>📺</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", marginBottom: 4 }}>Series Episodes</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  After saving this series, click <strong style={{ color: "#a5b4fc" }}>"Manage Episodes"</strong> from the content list to add each episode with its video stream link.
                </div>
              </div>
            </div>
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Status</label>
          <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Description</label>
          <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, marginTop: 4 }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>
          Paste URLs from any CDN, YouTube, Google Drive, or other hosting provider.
        </p>
        <UrlField label="Thumbnail Image URL" urlKey="thumbnailUrl" placeholder="https://cdn.example.com/thumb.jpg" form={form} setForm={setForm} />
        <UrlField label="Cover / Banner Image URL" urlKey="coverUrl" placeholder="https://cdn.example.com/cover.jpg" form={form} setForm={setForm} />
        {form.type === "movie" && (
          <UrlField label="Video URL (MP4, HLS stream, etc.)" urlKey="videoUrl" placeholder="https://cdn.example.com/movie.mp4" form={form} setForm={setForm} />
        )}
        <UrlField label="Trailer Video URL" urlKey="trailerUrl" placeholder="https://cdn.example.com/trailer.mp4" form={form} setForm={setForm} />
      </div>

      {form.type === "movie" && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fb923c" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Download Links by Quality</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
            Add download URLs for each quality. Only qualities with a URL will appear to users on the play page.
          </p>
          {[
            { key: "360p", label: "360p (Low)", placeholder: "https://cdn.example.com/movie-360p.mp4" },
            { key: "480p", label: "480p (Standard)", placeholder: "https://cdn.example.com/movie-480p.mp4" },
            { key: "720p", label: "720p HD", placeholder: "https://cdn.example.com/movie-720p.mp4" },
            { key: "1080p", label: "1080p Full HD", placeholder: "https://cdn.example.com/movie-1080p.mp4" },
          ].map(q => (
            <div key={q.key} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>{q.label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#fb923c22", color: "#fb923c", border: "1px solid #fb923c44", borderRadius: 5, padding: "4px 8px", flexShrink: 0 }}>{q.key}</span>
                <input
                  style={inp}
                  value={form.downloadLinks?.[q.key] || ""}
                  onChange={e => setForm((f: any) => ({ ...f, downloadLinks: { ...(f.downloadLinks || {}), [q.key]: e.target.value } }))}
                  placeholder={q.placeholder}
                />
              </div>
              {form.downloadLinks?.[q.key] && <span style={{ fontSize: 11, color: "#10b981", marginTop: 3, display: "block" }}>✓ URL set</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: "8px 18px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <Btn onClick={save}>{saving ? "Saving..." : (initial?.id ? "Save Changes" : "Add Content")}</Btn>
      </div>
    </div>
  );
}

export default function ContentManager() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modal, setModal] = useState<null | "create" | any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.content.list({ search, type: typeFilter }).then(d => setContent(d.content || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, typeFilter]);

  const del = async (id: string) => {
    if (!confirm("Delete this content? This will also remove all its episodes.")) return;
    setDeleting(id);
    await api.content.delete(id).catch(console.error);
    setDeleting(null);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Content Management</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Add movies and series using URLs — no file uploads required.</p>
        </div>
        <Btn onClick={() => setModal("create")}><Plus size={15} /> Add Content</Btn>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input style={{ ...inp, paddingLeft: 36 }} placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inp, width: 140 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
      </div>

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Thumbnail","Title","Type","Genre","Year","Rating","Badge","Status","Views","Actions"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
            ) : content.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>No content yet. Add your first movie or series!</td></tr>
            ) : content.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 14px" }}>
                  {c.thumbnailUrl
                    ? <img src={c.thumbnailUrl} alt="" style={{ width: 44, height: 58, objectFit: "cover", borderRadius: 4 }} />
                    : <div style={{ width: 44, height: 58, borderRadius: 4, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}><Film size={18} color="#444" /></div>}
                </td>
                <td style={{ padding: "10px 14px", color: "#fff", fontWeight: 500, maxWidth: 200 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.type === "movie" ? "#3b82f622" : "#8b5cf622", color: c.type === "movie" ? "#60a5fa" : "#a78bfa" }}>
                    {c.type === "movie" ? "Movie" : "Series"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>{c.genre}</td>
                <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>{c.year}</td>
                <td style={{ padding: "10px 14px", color: "#f59e0b", fontWeight: 600 }}>⭐ {c.rating}</td>
                <td style={{ padding: "10px 14px" }}>
                  {c.badge && c.badge !== "none" && (
                    <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: c.badge === "VIP" ? "#f59e0b33" : "#3b82f633", color: c.badge === "VIP" ? "#fbbf24" : "#60a5fa" }}>{c.badge}</span>
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: c.status === "published" ? "#10b98122" : "#ef444422", color: c.status === "published" ? "#34d399" : "#f87171" }}>{c.status}</span>
                </td>
                <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>{c.views || 0}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setModal(c)} style={{ padding: "5px 8px", background: "#6366f122", border: "none", borderRadius: 6, color: "#818cf8", cursor: "pointer" }}><Edit size={13} /></button>
                      <button onClick={() => del(c.id)} disabled={deleting === c.id} style={{ padding: "5px 8px", background: "#ef444422", border: "none", borderRadius: 6, color: "#f87171", cursor: "pointer" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {c.type === "series" && (
                      <Link href={`/admin/content/${c.id}/episodes`}>
                        <button style={{ padding: "5px 10px", background: "#10b981", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                          <List size={11} /> Manage Episodes
                        </button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "create" ? "Add New Content" : `Edit: ${modal.title}`} onClose={() => setModal(null)}>
          <ContentForm initial={modal === "create" ? null : modal} onSave={() => { setModal(null); load(); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
