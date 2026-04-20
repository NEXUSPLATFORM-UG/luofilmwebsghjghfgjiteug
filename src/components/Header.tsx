import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User, Clock, Bookmark, Download, LogOut, Smartphone } from "lucide-react";
import VIPModal from "./VIPModal";
import AuthModal from "./AuthModal";
import DownloadAppModal from "./DownloadAppModal";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_EMAILS = ["mainplatform.nexus@gmail.com"];

const navLinks = [
  { label: "HOME", path: "/" },
  { label: "DRAMA", path: "/drama" },
  { label: "MOVIE", path: "/movie" },
  { label: "VARIETY", path: "/variety" },
  { label: "SPORTS", path: "/sports" },
  { label: "DOCUMENTARY", path: "/documentary" },
  { label: "ANIME", path: "/anime" },
];

export default function Header() {
  const [location, navigate] = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showVIP, setShowVIP] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowDownloadModal(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const { user, profile, logout } = useAuth();

  async function handleLogout() {
    await logout();
    setShowUserMenu(false);
  }

  function doSearch(val: string) {
    const q = val.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearchValue("");
    setMobileSearchOpen(false);
  }

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 54,
          background: "#0e0e0e",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          padding: "0 clamp(12px, 2vw, 40px)",
          gap: 0,
          boxSizing: "border-box",
        }}
      >
        {mobileSearchOpen ? (
          /* Mobile search mode */
          <>
            <button
              onClick={() => { setMobileSearchOpen(false); setSearchValue(""); }}
              className="mobile-only"
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.6)",
                cursor: "pointer", padding: "0 8px 0 0", flexShrink: 0, display: "flex", alignItems: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", height: 36,
              background: "rgba(255,255,255,0.07)", borderRadius: 18,
              border: "1px solid rgba(0,169,245,0.5)", padding: "0 12px", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,169,245,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doSearch(searchValue); }}
                placeholder="Search shows, movies..."
                style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, width: "100%" }}
              />
              {searchValue && (
                <button onClick={() => setSearchValue("")}
                  style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, display: "flex" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Logo */}
            <Link href="/">
              <div style={{ cursor: "pointer", userSelect: "none", flexShrink: 0, marginRight: 16, display: "flex", alignItems: "center", gap: 7 }}>
                <img src="/logo.png" alt="LUOFILM.SITE" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
                <div className="desktop-only" style={{ display: "block" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", color: "#cc00cc", lineHeight: 1.1, fontFamily: "Georgia, serif" }}>LUOFILM</div>
                  <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.4em", color: "rgba(255,255,255,0.5)", marginTop: 1 }}>.SITE</div>
                </div>
                <div className="mobile-only" style={{ display: "block" }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.06em", color: "#cc00cc", lineHeight: 1, fontFamily: "Georgia, serif" }}>LUOFILM</div>
                  <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.35em", color: "rgba(255,255,255,0.45)", marginTop: 1 }}>.SITE</div>
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 0, marginRight: 16 }}>
              {navLinks.map((link) => {
                const isActive = link.path === "/" ? location === "/" : location.startsWith(link.path);
                return (
                  <Link key={link.label} href={link.path}>
                    <span style={{
                      display: "block", padding: "0 12px", height: 54, lineHeight: "54px",
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                      borderBottom: isActive ? "2px solid #00a9f5" : "2px solid transparent",
                      cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", boxSizing: "border-box",
                    }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
                    >{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div style={{ flex: 1 }} />

            {/* Desktop search */}
            <div className="desktop-only" style={{
              display: "flex", alignItems: "center", width: 220, height: 32,
              background: "rgba(255,255,255,0.07)",
              border: searchFocused ? "1px solid rgba(0,169,245,0.7)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "0 10px", gap: 7, transition: "border 0.2s", boxSizing: "border-box",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={searchFocused ? "rgba(0,169,245,0.8)" : "rgba(255,255,255,0.35)"}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                onKeyDown={(e) => { if (e.key === "Enter") doSearch(searchValue); }}
                placeholder="SEARCH SHOWS, MOVIES..."
                style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 12, width: "100%" }} />
              {searchValue && (
                <button onClick={() => setSearchValue("")}
                  style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <a
              href="https://pub-4810ad32eae44d3db8b886164bf3650f.r2.dev/luofilm.apk"
              download="luofilm.apk"
              className="download-app-button header-download-app-button header-shine-step-1"
              style={{ cursor: "pointer", textDecoration: "none" }}
            >
              <span className="download-app-button-glow" />
              <span className="download-app-button-shine" />
              <span className="download-app-button-icon header-download-app-button-icon">
                <Smartphone size={14} />
              </span>
              <span className="download-app-button-copy">
                <span className="download-app-button-title header-download-app-button-title">Download App</span>
                <span className="download-app-button-subtitle header-download-app-button-subtitle">Android & iOS</span>
              </span>
              <Download className="download-app-button-arrow header-download-app-button-arrow" size={14} />
            </a>

            {/* Mobile search icon */}
            <button
              className="mobile-only"
              onClick={() => setMobileSearchOpen(true)}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.6)",
                cursor: "pointer", padding: "4px 6px", flexShrink: 0, display: "flex", alignItems: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* VIP button */}
            <button
              type="button"
              onClick={() => setShowVIP(true)}
              className="header-action-button header-vip-button header-shine-step-2"
            >
              <span className="download-app-button-glow" />
              <span className="download-app-button-shine" />
              <span className="header-action-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M2 19h20M3 19L5 9l4.5 4L12 4l2.5 9L19 9l2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="header-action-label"><span className="desktop-only" style={{ display: "inline" }}>JOIN </span>VIP</span>
            </button>

            {/* Admin link */}
            {user && ADMIN_EMAILS.includes(user.email || "") && (
              <Link href="/admin">
                <div className="desktop-only" style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "0 10px", height: 28, borderRadius: 6,
                  background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)",
                  color: "#818cf8", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                  letterSpacing: "0.05em", marginLeft: 4,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                  ADMIN
                </div>
              </Link>
            )}

            {/* User avatar / login */}
            {user ? (
              <div style={{ position: "relative", marginLeft: 6 }}>
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    width: 30, height: 30, borderRadius: "50%", overflow: "hidden",
                    background: "rgba(255,255,255,0.06)", border: "2px solid rgba(0,169,245,0.45)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 0, flexShrink: 0,
                  }}>
                  <img src={profile?.avatar || user.photoURL || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.uid}`}
                    alt={profile?.name || user.displayName || "User"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
                {showUserMenu && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 150 }} onClick={() => setShowUserMenu(false)} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, width: 190, zIndex: 160, overflow: "hidden",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                    }}>
                      <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", gap: 9 }}>
                        <img src={profile?.avatar || user.photoURL || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.uid}`}
                          alt={profile?.name || "User"}
                          style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid rgba(0,169,245,0.35)", flexShrink: 0, objectFit: "cover", background: "#1a1a1a" }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {profile?.name || user.displayName || "User"}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {profile?.email || user.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                      {[
                        { label: "My Profile", icon: <User size={13} />, href: "/profile" },
                        { label: "Watch History", icon: <Clock size={13} />, href: "/history" },
                        { label: "My Watchlist", icon: <Bookmark size={13} />, href: "/watchlist" },
                        { label: "Downloads", icon: <Download size={13} />, href: "/downloads" },
                      ].map(({ label, icon, href }) => (
                        <Link key={label} href={href}>
                          <div
                            onClick={() => setShowUserMenu(false)}
                            style={{
                              padding: "9px 14px", display: "flex", alignItems: "center", gap: 9,
                              color: "rgba(255,255,255,0.65)", fontSize: 12,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            {icon}{label}
                          </div>
                        </Link>
                      ))}
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                      <button onClick={handleLogout}
                        style={{
                          width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: 9,
                          background: "transparent", border: "none", color: "#ff6b6b", fontSize: 12,
                          cursor: "pointer", textAlign: "left",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,107,107,0.08)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <LogOut size={13} />Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="header-action-button header-login-button header-shine-step-3"
              >
                <span className="download-app-button-glow" />
                <span className="download-app-button-shine" />
                <span className="header-action-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="header-action-label">LOG IN</span>
              </button>
            )}
          </>
        )}
      </header>

      {showVIP && <VIPModal onClose={() => setShowVIP(false)} onOpenAuth={() => { setShowVIP(false); setShowAuth(true); }} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showDownloadModal && <DownloadAppModal onClose={() => setShowDownloadModal(false)} />}
    </>
  );
}

