import { useSEO } from "../hooks/useSEO";

export default function PrivacyPage() {
  useSEO({ title: "Privacy Policy", description: "LUOFILM.SITE Privacy Policy — how we collect, use and protect your data on our Luo translated movies streaming platform.", url: "/privacy" });
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", padding: "30px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>Last updated: January 1, 2025</p>

        {[
          {
            title: "1. Introduction",
            body: `LUOFILM.SITE ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our streaming service. Please read this policy carefully.`,
          },
          {
            title: "2. Information We Collect",
            body: `We collect information you provide directly to us, such as when you create an account (name, email address, password), subscribe to a plan (payment information), or contact support. We also automatically collect certain information when you use the Service, including your IP address, browser type, device identifiers, watch history, search queries, and usage data.`,
          },
          {
            title: "3. How We Use Your Information",
            body: `We use the information we collect to: provide and maintain the Service; process transactions and send related information; send promotional communications (with your consent); respond to comments and questions; analyze usage patterns to improve the Service; detect and prevent fraudulent activity; comply with legal obligations.`,
          },
          {
            title: "4. Cookies and Tracking Technologies",
            body: `We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. See our Cookie Policy for more details.`,
          },
          {
            title: "5. Information Sharing",
            body: `We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except: to service providers who assist us in operating the Service; when required by law or to protect our rights; in connection with a merger, acquisition, or sale of assets; with your explicit consent.`,
          },
          {
            title: "6. Data Retention",
            body: `We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and personal data at any time by contacting us. We will respond to deletion requests within 30 days.`,
          },
          {
            title: "7. Data Security",
            body: `We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.`,
          },
          {
            title: "8. Children's Privacy",
            body: `Our Service is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you become aware that a child has provided us with personal data, please contact us immediately.`,
          },
          {
            title: "9. Your Rights",
            body: `Depending on your location, you may have rights regarding your personal data, including: the right to access your data; the right to correct inaccurate data; the right to request deletion; the right to object to processing; the right to data portability. To exercise these rights, please contact us at mainplatform.nexus@gmail.com or via WhatsApp: +256 760 734 679.`,
          },
          {
            title: "10. International Transfers",
            body: `Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and that appropriate safeguards are in place.`,
          },
          {
            title: "11. Changes to This Policy",
            body: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.`,
          },
          {
            title: "12. Contact Us",
            body: `If you have any questions about this Privacy Policy, please contact our Data Protection team at: mainplatform.nexus@gmail.com or via WhatsApp: +256 760 734 679`,
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
