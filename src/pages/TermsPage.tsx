import { useSEO } from "../hooks/useSEO";

export default function TermsPage() {
  useSEO({ title: "Terms of Service", description: "Read the LUOFILM.SITE Terms of Service — the rules governing your use of our Luo translated movies and drama streaming platform.", url: "/terms", noIndex: false });
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", padding: "30px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Terms of Service</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>Last updated: January 1, 2025</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: `By accessing or using LUOFILM.SITE ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, users, and others who access the Service.`,
          },
          {
            title: "2. Use of the Service",
            body: `You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service in any way that violates applicable laws or regulations, to transmit any unsolicited or unauthorized advertising material, to impersonate any person or entity, or to engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.`,
          },
          {
            title: "3. User Accounts",
            body: `When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your account password and for any activities or actions under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.`,
          },
          {
            title: "4. Subscription and Payments",
            body: `Some features of the Service require a paid subscription (VIP). By subscribing, you authorize us to charge your payment method on a recurring basis. All payments are non-refundable unless otherwise required by applicable law. We reserve the right to change subscription fees at any time with prior notice.`,
          },
          {
            title: "5. Content and Intellectual Property",
            body: `All content available on LUOFILM.SITE, including but not limited to videos, images, text, graphics, logos, and software, is the property of LUOFILM.SITE or its content suppliers and is protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without our express written permission.`,
          },
          {
            title: "6. User-Generated Content",
            body: `By submitting content to the Service, you grant LUOFILM.SITE a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such content. You represent and warrant that you have the right to grant this license.`,
          },
          {
            title: "7. Prohibited Activities",
            body: `You agree not to: (a) use automated scripts to collect information from the Service; (b) attempt to gain unauthorized access to any portion of the Service; (c) use the Service to distribute malware or harmful code; (d) engage in any activity that interferes with or disrupts the Service; (e) circumvent any content protection measures.`,
          },
          {
            title: "8. Disclaimer of Warranties",
            body: `The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.`,
          },
          {
            title: "9. Limitation of Liability",
            body: `To the fullest extent permitted by law, LUOFILM.SITE shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, or goodwill, arising out of or in connection with your use of the Service.`,
          },
          {
            title: "10. Termination",
            body: `We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease.`,
          },
          {
            title: "11. Governing Law",
            body: `These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms shall be resolved through binding arbitration or in a court of competent jurisdiction.`,
          },
          {
            title: "12. Changes to Terms",
            body: `We reserve the right to modify these Terms at any time. We will notify you of significant changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes your acceptance of the new Terms.`,
          },
          {
            title: "13. Contact Us",
            body: `If you have any questions about these Terms of Service, please contact us at: mainplatform.nexus@gmail.com or via WhatsApp: +256 760 734 679`,
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
