import { useSEO } from "../hooks/useSEO";

export default function DmcaPage() {
  useSEO({ title: "DMCA & Copyright Policy", description: "LUOFILM.SITE DMCA and Copyright Policy. Report copyright infringement on our Luo translated movies platform.", url: "/dmca" });
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", padding: "30px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>DMCA / Copyright Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>Last updated: January 1, 2025</p>

        {[
          {
            title: "Our Commitment to Copyright",
            body: `LUOFILM.SITE respects the intellectual property rights of others and expects our users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and respond promptly to notices of alleged copyright infringement.`,
          },
          {
            title: "Reporting Copyright Infringement",
            body: `If you believe that content available on LUOFILM.SITE infringes your copyright, please send a written notice to our designated DMCA agent. Your notice must include: (1) a physical or electronic signature of the copyright owner or authorized agent; (2) identification of the copyrighted work claimed to be infringed; (3) identification of the material that is claimed to be infringing; (4) your contact information; (5) a statement that you have a good faith belief that use of the material is not authorized; (6) a statement that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner.`,
          },
          {
            title: "DMCA Agent Contact",
            body: `Send DMCA notices to our designated agent at: mainplatform.nexus@gmail.com. Please include "DMCA Notice" in the subject line. You may also reach us via WhatsApp: +256 760 734 679. We will review and respond to valid DMCA notices within 3–5 business days.`,
          },
          {
            title: "Counter-Notification",
            body: `If you believe your content was removed in error, you may submit a counter-notification. Your counter-notification must include: your physical or electronic signature; identification of the removed material and its location before removal; a statement under penalty of perjury that the material was removed by mistake or misidentification; your name, address, and telephone number; a statement consenting to the jurisdiction of the Federal District Court.`,
          },
          {
            title: "Repeat Infringer Policy",
            body: `In accordance with the DMCA and applicable law, LUOFILM.SITE has adopted a policy of terminating, in appropriate circumstances, the accounts of users who are deemed to be repeat infringers. We may also limit access to the Service for users who infringe any intellectual property rights of others.`,
          },
          {
            title: "Disclaimer",
            body: `Nothing in this policy constitutes legal advice. If you are uncertain about whether your use of any material infringes another person's copyright, we recommend consulting with a legal professional before submitting any notice.`,
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
