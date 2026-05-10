import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react";
import { fbApi } from "../lib/firebaseApi";
import { auth } from "../lib/firebase";
import { useSEO } from "../hooks/useSEO";
import ContinueWatching from "../components/ContinueWatching";

interface Show {
  id: string;
  title: string;
  type: string;
  episodeCount?: number;
  badge?: string;
  genre?: string;
  year?: number;
  rating?: number;
  description?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
}

interface CarouselItem {
  id: string;
  contentId?: string;
  page?: string;
  isActive?: boolean;
  sortOrder?: number;
  customTitle?: string;
  customDescription?: string;
  customImageUrl?: string;
}

function toShow(d: any): Show {
  return {
    id: d.id,
    title: d.title || "",
    type: d.type || "series",
    episodeCount: d.episodeCount || 0,
    badge: d.badge || "none",
    genre: d.genre || "",
    year: d.year || new Date().getFullYear(),
    rating: d.rating || 0,
    description: d.description || "",
    coverUrl: d.coverUrl || d.thumbnailUrl || "",
    thumbnailUrl: d.thumbnailUrl || d.coverUrl || "",
  };
}

function carouselToShow(item: CarouselItem, contentMap: Map<string, Show>): Show | null {
  if (item.contentId) {
    const content = contentMap.get(item.contentId);
    if (content) {
      return {
        ...content,
        title: item.customTitle || content.title,
        description: item.customDescription || content.description,
        thumbnailUrl: item.customImageUrl || content.thumbnailUrl,
        coverUrl: item.customImageUrl || content.coverUrl,
      };
    }
  }
  if (item.customTitle && item.customImageUrl) {
    return {
      id: item.id,
      title: item.customTitle,
      type: "movie",
      description: item.customDescription || "",
      thumbnailUrl: item.customImageUrl,
      coverUrl: item.customImageUrl,
      badge: "none",
      genre: "",
    };
  }
  return null;
}

