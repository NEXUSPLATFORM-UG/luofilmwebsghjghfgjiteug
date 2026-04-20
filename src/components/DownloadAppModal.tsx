import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

const DEFAULT_LINK = "https://pub-4810ad32eae44d3db8b886164bf3650f.r2.dev/luofilm.apk";

interface Props {
  onClose: () => void;
}

export default function DownloadAppModal({ onClose }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerLink, setBannerLink] = useState(DEFAULT_LINK);

  useEffect(() => {
    getDoc(doc(db, "settings", "main")).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.floatBannerUrl) setBannerUrl(d.floatBannerUrl);
        if (d.floatBannerLink) setBannerLink(d.floatBannerLink);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Blurred backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 8999,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          animation: "dlBgIn 0.25s ease",
        }}
      />

      {/* Floating card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9000,
          width: "min(580px, 94vw)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 8px 28px rgba(0,0,0,0.55)",
          animation: "dlFloatIn 0.36s cubic-bezier(0.34,1.35,0.64,1)",
          lineHeight: 0,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 20,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(210,25,25,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}
        >
          <X size={13} style={{ pointerEvents: "none" }} />
        </button>

        {/* Clicking the image goes to the configured link (APK download by default) */}
        {bannerUrl ? (
          <a
            href={bannerLink}
            download={bannerLink.endsWith(".apk") ? "luofilm.apk" : undefined}
            target={bannerLink.endsWith(".apk") ? undefined : "_blank"}
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: "block", lineHeight: 0, cursor: "pointer" }}
          >
            <img
              src={bannerUrl}
              alt="Download LUOFILM App"
              draggable={false}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </a>
        ) : (
          <div style={{ width: "min(580px, 94vw)", height: 180, background: "#111" }} />
        )}
      </div>

      <style>{`
        @keyframes dlBgIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dlFloatIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 28px)) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
