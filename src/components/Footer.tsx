import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import VIPModal from "./VIPModal";
import AuthModal from "./AuthModal";

const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 192 192" fill="currentColor">
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.642 32.788 28.08 19.882 44.485 13.224 67.315 13.001 95.932L13 96v.068c.224 28.617 6.882 51.447 19.788 67.852 14.504 18.438 36.094 27.885 64.199 28.08h.113c24.999-.172 42.557-6.72 57.256-21.399 19.636-19.607 19.025-44.094 12.565-59.132-4.577-10.68-13.451-19.267-25.384-24.481Z"/>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showVIP, setShowVIP] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  function handleAccountLink(href: string, requiresVIP = false) {
    if (requiresVIP) {
      setShowVIP(true);
      return;
    }
    if (!user) {
      setShowAuth(true);
      return;
    }
    navigate(href);
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://images.dmca.com/Badges/DMCABadgeHelper.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
    <footer style={{
      background: "#080808",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.55)",
      fontSize: 13,
      marginTop: 40,
    }}>
      <div style={{ padding: "40px 20px 0" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 36, marginBottom: 36 }}>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <img src="/logo.png" alt="LUOFILM" style={{ height: 28, objectFit: "contain" }} />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>LUOFILM</span>
            </div>
            <p style={{ lineHeight: 1.7, fontSize: 12, marginBottom: 10 }}>
              Download and stream Luo translated movies and drama translated by <strong style={{ color: "rgba(255,255,255,0.8)" }}>VJ Paul UG</strong>.
            </p>
            <p style={{ lineHeight: 1.7, fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
              LUOFILM.SITE is owned by <strong style={{ color: "rgba(255,255,255,0.55)" }}>NEXUS PLATFORM</strong> under the management of <strong style={{ color: "rgba(255,255,255,0.55)" }}>GILBERT PAUL</strong>, licensed under <strong style={{ color: "rgba(255,255,255,0.55)" }}>AT DEVELOPERS SMC LIMITED</strong> — a professionally licensed & verified streaming platform by DMCA, operating worldwide.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { icon: <YoutubeIcon />, label: "YouTube", href: "https://www.youtube.com/@luofilm_site" },
                { icon: <InstagramIcon />, label: "Instagram", href: "https://instagram.com/luofilm_site" },
                { icon: <TikTokIcon />, label: "TikTok", href: "https://tiktok.com/@user6175682815552?lang=en" },
                { icon: <LinkedInIcon />, label: "LinkedIn", href: "https://linkedin.com/in/luo-film-601637402" },
                { icon: <ThreadsIcon />, label: "Threads", href: "https://www.threads.com/@luofilm_site" },
              ].map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.6)",
                    transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(204,0,204,0.25)";
                    (e.currentTarget as HTMLElement).style.color = "#cc00cc";
                    (e.currentTarget as HTMLElement).style.borderColor = "#cc00cc";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Browse</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { label: "Home", href: "/" },
                { label: "Drama", href: "/drama" },
                { label: "Movies", href: "/movie" },
                { label: "Variety", href: "/variety" },
                { label: "Anime", href: "/anime" },
                { label: "Sports", href: "/sports" },
                { label: "Documentary", href: "/documentary" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}>
                    <span style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc00cc"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"}
                    >{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Account</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { label: "My Profile", href: "/profile", vip: false },
                { label: "Watch History", href: "/history", vip: false },
                { label: "My Watchlist", href: "/watchlist", vip: false },
                { label: "Downloads", href: "/downloads", vip: false },
                { label: "Join VIP", href: "/profile", vip: true },
              ].map(({ label, href, vip }) => (
                <li key={label}>
                  <span
                    onClick={() => handleAccountLink(href, vip)}
                    style={{ color: vip ? "#ffc552" : "rgba(255,255,255,0.55)", textDecoration: "none", cursor: "pointer", transition: "color 0.2s", fontWeight: vip ? 700 : 400 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = vip ? "#ffdd9a" : "#cc00cc"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = vip ? "#ffc552" : "rgba(255,255,255,0.55)"}
                  >{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Legal</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "DMCA / Copyright", href: "/dmca" },
                { label: "Content Guidelines", href: "/guidelines" },
                { label: "Contact Us", href: "/contact" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}>
                    <span style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc00cc"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"}
                    >{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Contact Us</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="https://wa.me/256760734679"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", textDecoration: "none", color: "#25d166", fontSize: 12, fontWeight: 600 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp: +256 760 734 679
              </a>
              <a
                href="mailto:mainplatform.nexus@gmail.com"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                mainplatform.nexus@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "18px 0 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12 }}>
            <p style={{ margin: 0, marginBottom: 4 }}>
              &copy; {currentYear} <strong style={{ color: "rgba(255,255,255,0.8)" }}>LUOFILM.SITE</strong>. All rights reserved.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              All content, trademarks, and media are the property of their respective owners. LUOFILM.SITE is a streaming platform and does not claim ownership of third-party content. Unauthorized reproduction or distribution is strictly prohibited.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
              { label: "Cookies", href: "/cookies" },
              { label: "DMCA", href: "/dmca" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#cc00cc"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"}
                >{label}</span>
              </Link>
            ))}
            <a
              href="//www.dmca.com/Protection/Status.aspx?ID=88b14385-d10d-46b3-9185-6dda694e3541"
              title="DMCA.com Protection Status"
              className="dmca-badge"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <img
                src="https://images.dmca.com/Badges/DMCA_logo-grn-btn100w.png?ID=88b14385-d10d-46b3-9185-6dda694e3541"
                alt="DMCA.com Protection Status"
                style={{ height: 28, width: "auto", display: "block" }}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>

    {showVIP && <VIPModal onClose={() => setShowVIP(false)} onOpenAuth={() => { setShowVIP(false); setShowAuth(true); }} />}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
  </>
  );
}
