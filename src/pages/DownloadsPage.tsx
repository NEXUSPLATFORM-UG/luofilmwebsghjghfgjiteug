import { Link } from "wouter";
import { Download, Smartphone, Wifi, HardDrive, CheckCircle } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div style={{ height: 54 }} />
      <div style={{ maxWidth: 580, margin: "0 auto", padding: "48px 16px 80px", textAlign: "center" }}>

        {/* Icon */}
        <div style={{ width: 88, height: 88, borderRadius: 24, background: "linear-gradient(135deg,rgba(0,169,245,0.15),rgba(0,169,245,0.05))", border: "1px solid rgba(0,169,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
          <Download size={38} color="#00a9f5" />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Download & Watch Offline</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 36, maxWidth: 420, margin: "0 auto 36px" }}>
          Downloading content is available on the <strong style={{ color: "rgba(255,255,255,0.7)" }}>LUO FILM mobile app</strong>. Download the app to save your favourite shows and movies for offline viewing.
        </p>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 36, textAlign: "left" }}>
          {[
            { icon: <Wifi size={16} color="#00a9f5" />, title: "Watch Offline", desc: "No internet needed after download" },
            { icon: <HardDrive size={16} color="#4ade80" />, title: "Up to 5 Videos", desc: "Download 5 videos at once with VIP" },
            { icon: <Smartphone size={16} color="#f5a623" />, title: "Mobile Ready", desc: "Available on Android & iOS" },
            { icon: <CheckCircle size={16} color="#e05a7a" />, title: "HD Quality", desc: "Download in up to 1080P" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "#141414", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="download-app-button"
          aria-label="Download the LUO FILM app"
        >
          <span className="download-app-button-glow" />
          <span className="download-app-button-shine" />
          <span className="download-app-button-icon">
            <Smartphone size={19} />
          </span>
          <span className="download-app-button-copy">
            <span className="download-app-button-title">Download the App</span>
            <span className="download-app-button-subtitle">Android & iOS ready</span>
          </span>
          <Download className="download-app-button-arrow" size={18} />
        </a>

        <div>
          <Link href="/">
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", cursor: "pointer", textDecoration: "underline" }}>
              Continue watching online
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
