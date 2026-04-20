import { useSEO } from "../hooks/useSEO";

const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default function ContactPage() {
  useSEO({ title: "Contact Us — LUOFILM.SITE", description: "Contact LUOFILM.SITE — reach us on WhatsApp +256 760 734 679 or email mainplatform.nexus@gmail.com for support, DMCA notices and business inquiries.", url: "/contact" });
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", padding: "30px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Contact Us</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>We're here to help. Reach out through any of the channels below.</p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "22px 20px", marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About LUOFILM.SITE</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.8 }}>
            LUOFILM.SITE is owned by <strong style={{ color: "#fff" }}>NEXUS PLATFORM</strong> under the management of <strong style={{ color: "#fff" }}>GILBERT PAUL</strong>, licensed under <strong style={{ color: "#fff" }}>AT DEVELOPERS SMC LIMITED</strong>. We are a professionally licensed and verified streaming platform by DMCA, operating worldwide — bringing you Luo translated movies and dramas translated by <strong style={{ color: "#fff" }}>VJ Paul UG</strong>.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
          <div style={{ background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10, padding: "20px 18px" }}>
            <div style={{ color: "#25d166", marginBottom: 10 }}><WhatsAppIcon /></div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>WhatsApp</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>Chat with us directly on WhatsApp for fast support.</p>
            <a
              href="https://wa.me/256760734679"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#25d166", fontSize: 14, textDecoration: "none", fontWeight: 700 }}
            >
              +256 760 734 679
            </a>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 18px" }}>
            <div style={{ color: "#cc00cc", marginBottom: 10 }}><EmailIcon /></div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Email</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>Send us an email for all inquiries and support requests.</p>
            <a
              href="mailto:mainplatform.nexus@gmail.com"
              style={{ color: "#cc00cc", fontSize: 13, textDecoration: "none", fontWeight: 600 }}
            >
              mainplatform.nexus@gmail.com
            </a>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 18px" }}>
            <div style={{ color: "rgba(255,255,255,0.6)", marginBottom: 10 }}><ShieldIcon /></div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>DMCA / Copyright</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 12 }}>For copyright infringement reports and DMCA notices.</p>
            <a
              href="mailto:mainplatform.nexus@gmail.com"
              style={{ color: "#cc00cc", fontSize: 13, textDecoration: "none", fontWeight: 600 }}
            >
              mainplatform.nexus@gmail.com
            </a>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "20px 22px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Response Times</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7 }}>
            Our support team typically responds within <strong style={{ color: "#fff" }}>24–48 hours</strong> for general inquiries. For urgent issues, WhatsApp is the fastest way to reach us. DMCA and legal matters are addressed within <strong style={{ color: "#fff" }}>3–5 business days</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
