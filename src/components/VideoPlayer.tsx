import { useRef, useState, useEffect, useCallback } from "react";
import { getProxiedUrl, detectExtension } from "../lib/videoProtection";

// ── DevTools detection ──────────────────────────────────────────────────────
function useDevToolsDetection(onOpen: () => void, onClose: () => void) {
  useEffect(() => {
    let isOpen = false;

    const checkSize = () => {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      return wDiff > 160 || hDiff > 160;
    };

    const checkConsole = () => {
      let opened = false;
      const el = document.createElement("div");
      Object.defineProperty(el, "id", {
        get() { opened = true; return ""; },
        configurable: true,
      });
      console.log("%c", el);
      return opened;
    };

    const check = () => {
      const detected = checkSize() || checkConsole();
      if (detected && !isOpen) { isOpen = true; onOpen(); }
      else if (!detected && isOpen) { isOpen = false; onClose(); }
      if (isOpen) {
        try { console.clear(); } catch (_) {}
        try { performance.clearResourceTimings(); } catch (_) {}
      }
    };

    const id = setInterval(check, 600);
    return () => clearInterval(id);
  }, [onOpen, onClose]);
}

// ── Lock video element src so extensions read empty string ──────────────────
function lockVideoSrc(el: HTMLVideoElement) {
  try {
    // Shadow the instance property so .src returns "" to outside readers
    // but we keep the real URL in a closure and set it via the prototype setter
    const descriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, "src");
    if (!descriptor) return;
    let _realSrc = el.src;
    Object.defineProperty(el, "src", {
      get: () => "",              // extensions always see empty string
      set: (val: string) => {
        _realSrc = val;
        descriptor.set?.call(el, val);
      },
      configurable: true,
    });
    // Re-apply the current src so the video keeps playing
    if (_realSrc) descriptor.set?.call(el, _realSrc);
  } catch (_) {}
}