export default function HomePage() {
  useSEO({
    title: "Luo Translated Movies & Drama — VJ Paul UG | Free Stream & Download",
    description: "LUOFILM.SITE — Stream and download Luo translated movies, drama, series and anime translated by VJ Paul UG. Free online Luo movies, Luo drama, Luo translated content worldwide.",
    keywords: "luo translated movies, luo movies, luofilm, luo film, vj paul ug, luo translated drama, luo series, luo translated anime, luo translated korean drama, luo translated chinese drama, luofilm.site, download luo movies, stream luo movies, free luo movies",
    url: "/",
  });
  const [shows, setShows] = useState<Show[]>([]);
  const [bannerShows, setBannerShows] = useState<Show[]>([]);
  const [secondaryShows, setSecondaryShows] = useState<Show[]>([]);
  const [featuredShows, setFeaturedShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cu = auth.currentUser;
    fbApi.activities.log({
      userId: cu?.uid || null,
      userName: cu?.displayName || null,
      userEmail: cu?.email || null,
      actionType: "page_view",
      page: "/",
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fbApi.publicContent.listAll(),
      fbApi.publicContent.getCarousel(),
      fbApi.publicContent.getSecondaryCarousel(),
      fbApi.publicContent.getHomeFeatured(),
    ])
      .then(([contentDocs, carouselItems, secondaryItems, featuredItems]) => {
        const allShows = contentDocs.map(toShow);
        setShows(allShows);

        const contentMap = new Map<string, Show>(allShows.map(s => [s.id, s]));

        // Main left hero — uses "Left Carousel" (page="home") admin items when configured,
        // falls back to movies from the database if admin has not set any left carousel slides
        const leftAdminItems = (carouselItems as CarouselItem[])
          .filter(item => (!item.page || item.page === "home") && item.isActive !== false);
        const adminBanner: Show[] = [];
        for (const item of leftAdminItems) {
          const s = carouselToShow(item, contentMap);
          if (s) adminBanner.push(s);
        }
        if (adminBanner.length > 0) {
          setBannerShows(adminBanner);
        } else if (allShows.length > 0) {
          const movies = allShows.filter(s => s.type === "movie");
          setBannerShows(movies.length > 0 ? movies.slice(0, 8) : allShows.slice(0, 8));
        }

        // Right secondary carousel — uses "Right Carousel" (carousel2) items ONLY
        // No fallback: if admin didn't configure carousel2, the right panel stays hidden
        const secondary: Show[] = [];
        for (const item of secondaryItems as CarouselItem[]) {
          const s = carouselToShow(item, contentMap);
          if (s) secondary.push(s);
        }
        setSecondaryShows(secondary);

        // Middle featured panel — uses pre-joined _content so any content (published or not) can appear
        const featured: Show[] = [];
        for (const item of featuredItems as any[]) {
          const raw = item._content;
          if (raw) {
            featured.push(toShow(raw));
          } else if (item.contentId) {
            // fallback: try published contentMap
            const s = contentMap.get(item.contentId);
            if (s) featured.push(s);
          }
        }
        setFeaturedShows(featured);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setActiveSlide(index);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % Math.max(bannerShows.length, 1));
  }, [bannerShows.length]);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + Math.max(bannerShows.length, 1)) % Math.max(bannerShows.length, 1));
  }, [bannerShows.length]);

  useEffect(() => {
    if (bannerShows.length === 0) return;
    timerRef.current = setInterval(nextSlide, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextSlide, bannerShows.length]);

  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextSlide, 5000);
  };

  const handleGoToSlide = (i: number) => { goToSlide(i); restartTimer(); };
  const handlePrev = () => { prevSlide(); restartTimer(); };
  const handleNext = () => { nextSlide(); restartTimer(); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const currentIdx = bannerShows.length > 0 ? Math.min(activeSlide, bannerShows.length - 1) : 0;
  const currentShow = bannerShows[currentIdx];
  const midFallback = bannerShows.filter((_, i) => i !== currentIdx);
  const midPanel = featuredShows.length > 0
    ? featuredShows
    : midFallback.length > 0
      ? midFallback
      : shows.slice(0, 6);
  const sideShows = midPanel.slice(0, 2);
  const miniShows = midPanel.slice(2, 6);

  const movies = shows.filter(s => s.type === "movie");
  const series = shows.filter(s => s.type === "series");
  const byGenre = (g: string) => shows.filter(s => (s.genre || "").toLowerCase().includes(g));

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff" }}>
      <div className="mobile-header-spacer" style={{ height: 54 }} />

      {bannerShows.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "rgba(255,255,255,0.3)", fontSize: 15 }}>
          No content published yet. Add content from the admin panel.
        </div>
      ) : (
        <div className="carousel-wrapper" style={{ display: "flex", gap: 8, padding: "10px 12px", boxSizing: "border-box" }}>
          <div className="carousel-main-wrap" style={{ flex: "0 0 48%", position: "relative", minWidth: 0 }}>
            <div className="carousel-mobile-full" style={{ width: "100%", position: "relative", overflow: "hidden", borderRadius: 6, background: "#1a1a1a" }}>
              <div style={{ paddingTop: "56.25%" }} />
              <img
                key={currentShow.id}
                src={currentShow.thumbnailUrl}
                alt={currentShow.title}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  opacity: isTransitioning ? 0.7 : 1, transition: "opacity 0.4s ease",
                }}
              />

              <div className="carousel-overlay" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 20px 20px" }}>
                {currentShow.badge && currentShow.badge !== "none" && (
                  <span style={{
                    display: "inline-block", padding: "1px 8px", borderRadius: 2, fontSize: 11, fontWeight: 700, marginBottom: 8,
                    background: currentShow.badge === "VIP" ? "linear-gradient(90deg,#ffc552,#ffdd9a)" : currentShow.badge === "Express" ? "linear-gradient(90deg,#00a3f5,#00c9fd)" : "linear-gradient(90deg,#8819ff,#ad61ff)",
                    color: currentShow.badge === "VIP" ? "#4e2d03" : "#fff",
                  }}>{currentShow.badge}</span>
                )}
                <h2 className="carousel-title" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 6, textShadow: "0 1px 4px rgba(0,0,0,0.8)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {currentShow.title}
                </h2>
                <p className="carousel-desc" style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 12, maxWidth: 380 }}>
                  {currentShow.description}
                </p>
                <div className="carousel-actions" style={{ display: "flex", gap: 8 }}>
                  <Link href={`/play/${currentShow.id}`}>
                    <button className="carousel-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 20, background: "#00a9f5", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                      ▶ PLAY NOW
                    </button>
                  </Link>
                  <Link href={`/play/${currentShow.id}`}>
                    <button className="carousel-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 20, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, fontWeight: 500, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
                      DETAILS
                    </button>
                  </Link>
                </div>
              </div>

              <button onClick={handlePrev} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNext} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ChevronRight size={16} />
              </button>

              <div style={{ position: "absolute", bottom: 8, right: 12, display: "flex", gap: 4 }}>
                {bannerShows.map((_, i) => (
                  <button key={i} onClick={() => handleGoToSlide(i)} style={{ height: 3, width: i === currentIdx ? 20 : 6, borderRadius: 2, background: i === currentIdx ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
                ))}
              </div>
            </div>
          </div>

          <div className="carousel-side-panel" style={{ flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "0 0 auto" }}>
              {sideShows.map((show) => <SideShowCard key={show.id} show={show} />)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {miniShows.map((show) => <MiniShowCard key={show.id} show={show} />)}
            </div>
          </div>

          <SecondaryCarousel shows={secondaryShows} />
        </div>
      )}

      <div style={{ padding: "8px 12px 40px" }}>
        <ContinueWatching />
        <SmartRecommender allShows={shows} />
        {shows.length > 0 && (
          <ContentRow title="ALL CONTENT" subtitle="RECENTLY ADDED" shows={shows} />
        )}
        {shows.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
            No content available yet. The admin can add content from the admin panel.
          </div>
        )}
      </div>
    </div>
  );
}

