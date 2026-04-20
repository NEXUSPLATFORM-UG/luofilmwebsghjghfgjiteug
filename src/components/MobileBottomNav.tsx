import { Link, useLocation } from "wouter";

function HomeIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L2 12h3v8a1 1 0 0 0 1 1h5v-6h2v6h5a1 1 0 0 0 1-1v-8h3L12 3z" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DramaIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function MovieIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" stroke="#0e0e0e" strokeWidth="1.5"/>
      <line x1="17" y1="2" x2="17" y2="22" stroke="#0e0e0e" strokeWidth="1.5"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="#0e0e0e" strokeWidth="1.5"/>
      <line x1="2" y1="7" x2="7" y2="7" stroke="#0e0e0e" strokeWidth="1.5"/>
      <line x1="2" y1="17" x2="7" y2="17" stroke="#0e0e0e" strokeWidth="1.5"/>
      <line x1="17" y1="17" x2="22" y2="17" stroke="#0e0e0e" strokeWidth="1.5"/>
      <line x1="17" y1="7" x2="22" y2="7" stroke="#0e0e0e" strokeWidth="1.5"/>
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function VarietyIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" fill="none" stroke="#0e0e0e" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="1" fill="#0e0e0e"/>
      <circle cx="15" cy="9" r="1" fill="#0e0e0e"/>
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function AnimeIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ) : (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const navItems = [
  { label: "Home",    path: "/",        Icon: HomeIcon },
  { label: "Drama",   path: "/drama",   Icon: DramaIcon },
  { label: "Movies",  path: "/movie",   Icon: MovieIcon },
  { label: "Variety", path: "/variety", Icon: VarietyIcon },
  { label: "Anime",   path: "/anime",   Icon: AnimeIcon },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
        return (
          <Link key={item.path} href={item.path}>
            <div className="nav-item-holder">
              <div className={`nav-icon-wrap ${isActive ? "nav-icon-active" : ""}`}>
                <div className={`nav-icon-inner ${isActive ? "nav-icon-inner-active" : ""}`}>
                  <item.Icon active={isActive} />
                </div>
                {isActive && <span className="nav-active-dot" />}
              </div>
              <span className={`nav-label ${isActive ? "nav-label-active" : ""}`}>
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
