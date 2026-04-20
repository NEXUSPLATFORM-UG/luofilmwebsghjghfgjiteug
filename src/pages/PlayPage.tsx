import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import {
  Star,
  Share2,
  Heart,
  Download,
  ThumbsUp,
  MessageSquare,
  Film,
  Lock,
} from "lucide-react";
import { fbApi } from "../lib/firebaseApi";
import { auth } from "../lib/firebase";
import VideoPlayer from "../components/VideoPlayer";
import VIPModal from "../components/VIPModal";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { useSEO } from "../hooks/useSEO";

function getEmbedInfo(url: string): { type: "video" | "iframe"; src: string } {
  if (!url) return { type: "video", src: "" };
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return { type: "iframe", src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };
  return { type: "video", src: url };
}

interface Show {
  id: string;
  title: string;
  type: string;
  episodeCount?: number;
  badge?: string;
  genre: string;
  year?: number;
  rating?: number;
  description?: string;
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
    year: d.year || 2024,
    rating: d.rating || 8.0,
    description: d.description || "",
    coverUrl: d.coverUrl || d.thumbnailUrl || "",
    thumbnailUrl: d.thumbnailUrl || d.coverUrl || "",
  };
}

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  // Block DevTools keyboard shortcuts on this page
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
        (e.ctrlKey && ["U", "u"].includes(e.key)) ||
        (e.metaKey && e.altKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", block, true);
    return () => document.removeEventListener("keydown", block, true);
  }, []);

  const [show, setShow] = useState<Show | null>(null);
  const [rawData, setRawData] = useState<any>(null);

  const posterImage = show?.coverUrl || show?.thumbnailUrl;
  useSEO({
    title: show
      ? `${show.title} (Luo Translated${show.year ? ` ${show.year}` : ""}) — VJ Paul UG`
      : "Watch Luo Translated Content",
    description: show?.description
      ? `${show.description} — Watch this Luo translated ${show.type === "movie" ? "movie" : "series"} by VJ Paul UG on LUOFILM.SITE. Free streaming.`
      : "Watch Luo translated movies and drama by VJ Paul UG on LUOFILM.SITE — free streaming worldwide.",
    image: posterImage,
    url: `/play/${params.id}`,
    type: show?.type === "movie" ? "video.movie" : "video.tv_show",
  });
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingShow, setLoadingShow] = useState(true);
  const [currentEp, setCurrentEp] = useState(1);
  const [epPage, setEpPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"EPISODES" | "RECOMMENDED" | "SYNOPSIS" | "COMMENTS">("EPISODES");
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [shareLabel, setShareLabel] = useState<"SHARE" | "COPIED!">("SHARE");

  const [downloading, setDownloading] = useState(false);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [showVIP, setShowVIP] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [minPlanPrice, setMinPlanPrice] = useState<number>(2500);
  const anonId = fbApi.userActions.getAnonId();

  useEffect(() => {
    fbApi.settings.get().then((s: any) => {
      if (!s) return;
      const prices = [
        Number(s.plan1DayPrice ?? 2500),
        Number(s.plan3DaysPrice ?? 5000),
        Number(s.plan1WeekPrice ?? 10000),
        Number(s.plan1MonthPrice ?? 20000),
      ].filter(Boolean);
      setMinPlanPrice(Math.min(...prices));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!params.id) return;
    setLoadingShow(true);
    setShow(null);
    setEpisodes([]);
    setRelated([]);
    setCommentsLoaded(false);
    setComments([]);
    setLikesCount(0);
    setSavesCount(0);
    fbApi.publicContent.getById(params.id).then((d) => {
      if (d) {
        try {
          localStorage.setItem("lf_last_clicked_show", JSON.stringify({
            id: d.id, title: d.title || "", genre: d.genre || "", type: d.type || "",
          }));
        } catch {}
        setShow(toShow(d));
        setRawData(d);
        setLikesCount(Number(d.likesCount) || 0);
        setSavesCount(Number(d.savesCount) || 0);
        setActiveTab(d.type === "series" ? "EPISODES" : "RECOMMENDED");
        if (d.type === "series") {
          fbApi.content.episodes.list(params.id).then((r) => {
            const eps = r.episodes || [];
            setEpisodes(eps);
            if ((d.episodeCount || 0) !== eps.length) {
              fbApi.content.update(params.id, { episodeCount: eps.length }).catch(() => {});
              setShow((prev) => prev ? { ...prev, episodeCount: eps.length } : prev);
            }
          }).catch(() => {});
        }
        fbApi.content.incrementViews(params.id).catch(() => {});
        const cu = auth.currentUser;
        fbApi.activities.log({
          userId: cu?.uid || null,
          userName: cu?.displayName || null,
          userEmail: cu?.email || null,
          actionType: "page_view",
          contentId: params.id,
          contentTitle: d.title || "",
          page: `/play/${params.id}`,
        }).catch(() => {});
        if (cu?.uid) {
          fbApi.userActions.logWatch(cu.uid, {
            id: params.id, title: d.title, type: d.type,
            thumbnailUrl: d.thumbnailUrl || d.coverUrl,
          }).catch(() => {});
        }
        fbApi.publicContent.listAll().then((all: any[]) => {
          setRelated(all.filter((x: any) => x.id !== params.id).slice(0, 12));
        }).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoadingShow(false));
  }, [params.id]);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setIsSubscribed(false); return; }
    fbApi.subscriptions.checkActive(user.uid)
      .then(setIsSubscribed)
      .catch(() => setIsSubscribed(false));
  }, [user]);

  useEffect(() => {
    const defaultTitle = "LUOFILM.SITE — VJ PAUL FREE DOWNLOAD";
    const defaultFavicon = "/logo.png";

    function setMeta(attr: string, key: string, val: string) {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.content = val;
    }
    function setFavicon(href: string) {
      let link = document.querySelector("link#site-favicon") as HTMLLinkElement | null;
      if (!link) { link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null; }
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = href;
    }

    if (show) {
      const poster = show.coverUrl || show.thumbnailUrl || "";
      const movieTitle = `${show.title} | VJ PAUL FREE DOWNLOAD LUOFILM.SITE`;
      const desc = show.description || "Watch free on LUOFILM.SITE — VJ PAUL FREE DOWNLOAD";
      const pageUrl = window.location.href;

      document.title = movieTitle;
      if (poster) setFavicon(poster);
      setMeta("property", "og:title", movieTitle);
      setMeta("property", "og:description", desc);
      setMeta("property", "og:image", poster || defaultFavicon);
      setMeta("property", "og:url", pageUrl);
      setMeta("property", "og:type", "video.movie");
      setMeta("name", "twitter:title", movieTitle);
      setMeta("name", "twitter:description", desc);
      setMeta("name", "twitter:image", poster || defaultFavicon);
      setMeta("name", "twitter:card", "summary_large_image");
    }

    return () => {
      document.title = defaultTitle;
      setFavicon(defaultFavicon);
      setMeta("property", "og:title", defaultTitle);
      setMeta("property", "og:image", defaultFavicon);
      setMeta("property", "og:type", "website");
    };
  }, [show]);

  useEffect(() => {
    if (!params.id) return;
    fbApi.userActions.checkLike(params.id, anonId).then(setLiked).catch(() => {});
    fbApi.userActions.checkSave(params.id, anonId).then(setSaved).catch(() => {});
  }, [params.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLike = async () => {
    if (likeLoading || !params.id) return;
    setLikeLoading(true);
    try {
      const nowLiked = await fbApi.userActions.toggleLike(params.id, anonId);
      setLiked(nowLiked);
      setLikesCount(prev => Math.max(0, prev + (nowLiked ? 1 : -1)));
      showToast(nowLiked ? "Added to likes!" : "Removed from likes");
    } catch { showToast("Could not update like"); }
    finally { setLikeLoading(false); }
  };

  const handleSave = async () => {
    if (saveLoading || !params.id || !show) return;
    setSaveLoading(true);
    try {
      const nowSaved = await fbApi.userActions.toggleSave(params.id, anonId, {
        title: show.title,
        coverUrl: show.coverUrl || "",
        type: show.type,
      });
      setSaved(nowSaved);
      setSavesCount(prev => Math.max(0, prev + (nowSaved ? 1 : -1)));
      showToast(nowSaved ? "Saved to watchlist!" : "Removed from watchlist");
    } catch { showToast("Could not update watchlist"); }
    finally { setSaveLoading(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = show?.title ? `${show.title} | LUOFILM.SITE` : "LUOFILM.SITE";
    const text = `Watch "${show?.title}" free — VJ PAUL FREE DOWNLOAD on LUOFILM.SITE`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); showToast("Shared!"); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("COPIED!");
      setTimeout(() => setShareLabel("SHARE"), 2000);
      showToast("Link copied to clipboard!");
    } catch { showToast("Copy this link: " + url); }
  };

  const loadComments = async () => {
    if (!params.id) return;
    try {
      const list = await fbApi.comments.list(params.id);
      setComments(list);
      setCommentsLoaded(true);
    } catch { setCommentsLoaded(true); }
  };

  const handleCommentTabSwitch = () => {
    setActiveTab("COMMENTS");
    if (!commentsLoaded) loadComments();
  };

  const handleComment = async () => {
    if (!params.id || !commentText.trim() || submittingComment) return;
    const userName = user?.displayName || user?.email?.split("@")[0] || "Guest";
    const userId = user?.uid || anonId;
    setSubmittingComment(true);
    try {
      const id = await fbApi.comments.add(params.id, userId, userName, commentText);
      const newComment = {
        id,
        contentId: params.id,
        userId,
        userName,
        text: commentText.trim(),
        createdAt: Date.now(),
      };
      setComments(prev => [newComment, ...prev]);
      setCommentText("");
      showToast("Comment posted!");
    } catch { showToast("Could not post comment"); }
    finally { setSubmittingComment(false); }
  };

  const formatCommentTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getDownloadLinks = (): { key: string; label: string; url: string }[] => {
    const sourceLinks = isSeries
      ? (currentEpisodeData?.downloadLinks || {})
      : (rawData?.downloadLinks || {});
    const QUALITY_ORDER = [
      { key: "1080p", label: "1080p Full HD" },
      { key: "720p", label: "720p HD" },
      { key: "480p", label: "480p Standard" },
      { key: "360p", label: "360p Low" },
    ];
    const fromLinks = QUALITY_ORDER.filter(q => sourceLinks[q.key]).map(q => ({
      key: q.key, label: q.label, url: sourceLinks[q.key],
    }));
    if (fromLinks.length > 0) return fromLinks;
    const fallbackUrl = (isSeries ? currentEpisodeData?.videoUrl : rawData?.videoUrl) || "";
    if (fallbackUrl) return [{ key: "Original", label: "Original Quality", url: fallbackUrl }];
    return [];
  };

  const handleDownload = async (quality: string, url: string) => {
    if (!url) { showToast("No video available to download"); setShowQualityPicker(false); return; }
    setShowQualityPicker(false);
    const isEmbed = /youtube\.com|youtu\.be|drive\.google\.com|vimeo\.com/.test(url);
    if (isEmbed) {
      showToast("Opening in new tab for download");
      window.open(url, "_blank");
      return;
    }
    setDownloading(true);
    showToast(`Starting download (${quality})…`);
    try {
      const baseTitle = show?.title || "video";
      const episodePart = isSeries ? ` Episode ${currentEp}` : "";
      const filename = `${baseTitle}${episodePart} VJ PAUL UG (www.luofilm.site).mp4`;
      const proxyUrl = `https://download.mainplatform-nexus.workers.dev/?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=1`;
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Download started!");
    } catch {
      showToast("Download failed. Please try again.");
    } finally { setDownloading(false); }
  };

  if (loadingShow) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!show) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Content not found</div>
        <Link href="/"><button style={{ padding: "8px 20px", background: "#00a9f5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Go Home</button></Link>
      </div>
    );
  }

  const isSeries = show.type === "series";
  const displayEpisodes = episodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
  const EPS_PER_PAGE = 30;
  const totalPages = Math.ceil(displayEpisodes.length / EPS_PER_PAGE);
  const visibleEpisodes = displayEpisodes.slice(epPage * EPS_PER_PAGE, (epPage + 1) * EPS_PER_PAGE);
  const currentEpisodeData = displayEpisodes.find((e: any) => (e.episodeNumber || e.number) === currentEp);
  const videoSrc = (currentEpisodeData as any)?.videoUrl || rawData?.videoUrl || "";
  const isVip = show.badge === "VIP";

  const subtitleTracks = (() => {
    const tracks: { src: string; label: string; lang: string }[] = [];
    if (rawData?.subtitleUrl) tracks.push({ src: rawData.subtitleUrl, label: "English", lang: "en" });
    if (rawData?.subtitleEn) tracks.push({ src: rawData.subtitleEn, label: "English", lang: "en" });
    if (rawData?.subtitleFr) tracks.push({ src: rawData.subtitleFr, label: "French", lang: "fr" });
    if (rawData?.subtitleSw) tracks.push({ src: rawData.subtitleSw, label: "Swahili", lang: "sw" });
    if (Array.isArray(rawData?.subtitles)) {
      for (const s of rawData.subtitles) {
        if (s?.src) tracks.push({ src: s.src, label: s.label || "Subtitle", lang: s.lang || "en" });
      }
    }
    return tracks;
  })();
  const hasSubtitles = subtitleTracks.length > 0;

  const tabs = isSeries
    ? (["EPISODES", "RECOMMENDED", "SYNOPSIS", "COMMENTS"] as const)
    : (["RECOMMENDED", "SYNOPSIS", "COMMENTS"] as const);

  return (
    <>
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,20,35,0.97)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontSize: 13, fontWeight: 500,
          padding: "10px 22px", borderRadius: 100,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          zIndex: 9999, whiteSpace: "nowrap",
          animation: "fadeInUp 0.2s ease",
        }}>
          <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
          {toast}
        </div>
      )}

      <div className="mobile-header-spacer" style={{ height: 54 }} />

      {/* Breadcrumb */}
      <div
        className="play-breadcrumb"
        style={{
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        <Link href="/">
          <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.35)" }}>HOME</span>
        </Link>
        <span>&gt;</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{show.genre.split(" · ")[0]}</span>
        <span>&gt;</span>
        <span style={{ color: "rgba(255,255,255,0.75)" }}>{show.title}</span>
      </div>

      <div
        className="play-main-layout"
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 16px 40px",
          display: "flex",
          gap: 16,
        }}
      >
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Video player */}
          {isSubscribed === false ? (
            /* Subscription gate */
            <div className="vip-gate" style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0a0a18", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {show.coverUrl && (
                <img src={show.coverUrl} alt={show.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, filter: "blur(4px)" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))" }} />
              <div className="vip-gate-inner" style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px" }}>
                <div className="vip-gate-icon" style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Lock className="vip-gate-lock" size={26} color="#ffc552" />
                </div>
                <div className="vip-gate-title" style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>VIP Subscription Required</div>
                <div className="vip-gate-desc" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24, lineHeight: 1.6 }}>
                  Subscribe to unlock unlimited watching and downloading.<br />Plans from <strong style={{ color: "#ffc552" }}>UGX {minPlanPrice.toLocaleString()}</strong> — activate instantly!
                </div>
                <button
                  onClick={() => setShowVIP(true)}
                  className="vip-gate-btn"
                  style={{ padding: "12px 36px", borderRadius: 30, background: "linear-gradient(90deg,#f5c842,#e8a800)", border: "none", color: "#3d2200", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,200,66,0.5)" }}
                >
                  Subscribe to Watch
                </button>
                {!user && (
                  <div className="vip-gate-login" style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    Already subscribed? <span style={{ color: "#ffc552", cursor: "pointer" }} onClick={() => setShowVIP(true)}>Log in</span>
                  </div>
                )}
              </div>
            </div>
          ) : videoSrc ? (() => {
            const embed = getEmbedInfo(videoSrc);
            if (embed.type === "iframe") {
              return (
                <div
                  onContextMenu={e => e.preventDefault()}
                  style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 8, overflow: "hidden" }}
                >
                  <iframe
                    src={embed.src}
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "#000" }}
                  />
                </div>
              );
            }
            return (
              <VideoPlayer
                src={embed.src}
                poster={show.coverUrl}
                title={isSeries ? `${show.title} · Episode ${currentEp}` : show.title}
                subtitles={subtitleTracks}
                subtitlesEnabled={subtitlesOn}
              />
            );
          })() : (
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#111", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {show.coverUrl && (
                <img src={show.coverUrl} alt={show.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.2, borderRadius: 8 }} />
              )}
              <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>
                  {isSeries ? "Select an episode below to start watching" : "No video uploaded yet"}
                </p>
              </div>
            </div>
          )}

          {/* Mobile action buttons — shown below player on mobile only */}
          <div className="play-mobile-action-bar">
            {/* Like */}
            <button
              className="play-mob-btn"
              onClick={handleLike}
              style={{
                background: liked ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "rgba(59,130,246,0.08)",
                border: `1px solid ${liked ? "#3b82f6" : "rgba(59,130,246,0.35)"}`,
              }}
            >
              <ThumbsUp size={14} fill={liked ? "#fff" : "none"} color={liked ? "#fff" : "#60a5fa"} />
              <span className="play-mob-label" style={{ color: liked ? "#fff" : "#60a5fa" }}>
                {likeLoading ? "…" : liked ? "LIKED" : "LIKE"}{likesCount > 0 ? ` ${likesCount >= 1000 ? `${(likesCount/1000).toFixed(1)}k` : likesCount}` : ""}
              </span>
            </button>
            {/* Save */}
            <button
              className="play-mob-btn"
              onClick={handleSave}
              style={{
                background: saved ? "linear-gradient(135deg,#db2777,#f472b6)" : "rgba(244,114,182,0.08)",
                border: `1px solid ${saved ? "#f472b6" : "rgba(244,114,182,0.35)"}`,
              }}
            >
              <Heart size={14} fill={saved ? "#fff" : "none"} color={saved ? "#fff" : "#f472b6"} />
              <span className="play-mob-label" style={{ color: saved ? "#fff" : "#f472b6" }}>
                {saveLoading ? "…" : saved ? "SAVED" : "SAVE"}{savesCount > 0 ? ` ${savesCount >= 1000 ? `${(savesCount/1000).toFixed(1)}k` : savesCount}` : ""}
              </span>
            </button>
            {/* Share */}
            <button
              className="play-mob-btn"
              onClick={handleShare}
              style={{
                background: shareLabel === "COPIED!" ? "linear-gradient(135deg,#059669,#34d399)" : "rgba(52,211,153,0.08)",
                border: `1px solid ${shareLabel === "COPIED!" ? "#34d399" : "rgba(52,211,153,0.35)"}`,
              }}
            >
              <Share2 size={14} color={shareLabel === "COPIED!" ? "#fff" : "#34d399"} />
              <span className="play-mob-label" style={{ color: shareLabel === "COPIED!" ? "#fff" : "#34d399" }}>{shareLabel}</span>
            </button>
            {/* Download */}
            <button
              className="play-mob-btn"
              onClick={() => { if (!isSubscribed) { setShowVIP(true); return; } setShowQualityPicker(!showQualityPicker); }}
              style={{
                background: "rgba(251,146,60,0.08)",
                border: "1px solid rgba(251,146,60,0.35)",
                position: "relative",
              }}
            >
              {isSubscribed ? <Download size={14} color="#fb923c" /> : <Lock size={14} color="#fb923c" />}
              <span className="play-mob-label" style={{ color: "#fb923c" }}>DOWNLOAD</span>
              {showQualityPicker && isSubscribed && (() => {
                const dlLinks = getDownloadLinks();
                return (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={e => { e.stopPropagation(); setShowQualityPicker(false); }} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", left: "50%",
                      transform: "translateX(-50%)", zIndex: 50,
                      background: "#1a1a2a", border: "1px solid rgba(251,146,60,0.3)",
                      borderRadius: 10, padding: "8px 6px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                      minWidth: 160,
                    }}>
                      {dlLinks.length > 0 ? dlLinks.map(q => (
                        <button key={q.key}
                          onClick={e => { e.stopPropagation(); handleDownload(q.key, q.url); }}
                          disabled={downloading}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            width: "100%", padding: "8px 12px", borderRadius: 6,
                            background: "transparent", border: "none", cursor: "pointer", gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>{q.key}</span>
                          <span style={{ fontSize: 12, color: "#fff", flex: 1, textAlign: "left" }}>{q.label}</span>
                        </button>
                      )) : (
                        <div style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>No download available</div>
                      )}
                    </div>
                  </>
                );
              })()}
            </button>
            {/* Open in App */}
            <button
              className="play-mob-btn"
              onClick={() => { window.location.href = `luofilm:///play/${params.id}`; setTimeout(() => { window.location.href = "https://luofilm.site"; }, 1500); }}
              style={{
                background: "linear-gradient(135deg,#6a00aa,#cc00cc,#e040fb)",
                border: "1px solid #cc00cc",
              }}
            >
              <img src="/luofilm-app-icon.png" alt="App" style={{ width: 14, height: 14, objectFit: "contain", filter: "drop-shadow(0 1px 4px rgba(204,0,204,0.5))", flexShrink: 0 }} />
              <span className="play-mob-label">OPEN IN APP</span>
            </button>
          </div>

          {/* Show title + meta */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {isVip && (
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "linear-gradient(90deg,#ffc552,#ffdd9a)",
                        color: "#4e2d03",
                      }}
                    >
                      VIP
                    </span>
                  )}
                  {!isSeries && (
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        background: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.7)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Film size={10} />
                      MOVIE
                    </span>
                  )}
                  <h1 className="play-title" style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
                    {show.title}
                  </h1>
                </div>
                <div
                  className="play-meta"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={13} fill="#ffc552" color="#ffc552" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#ffc552" }}>
                      {show.rating}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>|</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {show.year}
                  </span>
                  {isSeries && (
                    <>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>|</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        {show.episodeCount} EPS
                      </span>
                    </>
                  )}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>|</span>
                  {show.genre.split(" · ").map((g) => (
                    <span
                      key={g}
                      style={{
                        fontSize: 11,
                        color: "#00a9f5",
                        cursor: "pointer",
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons - desktop only */}
              <div className="play-action-btns" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <ActionBtn
                  icon={<ThumbsUp size={14} fill={liked ? "#fff" : "none"} color={liked ? "#fff" : "#60a5fa"} />}
                  label={likeLoading ? "…" : liked ? "LIKED" : "LIKE"}
                  count={likesCount}
                  active={liked}
                  color={{
                    bg: "rgba(59,130,246,0.08)",
                    border: "#3b82f6",
                    glow: "rgba(59,130,246,0.4)",
                    activeBg: "linear-gradient(135deg,#2563eb,#3b82f6)",
                  }}
                  onClick={handleLike}
                />
                <ActionBtn
                  icon={<Heart size={14} fill={saved ? "#fff" : "none"} color={saved ? "#fff" : "#f472b6"} />}
                  label={saveLoading ? "…" : saved ? "SAVED" : "SAVE"}
                  count={savesCount}
                  active={saved}
                  color={{
                    bg: "rgba(244,114,182,0.08)",
                    border: "#f472b6",
                    glow: "rgba(244,114,182,0.4)",
                    activeBg: "linear-gradient(135deg,#db2777,#f472b6)",
                  }}
                  onClick={handleSave}
                />
                <ActionBtn
                  icon={<Share2 size={14} color={shareLabel === "COPIED!" ? "#fff" : "#34d399"} />}
                  label={shareLabel}
                  active={shareLabel === "COPIED!"}
                  color={{
                    bg: "rgba(52,211,153,0.08)",
                    border: "#34d399",
                    glow: "rgba(52,211,153,0.4)",
                    activeBg: "linear-gradient(135deg,#059669,#34d399)",
                  }}
                  onClick={handleShare}
                />
                <div style={{ position: "relative", userSelect: "none", WebkitUserSelect: "none" }}>
                  <ActionBtn
                    icon={isSubscribed ? <Download size={14} color="#fb923c" /> : <Lock size={14} color="#fb923c" />}
                    label="DOWNLOAD"
                    active={false}
                    color={{
                      bg: "rgba(251,146,60,0.08)",
                      border: "#fb923c",
                      glow: "rgba(251,146,60,0.4)",
                      activeBg: "linear-gradient(135deg,#ea580c,#fb923c)",
                    }}
                    onClick={() => {
                      if (!isSubscribed) { setShowVIP(true); return; }
                      setShowQualityPicker(!showQualityPicker);
                    }}
                  />
                  {showQualityPicker && (() => {
                    const dlLinks = getDownloadLinks();
                    return (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowQualityPicker(false)} />
                        <div style={{
                          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                          transform: "translateX(-50%)", zIndex: 50,
                          background: "#1a1a2a", border: "1px solid rgba(251,146,60,0.3)",
                          borderRadius: 10, padding: "8px 6px",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,146,60,0.1)",
                          minWidth: 160, animation: "qualityPop 0.15s ease",
                          userSelect: "none", WebkitUserSelect: "none",
                        }}>
                          <style>{`@keyframes qualityPop { from { opacity:0; transform:translateX(-50%) translateY(6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
                          <div style={{ fontSize: 11, color: "rgba(251,146,60,0.8)", textAlign: "center", paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <Download size={11} color="rgba(251,146,60,0.8)" /> Choose Quality
                          </div>
                          {dlLinks.length > 0 ? dlLinks.map(q => (
                            <button key={q.key}
                              onClick={() => handleDownload(q.key, q.url)}
                              disabled={downloading}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                width: "100%", padding: "8px 12px", borderRadius: 6,
                                background: "transparent", border: "none", cursor: downloading ? "not-allowed" : "pointer",
                                transition: "background 0.15s", gap: 12, opacity: downloading ? 0.5 : 1,
                                userSelect: "none", WebkitUserSelect: "none",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(251,146,60,0.12)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>{q.key}</span>
                              <span style={{ fontSize: 12, color: "#fff", flex: 1, textAlign: "left" }}>{q.label}</span>
                            </button>
                          )) : (
                            <div style={{ padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                              No download available
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <ActionBtn
                  icon={<img src="/luofilm-app-icon.png" alt="App" style={{ width: 22, height: 22, objectFit: "contain", display: "block", filter: "drop-shadow(0 1px 4px rgba(204,0,204,0.5))" }} />}
                  label="OPEN IN APP"
                  active={true}
                  color={{
                    bg: "rgba(204,0,204,0.15)",
                    border: "#cc00cc",
                    glow: "rgba(204,0,204,0.5)",
                    activeBg: "linear-gradient(135deg,#6a00aa,#cc00cc,#e040fb)",
                  }}
                  onClick={() => {
                    window.location.href = `luofilm:///play/${params.id}`;
                    setTimeout(() => {
                      window.location.href = "https://luofilm.site";
                    }, 1500);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ marginTop: 18 }}>
            <div
              className="play-tabs"
              style={{
                display: "flex",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                gap: 0,
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => tab === "COMMENTS" ? handleCommentTabSwitch() : setActiveTab(tab)}
                  style={{
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "#00a9f5" : "rgba(255,255,255,0.5)",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid #00a9f5" : "2px solid transparent",
                    cursor: "pointer",
                    marginBottom: -1,
                    transition: "all 0.2s",
                  }}
                >
                  {tab === "COMMENTS" ? `COMMENTS${comments.length > 0 ? ` (${comments.length})` : ""}` : tab}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              {activeTab === "EPISODES" && isSeries && (
                <div>
                  {/* Episode range selectors */}
                  {totalPages > 1 && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setEpPage(i)}
                          style={{
                            padding: "3px 12px",
                            fontSize: 12,
                            borderRadius: 3,
                            border: epPage === i ? "1px solid #00a9f5" : "1px solid rgba(255,255,255,0.12)",
                            color: epPage === i ? "#00a9f5" : "rgba(255,255,255,0.45)",
                            background: epPage === i ? "rgba(0,169,245,0.1)" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          {i * EPS_PER_PAGE + 1}–{Math.min((i + 1) * EPS_PER_PAGE, episodes.length)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sort row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>SORT</span>
                    {["ASC", "DESC"].map((s, i) => (
                      <button
                        key={s}
                        style={{
                          fontSize: 12,
                          color: i === 0 ? "#00a9f5" : "rgba(255,255,255,0.4)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {visibleEpisodes.map((ep: any) => {
                      const epNum = ep.episodeNumber || ep.number;
                      return (
                        <button
                          key={ep.id || epNum}
                          onClick={() => setCurrentEp(epNum)}
                          style={{
                            padding: "8px 0",
                            fontSize: 13,
                            fontWeight: currentEp === epNum ? 600 : 400,
                            borderRadius: 4,
                            border: currentEp === epNum
                              ? "1px solid #00a9f5"
                              : "1px solid rgba(255,255,255,0.1)",
                            color: currentEp === epNum ? "#00a9f5" : "rgba(255,255,255,0.55)",
                            background: currentEp === epNum ? "rgba(0,169,245,0.08)" : "rgba(255,255,255,0.03)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {epNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "SYNOPSIS" && (
                <div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <img
                      src={show.coverUrl}
                      alt={show.title}
                      style={{ width: 90, height: 120, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                    />
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{show.title}</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {[
                          ["TYPE", isSeries ? "Series" : "Movie"],
                          ["GENRE", show.genre],
                          ["YEAR", String(show.year)],
                          ...(isSeries ? [["EPISODES", `${show.episodeCount} EPS`]] : []),
                          ["RATING", String(show.rating)],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                            <span style={{ color: "rgba(255,255,255,0.35)", width: 70 }}>{k}</span>
                            <span style={{ color: "rgba(255,255,255,0.75)" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, maxWidth: 680 }}>
                    {show.description}
                  </p>
                </div>
              )}

              {activeTab === "COMMENTS" && (
                <div style={{ maxWidth: 680 }}>
                  {/* Comment input */}
                  <div style={{ marginBottom: 20 }}>
                    {user ? (
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{
                          flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
                          background: "linear-gradient(135deg,#00a9f5,#3b82f6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, color: "#fff",
                        }}>
                          {(user.displayName || user.email || "?")[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            rows={3}
                            maxLength={500}
                            style={{
                              width: "100%", background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                              color: "#fff", fontSize: 13, padding: "10px 12px",
                              resize: "vertical", outline: "none", boxSizing: "border-box",
                              fontFamily: "inherit",
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,169,245,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                          />
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                            <button
                              onClick={handleComment}
                              disabled={!commentText.trim() || submittingComment}
                              style={{
                                padding: "6px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                background: commentText.trim() && !submittingComment ? "#00a9f5" : "rgba(255,255,255,0.08)",
                                color: commentText.trim() && !submittingComment ? "#fff" : "rgba(255,255,255,0.3)",
                                border: "none", cursor: commentText.trim() && !submittingComment ? "pointer" : "not-allowed",
                                transition: "all 0.2s",
                              }}
                            >
                              {submittingComment ? "Posting…" : "POST"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: "14px 16px", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Sign in to join the conversation</span>
                        <button
                          onClick={() => setShowAuth(true)}
                          style={{
                            padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                            background: "#00a9f5", color: "#fff", border: "none", cursor: "pointer",
                          }}
                        >
                          SIGN IN
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comments list */}
                  {!commentsLoaded ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                      Loading comments…
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0" }}>
                      <MessageSquare size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No comments yet. Be the first!</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {comments.map(c => (
                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{
                            flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                            background: "linear-gradient(135deg,#8819ff,#c084fc)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, color: "#fff",
                          }}>
                            {(c.userName || "?")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{c.userName}</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{formatCommentTime(c.createdAt)}</span>
                            </div>
                            <p style={{
                              margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)",
                              lineHeight: 1.6, wordBreak: "break-word",
                            }}>{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "RECOMMENDED" && (
                <div
                  className="play-recommended-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: 10,
                  }}
                >
                  {related.map((s) => (
                    <Link key={s.id} href={`/play/${s.id}`}>
                      <div style={{ cursor: "pointer" }}>
                        <div
                          style={{
                            position: "relative",
                            paddingTop: "133.33%",
                            borderRadius: 6,
                            overflow: "hidden",
                            background: "#1a1a1a",
                          }}
                        >
                          <img
                            src={s.thumbnailUrl}
                            alt={s.title}
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {s.badge && s.badge !== "none" && (
                            <span
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: "0 6px 0 6px",
                                background:
                                  s.badge === "VIP"
                                    ? "linear-gradient(45deg,#ffc552,#ffdd9a)"
                                    : "linear-gradient(45deg,#00a3f5,#00c9fd)",
                                color: s.badge === "VIP" ? "#4e2d03" : "#fff",
                              }}
                            >
                              {s.badge}
                            </span>
                          )}
                          {s.type === "movie" && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 4,
                                left: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "1px 5px",
                                borderRadius: 3,
                                background: "rgba(0,0,0,0.7)",
                                color: "rgba(255,255,255,0.8)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              MOVIE
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.8)",
                            marginTop: 6,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            marginTop: 2,
                          }}
                        >
                          {s.type === "series" ? `${s.episodeCount} EPS` : "Movie"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside
          className="play-sidebar"
          style={{
            width: 280,
            flexShrink: 0,
          }}
        >
          <div style={{ position: "sticky", top: 72 }}>
            {/* Show summary card */}
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <div style={{ position: "relative", paddingTop: "56.25%" }}>
                <img
                  src={show.coverUrl}
                  alt={show.title}
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
                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{show.title}</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Star size={11} fill="#ffc552" color="#ffc552" />
                    <span style={{ fontSize: 12, color: "#ffc552", fontWeight: 600 }}>
                      {show.rating}
                    </span>
                    {isSeries && (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        · {show.episodeCount} EPS
                      </span>
                    )}
                    {!isSeries && (
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        · Movie
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isVip && (
                <div style={{ padding: "10px 12px" }}>
                  <button
                    onClick={() => { if (!user) { setShowAuth(true); } else { setShowVIP(true); } }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 4,
                      background: "linear-gradient(90deg,#ffc552,#ffdd9a)",
                      color: "#4e2d03",
                      fontSize: 13,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ★ JOIN VIP · WATCH NOW
                  </button>
                </div>
              )}
            </div>

            {/* Related shows */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 14,
                    borderRadius: 2,
                    background: "#00a9f5",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>RELATED</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {related.slice(0, 6).map((s) => (
                  <Link key={s.id} href={`/play/${s.id}`}>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        cursor: "pointer",
                        borderRadius: 4,
                        padding: "4px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          width: 70,
                          height: 90,
                          borderRadius: 4,
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "#1a1a1a",
                          position: "relative",
                        }}
                      >
                        <img
                          src={s.thumbnailUrl}
                          alt={s.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        {s.badge && s.badge !== "none" && (
                          <span
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "0 4px 0 4px",
                              background:
                                s.badge === "VIP"
                                  ? "linear-gradient(45deg,#ffc552,#ffdd9a)"
                                  : "linear-gradient(45deg,#00a3f5,#00c9fd)",
                              color: s.badge === "VIP" ? "#4e2d03" : "#fff",
                            }}
                          >
                            {s.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.85)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.5,
                          }}
                        >
                          {s.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            marginTop: 4,
                          }}
                        >
                          {s.genre.split(" · ")[0]}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            marginTop: 2,
                          }}
                        >
                          {s.type === "series" ? `${s.episodeCount} EPS` : "Movie"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            marginTop: 4,
                          }}
                        >
                          <Star size={10} fill="#ffc552" color="#ffc552" />
                          <span style={{ fontSize: 11, color: "#ffc552" }}>{s.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>


    {showVIP && (
      <VIPModal
        onClose={() => setShowVIP(false)}
        onSubscribed={() => {
          setIsSubscribed(true);
          setShowVIP(false);
        }}
        onOpenAuth={() => { setShowVIP(false); setShowAuth(true); }}
      />
    )}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

function ActionBtn({
  icon,
  label,
  count,
  active,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  color: { bg: string; border: string; glow: string; activeBg: string };
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const displayCount = count !== undefined && count > 0
    ? count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count)
    : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        background: active
          ? color.activeBg
          : hovered
            ? color.bg
            : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? color.border : hovered ? color.border : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10,
        cursor: "pointer",
        padding: "0 10px",
        minWidth: 64,
        height: 44,
        flexShrink: 0,
        transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        boxShadow: active
          ? `0 4px 14px ${color.glow}`
          : hovered
            ? `0 2px 8px ${color.glow}`
            : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        overflow: "hidden",
      }}
    >
      {icon}
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: active ? "#fff" : "rgba(255,255,255,0.9)",
        lineHeight: 1,
        minHeight: 11,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}>
        {displayCount ?? ""}
      </span>
      <span className="play-action-btn-label" style={{
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: active ? "#fff" : hovered ? "#fff" : "rgba(255,255,255,0.45)",
        whiteSpace: "nowrap",
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "color 0.18s",
      }}>
        {label}
      </span>
    </button>
  );
}