function SideShowCard({ show }: { show: Show }) {
  return (
    <Link href={`/play/${show.id}`}>
      <div onClick={() => saveLastClickedShow(show)} style={{ position: "relative", borderRadius: 6, overflow: "hidden", background: "#1a1a1a", cursor: "pointer" }}>
        <div style={{ paddingTop: "56.25%" }} />
        <img src={show.thumbnailUrl} alt={show.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
        {show.badge && show.badge !== "none" && (
          <span style={{ position: "absolute", top: 0, right: 0, padding: "2px 7px", borderRadius: "0 6px 0 6px", fontSize: 11, fontWeight: 700, background: show.badge === "VIP" ? "linear-gradient(90deg,#ffc552,#ffdd9a)" : show.badge === "Express" ? "linear-gradient(90deg,#00a3f5,#00c9fd)" : "linear-gradient(90deg,#8819ff,#ad61ff)", color: show.badge === "VIP" ? "#4e2d03" : "#fff" }}>
            {show.badge}
          </span>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{show.title}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{show.type === "series" ? `${show.episodeCount} EPS` : "Movie"}</div>
        </div>
      </div>
    </Link>
  );
}

function MiniShowCard({ show }: { show: Show }) {
  return (
    <Link href={`/play/${show.id}`}>
      <div
        onClick={() => saveLastClickedShow(show)}
        style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 6px", borderRadius: 4, cursor: "pointer", transition: "background 0.2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div style={{ flexShrink: 0, width: 64, height: 42, borderRadius: 3, overflow: "hidden", background: "#1a1a1a" }}>
          <img src={show.thumbnailUrl} alt={show.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "rgba(255,255,255,0.9)" }}>{show.title}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{show.genre} · {show.type === "series" ? `${show.episodeCount} EPS` : "Movie"}</div>
        </div>
        {show.badge && show.badge !== "none" && (
          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 2, background: show.badge === "VIP" ? "linear-gradient(90deg,#ffc552,#ffdd9a)" : "linear-gradient(90deg,#00a3f5,#00c9fd)", color: show.badge === "VIP" ? "#4e2d03" : "#fff" }}>
            {show.badge}
          </span>
        )}
      </div>
    </Link>
  );
}

