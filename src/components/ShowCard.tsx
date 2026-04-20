import { Link } from "wouter";
import type { Show } from "../data/shows";
import { fbApi } from "../lib/firebaseApi";
import { auth } from "../lib/firebase";

const BADGE_STYLES: Record<string, { background: string; color: string; label: string }> = {
  VIP: {
    background: "linear-gradient(45deg,#ffc552,#ffdd9a)",
    color: "#4e2d03",
    label: "VIP",
  },
  Express: {
    background: "linear-gradient(45deg,#00a3f5,#00c9fd)",
    color: "#fff",
    label: "Express",
  },
  Exclusive: {
    background: "linear-gradient(45deg,#8819ff,#ad61ff)",
    color: "#fff",
    label: "Exclusive",
  },
};

interface ShowCardProps {
  show: Show;
}

function logContentClick(show: Show) {
  const u = auth.currentUser;
  fbApi.activities.log({
    userId: u?.uid || null,
    userName: u?.displayName || null,
    userEmail: u?.email || null,
    actionType: "content_click",
    contentId: show.id,
    contentTitle: show.title,
    page: window.location.pathname,
  }).catch(() => {});
}

export default function ShowCard({ show }: ShowCardProps) {
  const badge = show.badge !== "none" ? BADGE_STYLES[show.badge] : null;

  return (
    <Link href={`/play/${show.id}`}>
      <div className="pack-card group cursor-pointer" onClick={() => logContentClick(show)}>
        <div
          className="pack-cover"
          style={{
            position: "relative",
            paddingTop: "133.33%",
            borderRadius: 10,
            background: "#25252b",
            overflow: "hidden",
          }}
        >
          <img
            src={show.thumbnailUrl}
            alt={show.title}
            loading="lazy"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            className="group-hover:scale-105"
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: 50,
              backgroundImage:
                "linear-gradient(180deg,transparent,rgba(0,0,0,.35) 60%,rgba(0,0,0,.55))",
              borderRadius: "0 0 4px 4px",
              zIndex: 10,
            }}
          />
          {badge && (
            <span
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                zIndex: 15,
                height: 18,
                lineHeight: "18px",
                padding: "1px 6px",
                borderRadius: "0 10px 0 10px",
                background: badge.background,
                color: badge.color,
                fontSize: 12,
                fontWeight: 700,
                display: "block",
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
        <div
          style={{
            paddingTop: 9,
            color: "rgba(255,255,255,0.87)",
            overflow: "hidden",
            maxHeight: 44,
          }}
        >
          <div
            style={{
              color: "#fff",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "22px",
            }}
            className="group-hover:text-[#00a9f5] transition-colors"
            title={show.title}
          >
            {show.title}
          </div>
        </div>
      </div>
    </Link>
  );
}