interface SubtitleTrack { src: string; label: string; lang: string; }
interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onEnded?: () => void;
  subtitles?: SubtitleTrack[];
  subtitlesEnabled?: boolean;
}

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoPlayer({ src, poster, title, onEnded, subtitles = [], subtitlesEnabled = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [showPlay, setShowPlay] = useState(false);
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const [extensionBlocked, setExtensionBlocked] = useState(false);

  // ── Extension detection loop ─────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (detectExtension()) {
        const v = videoRef.current;
        if (v && !v.paused) v.pause();
        setExtensionBlocked(true);
      } else {
        setExtensionBlocked(false);
      }
    };
    check();
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, []);

  const handleDevToolsOpen = useCallback(() => {
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    setDevtoolsOpen(true);
  }, []);
  const handleDevToolsClose = useCallback(() => setDevtoolsOpen(false), []);
  useDevToolsDetection(handleDevToolsOpen, handleDevToolsClose);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // ── Video event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
      // Clear resource timings on every time update tick (when video is playing)
      try { performance.clearResourceTimings(); } catch (_) {}
    };
    const onDurationChange = () => setDuration(v.duration);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onEnded2 = () => { setPlaying(false); onEnded?.(); };
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("ended", onEnded2);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnded2);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [onEnded]);

  // ── Load video via proxy + lock src getter ───────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    const proxied = getProxiedUrl(src);

    // Use prototype setter directly so our locked getter stays in place
    const descriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, "src");
    if (descriptor?.set) {
      descriptor.set.call(v, proxied);
    } else {
      v.src = proxied;
    }
    v.load();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoading(true);

    // After a short delay, lock the src getter so extensions read ""
    const lockTimer = setTimeout(() => lockVideoSrc(v), 200);

    // Immediately clear the resource timing entry for this load
    try { performance.clearResourceTimings(); } catch (_) {}

    return () => clearTimeout(lockTimer);
  }, [src]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowRight") { e.preventDefault(); skip(10); }
      if (e.key === "ArrowLeft") { e.preventDefault(); skip(-10); }
      if (e.key === "ArrowUp") { e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); }
      if (e.key === "ArrowDown") { e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); }
      if (e.key === "m" || e.key === "M") toggleMute();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ── Subtitle mode ────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const applyMode = () => {
      for (let i = 0; i < v.textTracks.length; i++)
        v.textTracks[i].mode = subtitlesEnabled ? "showing" : "hidden";
    };
    if (v.readyState >= 1) applyMode();
    else v.addEventListener("loadedmetadata", applyMode, { once: true });
  }, [subtitlesEnabled, src]);

  const isBlocked = devtoolsOpen || extensionBlocked;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || isBlocked) return;
    if (v.paused) { v.play(); flashIcon(); } else { v.pause(); }
    resetHideTimer();
  };
  const flashIcon = () => { setShowPlay(true); setTimeout(() => setShowPlay(false), 600); };
  const skip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
    resetHideTimer();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current; const v = videoRef.current;
    if (!bar || !v || !duration) return;
    const rect = bar.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
    resetHideTimer();
  };
  const onProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    setHoverTime(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
    setHoverX(e.clientX - rect.left);
  };
  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    setVolume(val); v.volume = val;
    setMuted(val === 0);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const volIcon = muted || volume === 0 ? <VolMuteIcon /> : volume < 0.5 ? <VolLowIcon /> : <VolHighIcon />;

  return (
    <div
      ref={containerRef}
      onContextMenu={e => e.preventDefault()}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (hideTimer.current) clearTimeout(hideTimer.current); setShowControls(false); }}
      onMouseEnter={resetHideTimer}
      style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 8, overflow: "hidden", userSelect: "none" }}
    >
      <video
        ref={videoRef}
        poster={poster}
        disablePictureInPicture
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback nofullscreen"
        disableRemotePlayback
        onContextMenu={e => e.preventDefault()}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
      >
        {subtitles.map((t, i) => (
          <track key={t.src} kind="subtitles" src={t.src} srcLang={t.lang} label={t.label} default={i === 0} />
        ))}
      </video>

      {/* ── Protection overlay (DevTools OR extension detected) ─────────── */}
      {isBlocked && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          background: "rgba(0,0,0,0.97)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
          userSelect: "none",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(255,80,80,0.12)",
            border: "2px solid rgba(255,80,80,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff5050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: 700, margin: 0, textAlign: "center" }}>
            {extensionBlocked ? "Extension Detected" : "Playback Paused"}
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
            {extensionBlocked
              ? "A browser extension that can capture video has been detected. Please disable it to continue watching."
              : "Developer tools detected. Close them to continue watching."}
          </p>
        </div>
      )}

      {/* Click / double-click overlay */}
      <div
        style={{ position: "absolute", inset: 0, zIndex: 1, cursor: showControls ? "default" : "none" }}
        onClick={isBlocked ? undefined : togglePlay}
        onDoubleClick={isBlocked ? undefined : toggleFullscreen}
      />

      {/* Loading spinner */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, pointerEvents: "none" }}>
          <div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,0.15)", borderTop: "3px solid #00a9f5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Flash play icon */}
      {showPlay && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 6, pointerEvents: "none" }}>
          <div style={{ background: "rgba(0,0,0,0.55)", borderRadius: "50%", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeOut 0.6s ease forwards" }}>
            <PlayIconSm />
          </div>
          <style>{`@keyframes fadeOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.4)}}`}</style>
        </div>
      )}

      {/* Big play button when paused and not started */}
      {!playing && !loading && currentTime === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, pointerEvents: "none" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #0080c8, #00c6ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 12px rgba(0,169,245,0.18), 0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 4 }}><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* Title overlay */}
      {!playing && title && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px 20px", background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)", zIndex: 2, pointerEvents: "none", opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}>
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{title}</p>
        </div>
      )}

      {/* Controls bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 4,
        background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
        padding: "48px 16px 12px",
        opacity: showControls ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: showControls ? "auto" : "none",
      }}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={seek}
          onMouseMove={onProgressHover}
          onMouseLeave={() => setHoverTime(null)}
          style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 4, marginBottom: 10, cursor: "pointer" }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.height = "6px"; }}
          onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.height = "4px"; }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${bufferedPct}%`, background: "rgba(255,255,255,0.25)", borderRadius: 4 }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "linear-gradient(90deg, #0080c8, #00c6ff)", borderRadius: 4 }} />
          <div style={{ position: "absolute", top: "50%", left: `${progress}%`, transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: "#00c6ff", boxShadow: "0 0 6px rgba(0,198,255,0.8)" }} />
          {hoverTime !== null && (
            <div style={{ position: "absolute", bottom: "calc(100% + 10px)", left: hoverX, transform: "translateX(-50%)", background: "rgba(10,10,20,0.92)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 4, pointerEvents: "none", whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.1)" }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CtrlButton onClick={e => { e.stopPropagation(); togglePlay(); }}>{playing ? <PauseIcon /> : <PlayIcon />}</CtrlButton>
            <CtrlButton onClick={e => { e.stopPropagation(); skip(-10); }} title="Back 10s"><SkipBackIcon /></CtrlButton>
            <CtrlButton onClick={e => { e.stopPropagation(); skip(10); }} title="Forward 10s"><SkipFwdIcon /></CtrlButton>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
              <CtrlButton onClick={e => { e.stopPropagation(); toggleMute(); }}>{volIcon}</CtrlButton>
              <div style={{ width: showVolume ? 70 : 0, overflow: "hidden", transition: "width 0.2s", display: "flex", alignItems: "center" }}>
                <input type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
                  onChange={e => changeVolume(Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 70, accentColor: "#00c6ff", cursor: "pointer" }}
                />
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CtrlButton onClick={e => { e.stopPropagation(); toggleFullscreen(); }}>
              {fullscreen ? <ExitFsIcon /> : <FsIcon />}
            </CtrlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlButton({ onClick, title, children }: { onClick?: (e: React.MouseEvent) => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: "6px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >{children}</button>
  );
}

function PlayIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>; }
function PlayIconSm() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>; }
function PauseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>; }
function SkipBackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
    <text x="12" y="14" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">10</text>
  </svg>;
}
function SkipFwdIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
    <text x="12" y="14" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">10</text>
  </svg>;
}
function VolHighIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>; }
function VolLowIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>; }
function VolMuteIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>; }
function FsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>; }
function ExitFsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>; }