function SecondaryCarousel({ shows }: { shows: Show[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const timer2 = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setActiveIdx(prev => (prev + 1) % Math.max(shows.length, 1));
      setFading(false);
    }, 300);
  }, [shows.length]);

  useEffect(() => {
    if (shows.length === 0) return;
    const init = setTimeout(() => {
      timer2.current = setInterval(goNext, 5000);
    }, 2500);
    return () => {
      clearTimeout(init);
      if (timer2.current) clearInterval(timer2.current);
    };
  }, [goNext, shows.length]);

  if (shows.length === 0) return null;
  const current = shows[Math.min(activeIdx, shows.length - 1)];

  return (
    <div className="secondary-carousel" style={{ flex: 1, minWidth: 0, position: "relative", borderRadius: 6, overflow: "hidden", background: "#1a1a1a" }}>
      <div style={{ paddingTop: "56.25%" }} />
      <img
        key={current.id}
        src={current.thumbnailUrl}
        alt={current.title}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: fading ? 0.5 : 1, transition: "opacity 0.3s ease",
        }}
      />


      <button
        onClick={() => { setActiveIdx(prev => (prev - 1 + shows.length) % shows.length); if (timer2.current) { clearInterval(timer2.current); timer2.current = setInterval(goNext, 5000); } }}
        style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <ChevronLeft size={14} />
      </button>
      <button
        onClick={() => { goNext(); if (timer2.current) { clearInterval(timer2.current); timer2.current = setInterval(goNext, 5000); } }}
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <ChevronRight size={14} />
      </button>

      <div style={{ position: "absolute", bottom: 10, right: 12, display: "flex", gap: 3 }}>
        {shows.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            style={{ height: 3, width: i === activeIdx ? 16 : 5, borderRadius: 2, background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }}
          />
        ))}
      </div>
    </div>
  );
}

function ContentRow({ title, subtitle, shows }: { title: string; subtitle?: string; shows: Show[]; categoryHref?: string }) {
  if (!shows.length) return null;

  return (
    <section className="content-row-section" style={{ marginBottom: 24 }}>
      <div className="content-row-header" style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ display: "inline-block", width: 3, height: 14, borderRadius: 2, background: "#00a9f5", marginRight: 8 }} />
        <span className="content-row-title" style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</span>
        {subtitle && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>{subtitle}</span>}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>{shows.length} TITLES</span>
      </div>
      <div className="content-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
        {shows.map((show, idx) => <ContentCard key={show.id} show={show} rank={idx + 1} />)}
      </div>
    </section>
  );
}

