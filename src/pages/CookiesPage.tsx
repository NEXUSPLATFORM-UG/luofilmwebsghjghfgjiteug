import { useSEO } from "../hooks/useSEO";

export default function CookiesPage() {
  useSEO({ title: "Cookie Policy", description: "Learn how LUOFILM.SITE uses cookies on our Luo translated movies and drama streaming platform.", url: "/cookies" });
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", padding: "30px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Cookie Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>Last updated: January 1, 2025</p>

        {[
          {
            title: "What Are Cookies?",
            body: `Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They allow the website to recognize your device and remember certain information about your preferences or past actions.`,
          },
          {
            title: "How We Use Cookies",
            body: `LUOFILM.SITE uses cookies to: keep you signed in to your account; remember your preferences and settings; understand how you use our Service; improve the performance and functionality of our platform; deliver personalized content recommendations; analyze traffic and usage patterns.`,
          },
          {
            title: "Types of Cookies We Use",
            body: `Essential Cookies: These are required for the Service to function properly and cannot be disabled. They include session cookies for authentication and security. Performance Cookies: These help us understand how visitors interact with our Service by collecting anonymous analytics data. Functionality Cookies: These remember your preferences such as language, video quality settings, and playback preferences. Targeting/Advertising Cookies: These may be used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.`,
          },
          {
            title: "Third-Party Cookies",
            body: `We may use third-party service providers who also set cookies on our Service, such as analytics providers (e.g., Google Analytics) and payment processors. These third parties have their own privacy and cookie policies, which we encourage you to review.`,
          },
          {
            title: "Managing Cookies",
            body: `You can control and manage cookies in several ways. Most browsers allow you to view, delete, and block cookies through their settings. Please note that blocking cookies may affect the functionality of our Service, including your ability to stay logged in or access certain features.`,
          },
          {
            title: "Cookie Retention",
            body: `Session cookies are temporary and are deleted when you close your browser. Persistent cookies remain on your device for a set period (usually between 30 days and 2 years) or until you delete them.`,
          },
          {
            title: "Updates to This Policy",
            body: `We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.`,
          },
          {
            title: "Contact Us",
            body: `If you have questions about our use of cookies, please contact us at: mainplatform.nexus@gmail.com or via WhatsApp: +256 760 734 679`,
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{title}</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, fontSize: 14 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
