import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit, Image, Lock, Upload, X, CheckCircle, AlertCircle, GripVertical } from "lucide-react";
import { api } from "./api";
import { storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const FEATURED_HOME_MAX = 6;

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px",
  color: "#fff", fontSize: 13, outline: "none"
};

const LEFT_PAGES = ["home", "drama", "movie", "variety", "sports", "documentary", "anime"];

function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB."); return; }
    setError("");
    setUploading(true);
    setProgress(0);
    const path = `carousel/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    task.on("state_changed",
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { setError("Upload failed: " + err.message); setUploading(false); },
      () => {
        getDownloadURL(task.snapshot.ref).then((url) => {
          onChange(url);
          setUploading(false);
          setProgress(100);
        });
      }
    );
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>
        Slide Image <span style={{ color: "#f87171" }}>*</span>
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          style={{ ...inp, flex: 1 }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste image URL or upload a file →"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ padding: "8px 14px", background: uploading ? "#374151" : "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap" }}
        >
          <Upload size={14} />
          {uploading ? `${progress}%` : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
      {error && <p style={{ fontSize: 11, color: "#f87171", margin: "4px 0 0" }}>{error}</p>}
      {uploading && (
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#6366f1", borderRadius: 2, transition: "width 0.2s" }} />
        </div>
      )}
      {value && !uploading && (
        <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
          <img src={value} alt="Preview" onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
            style={{ height: 72, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", display: "block", objectFit: "cover" }} />
          <button onClick={() => onChange("")} style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
            <X size={10} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18, width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Alert({ type, children }: { type: "info" | "warn"; children: React.ReactNode }) {
  const colors = type === "warn"
    ? { bg: "rgba(245,158,11,0.08)", border: "#f59e0b44", text: "#fbbf24", Icon: AlertCircle }
    : { bg: "rgba(99,102,241,0.08)", border: "#6366f144", text: "#818cf8", Icon: CheckCircle };
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, marginBottom: 16 }}>
      <colors.Icon size={14} color={colors.text} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function CarouselForm({ initial, onSave, onClose, contentList, pageOptions, defaultPage, sectionLabel }: any) {
  const [form, setForm] = useState({
    contentId: "", page: defaultPage || "home", sortOrder: 0, isActive: true,
    customTitle: "", customDescription: "", customImageUrl: "", ...initial
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setErr("");
    if (!form.contentId && !form.customImageUrl) {
      setErr("Either link to existing content OR upload/paste a slide image URL."); return;
    }
    if (!form.contentId && !form.customTitle) {
      setErr("A title is required when using a custom image (no content linked)."); return;
    }
    setSaving(true);
    try {
      const data = { ...form, contentId: form.contentId || null };
      if (initial?.id) await api.carousel.update(initial.id, data);
      else await api.carousel.create(data);
      onSave();
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
    setSaving(false);
  };

  return (
    <div>
      <Alert type="info">
        {sectionLabel === "main" && "These slides appear in the main big hero on the left side of the homepage."}
        {sectionLabel === "right" && "These slides appear in the right secondary hero carousel on the homepage."}
        To add a slide: either <strong>link to existing content</strong> below, or <strong>upload/paste a custom image</strong> and fill in a title.
      </Alert>

      {err && (
        <div style={{ padding: "10px 14px", background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, color: "#f87171", fontSize: 12, marginBottom: 14 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Link to Content (optional)</label>
          <select style={inp} value={form.contentId} onChange={e => set("contentId", e.target.value)}>
            <option value="">— None / Custom Slide —</option>
            {contentList.map((c: any) => <option key={c.id} value={c.id}>{c.title} ({c.type})</option>)}
          </select>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>Link to a movie/series from your content library</p>
        </div>

        {pageOptions && pageOptions.length > 1 && (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Page</label>
            <select style={inp} value={form.page} onChange={e => set("page", e.target.value)}>
              {pageOptions.map((p: string) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Sort Order</label>
          <input style={inp} type="number" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 22 }}>
          <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} id="isActive" style={{ width: 16, height: 16, cursor: "pointer" }} />
          <label htmlFor="isActive" style={{ fontSize: 13, color: "#fff", cursor: "pointer" }}>Active (visible on site)</label>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>
            Title {!form.contentId && <span style={{ color: "#f87171" }}>*</span>}
            {form.contentId && <span style={{ color: "rgba(255,255,255,0.3)" }}> (overrides content title)</span>}
          </label>
          <input style={inp} value={form.customTitle} onChange={e => set("customTitle", e.target.value)} placeholder="Slide title..." />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Description (optional)</label>
          <textarea style={{ ...inp, minHeight: 60, resize: "vertical" as const }} value={form.customDescription} onChange={e => set("customDescription", e.target.value)} />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <ImageUploader value={form.customImageUrl} onChange={v => set("customImageUrl", v)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: "8px 18px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: "8px 20px", background: saving ? "#374151" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : (initial?.id ? "Update Slide" : "Add Slide")}
        </button>
      </div>
    </div>
  );
}

function FeaturedForm({ initial, onSave, onClose, contentList }: any) {
  const [form, setForm] = useState({ contentId: "", page: "home", isActive: true, order: 0, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.contentId) { setErr("Please select content."); return; }
    setErr("");
    setSaving(true);
    try {
      const data = { ...form };
      if (initial?.id) await api.featured.update(initial.id, data);
      else await api.featured.create(data);
      onSave();
    } catch (e: any) { setErr(String(e?.message || e)); }
    setSaving(false);
  };

  return (
    <div>
      <Alert type="info">Featured items appear as cards in the middle panel between the two hero slides.</Alert>
      {err && <div style={{ padding: "10px 14px", background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, color: "#f87171", fontSize: 12, marginBottom: 14 }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Select Content <span style={{ color: "#f87171" }}>*</span></label>
          <select style={inp} value={form.contentId} onChange={e => set("contentId", e.target.value)}>
            <option value="">— Choose a movie or series —</option>
            {contentList.map((c: any) => <option key={c.id} value={c.id}>{c.title} ({c.type})</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 600 }}>Position / Order</label>
          <input style={inp} type="number" min={0} value={form.order} onChange={e => set("order", Number(e.target.value))} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 22 }}>
          <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} id="fIsActive" style={{ width: 16, height: 16, cursor: "pointer" }} />
          <label htmlFor="fIsActive" style={{ fontSize: 13, color: "#fff", cursor: "pointer" }}>Active (visible on site)</label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: "8px 18px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: "8px 20px", background: saving ? "#374151" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : (initial?.id ? "Update" : "Add to Middle Panel")}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: active ? "#10b98122" : "#ef444422", color: active ? "#34d399" : "#f87171", border: `1px solid ${active ? "#10b98133" : "#ef444433"}` }}>
      {active ? "Active" : "Hidden"}
    </span>
  );
}

function CarouselTable({ items, onEdit, onDelete, onToggle, contentList }: {
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  contentList?: any[];
}) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: "center" as const, color: "rgba(255,255,255,0.25)" }}>
        <Image size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.2 }} />
        <div style={{ fontSize: 14, marginBottom: 6 }}>No slides yet</div>
        <div style={{ fontSize: 12 }}>Click "Add Item" to create your first slide</div>
      </div>
    );
  }

  return (
    <div>
      {items.map((c, idx) => {
        const linkedContent = contentList?.find((x: any) => x.id === c.contentId);
        const imgSrc = c.customImageUrl || linkedContent?.thumbnailUrl || linkedContent?.coverUrl || "";
        const title = c.customTitle || linkedContent?.title || "(Untitled)";
        const hasImage = !!imgSrc;

        return (
          <div key={c.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
            <div style={{ flexShrink: 0, color: "rgba(255,255,255,0.2)", cursor: "grab" }}>
              <GripVertical size={16} />
            </div>
            <div style={{ flexShrink: 0, width: 90, height: 52, borderRadius: 6, overflow: "hidden", background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {hasImage
                ? <img src={imgSrc} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                : <Image size={18} color="#333" />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, color: "#818cf8", background: "#6366f115", padding: "1px 7px", borderRadius: 4 }}>Order: {c.sortOrder ?? 0}</span>
                {c.page && c.page !== "home" && <span style={{ fontSize: 11, color: "#f59e0b", background: "#f59e0b15", padding: "1px 7px", borderRadius: 4 }}>Page: {c.page}</span>}
                {c.contentId && <span style={{ fontSize: 11, color: "#10b981", background: "#10b98115", padding: "1px 7px", borderRadius: 4 }}>Linked content</span>}
                {c.customImageUrl && <span style={{ fontSize: 11, color: "#00c9fd", background: "#00c9fd15", padding: "1px 7px", borderRadius: 4 }}>Custom image</span>}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <StatusBadge active={c.isActive !== false} />
              <button
                onClick={() => onToggle(c.id, !(c.isActive !== false))}
                style={{ padding: "4px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" as const }}
              >
                {c.isActive !== false ? "Hide" : "Show"}
              </button>
              <button onClick={() => onEdit(c)} style={{ padding: "5px 10px", background: "#6366f122", border: "1px solid #6366f133", borderRadius: 6, color: "#818cf8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
              <button onClick={() => onDelete(c.id)} style={{ padding: "5px 10px", background: "#ef444422", border: "1px solid #ef444433", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CarouselManager() {
  const [tab, setTab] = useState<"left" | "right" | "featured">("left");
  const [carousel, setCarousel] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "create" | any>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.carousel.list(), api.featured.list(), api.featured.contentList()])
      .then(([c, f, cl]) => {
        setCarousel(c.carousel || []);
        setFeatured(f.featured || []);
        setContentList(cl.content || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const leftSlides = carousel.filter((c: any) => c.page !== "carousel2").sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const rightSlides = carousel.filter((c: any) => c.page === "carousel2").sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const homeFeatured = featured.filter((f: any) => f.page === "home").sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const homeFeaturedFull = homeFeatured.length >= FEATURED_HOME_MAX;

  const delCarousel = async (id: string) => {
    if (!confirm("Remove this carousel slide?")) return;
    await api.carousel.delete(id);
    load();
  };

  const toggleCarousel = async (id: string, active: boolean) => {
    await api.carousel.update(id, { isActive: active });
    load();
  };

  const delFeatured = async (id: string) => {
    if (!confirm("Remove this featured item?")) return;
    await api.featured.delete(id);
    load();
  };

  const toggleFeatured = async (id: string, active: boolean) => {
    await api.featured.update(id, { isActive: active });
    load();
  };

  const isCreating = modal === "create";
  const isEditing = modal && modal !== "create";

  const currentItems = tab === "left" ? leftSlides : tab === "right" ? rightSlides : homeFeatured;

  const sectionLabel = tab === "left" ? "main" : tab === "right" ? "right" : "featured";

  const getModalTitle = () => {
    if (tab === "left") return isCreating ? "Add Main Hero Slide" : "Edit Main Hero Slide";
    if (tab === "right") return isCreating ? "Add Right Carousel Slide" : "Edit Right Carousel Slide";
    return isCreating ? "Add Featured Item" : "Edit Featured Item";
  };

  const TABS = [
    { key: "left" as const, label: "Main Hero (Left)", count: leftSlides.length },
    { key: "right" as const, label: "Right Carousel", count: rightSlides.length },
    { key: "featured" as const, label: "Featured (Middle)", count: homeFeatured.length },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Carousel & Featured</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Manage homepage hero slides, right carousel, and middle featured panel
          </p>
        </div>
        {tab === "featured" && homeFeaturedFull ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#78350f22", border: "1px solid #f59e0b44", borderRadius: 8 }}>
            <Lock size={14} color="#f59e0b" />
            <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>All {FEATURED_HOME_MAX} slots filled</span>
          </div>
        ) : (
          <button
            onClick={() => setModal("create")}
            style={{ padding: "9px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={15} /> Add Item
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 24, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "9px 22px", background: tab === t.key ? "#6366f1" : "transparent", color: tab === t.key ? "#fff" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
            {tab === t.key ? "🔵" : "⚪"} {t.label}
            <span style={{ padding: "1px 7px", background: tab === t.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab !== "featured" && (
        <Alert type="info">
          {tab === "left" && <>Slides here appear in the <strong>main big left hero</strong> on the homepage. If none are configured, the hero will auto-fill with your published movies.</>}
          {tab === "right" && <>Slides here appear in the <strong>right secondary carousel</strong> on the homepage.</>}
        </Alert>
      )}

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" as const, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading...</div>
        ) : tab === "featured" ? (
          <>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                Middle panel slots:
                <span style={{ marginLeft: 8, fontWeight: 700, color: homeFeaturedFull ? "#f59e0b" : "#34d399" }}>
                  {homeFeatured.length} / {FEATURED_HOME_MAX}
                </span>
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                Slots 1–2 → large cards · Slots 3–6 → small cards
              </span>
            </div>
            {homeFeatured.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" as const, color: "rgba(255,255,255,0.25)" }}>
                <Image size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.2 }} />
                <div style={{ fontSize: 14, marginBottom: 6 }}>No featured items yet</div>
                <div style={{ fontSize: 12 }}>Click "Add Item" to pin content to the middle panel</div>
              </div>
            ) : (
              <div>
                {homeFeatured.map((f, idx) => {
                  const content = contentList.find((c: any) => c.id === f.contentId);
                  return (
                    <div key={f.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                      <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, background: idx < 2 ? "#6366f122" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: idx < 2 ? "#818cf8" : "rgba(255,255,255,0.35)" }}>
                        {idx + 1}
                      </div>
                      <div style={{ flexShrink: 0, width: 80, height: 48, borderRadius: 6, overflow: "hidden", background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {content?.thumbnailUrl || content?.coverUrl
                          ? <img src={content.thumbnailUrl || content.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Image size={14} color="#333" /></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{content?.title || `ID: ${(f.contentId || "").slice(0, 10)}…`}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: idx < 2 ? "#818cf8" : "rgba(255,255,255,0.35)", background: idx < 2 ? "#6366f115" : "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 4 }}>
                            {idx < 2 ? "LARGE CARD" : "SMALL CARD"}
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "1px 7px" }}>{content?.type || ""}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
                        <StatusBadge active={f.isActive !== false} />
                        <button onClick={() => toggleFeatured(f.id, !(f.isActive !== false))} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer" }}>
                          {f.isActive !== false ? "Hide" : "Show"}
                        </button>
                        <button onClick={() => setModal({ ...f, _tab: "featured" })} style={{ padding: "5px 10px", background: "#6366f122", border: "1px solid #6366f133", borderRadius: 6, color: "#818cf8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                        <button onClick={() => delFeatured(f.id)} style={{ padding: "5px 10px", background: "#ef444422", border: "1px solid #ef444433", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: 12 }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <CarouselTable
            items={currentItems}
            contentList={contentList}
            onEdit={item => setModal({ ...item, _tab: tab })}
            onDelete={delCarousel}
            onToggle={toggleCarousel}
          />
        )}
      </div>

      {modal && (
        <Modal title={getModalTitle()} onClose={() => setModal(null)}>
          {tab === "featured" || (isEditing && modal._tab === "featured") ? (
            <FeaturedForm
              initial={isEditing ? modal : { page: "home" }}
              contentList={contentList}
              onSave={() => { setModal(null); load(); }}
              onClose={() => setModal(null)}
            />
          ) : (
            <CarouselForm
              initial={isEditing ? modal : null}
              contentList={contentList}
              pageOptions={tab === "right" || (isEditing && modal._tab === "right") ? ["carousel2"] : LEFT_PAGES}
              defaultPage={tab === "right" || (isEditing && modal._tab === "right") ? "carousel2" : "home"}
              sectionLabel={sectionLabel}
              onSave={() => { setModal(null); load(); }}
              onClose={() => setModal(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