function getLastClickedShow(): { id: string; title: string; genre: string; type: string } | null {
  try {
    const raw = localStorage.getItem("lf_last_clicked_show");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLastClickedShow(show: { id: string; title: string; genre?: string; type?: string }) {
  try {
    localStorage.setItem("lf_last_clicked_show", JSON.stringify({
      id: show.id,
      title: show.title,
      genre: show.genre || "",
      type: show.type || "",
    }));
  } catch {}
}

function buildRecs(allShows: Show[], sourceId: string, sourceGenre: string, sourceType: string): Show[] {
  const genres = sourceGenre.toLowerCase().split(/[·,]/).map((g: string) => g.trim()).filter(Boolean);
  let recs = allShows.filter(s => {
    if (s.id === sourceId) return false;
    const sg = (s.genre || "").toLowerCase();
    return genres.some((g: string) => g && sg.includes(g));
  });
  if (recs.length < 4) {
    const typeRecs = allShows.filter(s => s.id !== sourceId && s.type === sourceType && !recs.find(r => r.id === s.id));
    recs = [...recs, ...typeRecs];
  }
  return recs.sort(() => Math.random() - 0.5).slice(0, 12);
}

function SmartRecommender({ allShows }: { allShows: Show[] }) {
  const [recShows, setRecShows] = useState<Show[]>([]);
  const [basedOn, setBasedOn] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allShows.length === 0) return;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const history = await fbApi.userActions.getHistory(user.uid);
          if (history.length) {
            const last = history[0];
            const watchedId: string = last.contentId;
            const watchedShow = allShows.find(s => s.id === watchedId);
            const recs = buildRecs(allShows, watchedId, watchedShow?.genre || "", watchedShow?.type || "");
            if (recs.length > 0) {
              setRecShows(recs);
              setBasedOn(last.contentTitle || watchedShow?.title || "your last watch");
              return;
            }
          }
        }
        const clicked = getLastClickedShow();
        if (clicked) {
          const clickedShow = allShows.find(s => s.id === clicked.id) || clicked;
          const recs = buildRecs(allShows, clicked.id, (clickedShow as any).genre || clicked.genre, (clickedShow as any).type || clicked.type);
          if (recs.length > 0) {
            setRecShows(recs);
            setBasedOn(clicked.title);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [allShows]);

  if (loading || recShows.length === 0) return null;

  return (
    <SmartRecommenderRow title={basedOn} shows={recShows} />
  );
}

function SmartRecommenderRow({ title, shows }: { title: string; shows: Show[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <section className="content-row-section" style={{ marginBottom: 28 }}>
      <div className="content-row-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            flexShrink: 0, marginTop: 2,
            width: 26, height: 26, borderRadius: "50%",
            background: "linear-gradient(135deg,#a855f7,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 10px rgba(168,85,247,0.5)",
          }}>
            <Sparkles size={13} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
              BECAUSE YOU WATCHED
            </div>
            <div className="content-row-title" style={{ fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {title}
            </div>
          </div>
        </div>
        <div className="content-row-nav" style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginTop: 4 }}>
          <button onClick={() => scroll("left")} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={12} />
          </button>
          <button onClick={() => scroll("right")} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="content-row-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", paddingBottom: 4 }}>
        {shows.map((show, idx) => <ContentCard key={show.id} show={show} rank={idx + 1} />)}
      </div>
    </section>
  );
}

function ContentCard({ show, rank }: { show: Show; rank: number }) {
  const [hovered, setHovered] = useState(false);
  function handleClick() {
    saveLastClickedShow(show);
    const cu = auth.currentUser;
    fbApi.activities.log({
      userId: cu?.uid || null,
      userName: cu?.displayName || null,
      userEmail: cu?.email || null,
      actionType: "content_click",
      contentId: show.id,
      contentTitle: show.title,
      page: "/",
    }).catch(() => {});
  }
  return (
    <Link href={`/play/${show.id}`}>
      <div className="content-card" style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={handleClick}>
        <div style={{ position: "relative", paddingTop: "133.33%", borderRadius: 5, overflow: "hidden", background: "#1a1a1a" }}>
          <img src={show.thumbnailUrl} alt={show.title} loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.35s ease" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 44, backgroundImage: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55))" }} />
          {show.badge && show.badge !== "none" && (
            <span style={{
              position: "absolute", top: 0, right: 0, height: 16, lineHeight: "16px", padding: "0 5px",
              borderRadius: "0 5px 0 5px", fontSize: 10, fontWeight: 700,
              background: show.badge === "VIP" ? "linear-gradient(45deg,#ffc552,#ffdd9a)" : show.badge === "Express" ? "linear-gradient(45deg,#00a3f5,#00c9fd)" : "linear-gradient(45deg,#8819ff,#ad61ff)",
              color: show.badge === "VIP" ? "#4e2d03" : "#fff",
            }}>{show.badge}</span>
          )}
          {rank <= 3 && (
            <span style={{ position: "absolute", bottom: 5, left: 5, fontSize: 20, fontWeight: 900, color: rank === 1 ? "#ffc552" : rank === 2 ? "#c0c0c0" : "#cd7f32", lineHeight: 1, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{rank}</span>
          )}
        </div>
        <div style={{ paddingTop: 5, paddingBottom: 3 }}>
          <div className="content-card-title" style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: hovered ? "#00a9f5" : "rgba(255,255,255,0.9)", transition: "color 0.2s" }}>
            {show.title}
          </div>
          <div className="content-card-sub" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
            {show.type === "series" ? `${show.episodeCount} EPS` : "Movie"}
          </div>
        </div>
      </div>
    </Link>
  );
}
