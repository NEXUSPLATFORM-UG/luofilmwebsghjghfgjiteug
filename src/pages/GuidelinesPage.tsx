import { useSEO } from "../hooks/useSEO";

export default function GuidelinesPage() {
  useSEO({ title: "Content Guidelines", description: "LUOFILM.SITE Content Guidelines — community standards for our Luo translated movies and drama streaming platform.", url: "/guidelines" });
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", padding: "30px 20px 60px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Content Guidelines</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>Last updated: January 1, 2025</p>

        {[
          {
            title: "Our Community Standards",
            body: `LUOFILM.SITE is committed to providing a safe, respectful, and enjoyable streaming experience for all users. These Content Guidelines outline what is and is not acceptable on our platform. All users and content providers must adhere to these standards.`,
          },
          {
            title: "Permitted Content",
            body: `LUOFILM.SITE hosts licensed Asian drama series, movies, variety shows, anime, sports content, and documentaries. All content must be properly licensed, age-appropriately rated, and comply with applicable laws and regulations. We support content that entertains, educates, and enriches our diverse global community.`,
          },
          {
            title: "Prohibited Content",
            body: `The following types of content are strictly prohibited on LUOFILM.SITE: (1) Content that infringes on any third party's intellectual property rights; (2) Content depicting or promoting illegal activities; (3) Sexually explicit or pornographic material; (4) Content that promotes hatred, discrimination, or violence against any group; (5) Content involving the exploitation of minors in any form; (6) Misleading, fraudulent, or deceptive content; (7) Content that violates any applicable laws or regulations.`,
          },
          {
            title: "Age Ratings",
            body: `All content on LUOFILM.SITE is rated appropriately. Parental Guidance (PG) content may include mild themes suitable for general audiences. Content rated 13+ may include moderate themes, mild language, and some violence. Content rated 16+ may include mature themes, moderate language, and more intense sequences. Content rated 18+ is restricted to adult users only and requires age verification.`,
          },
          {
            title: "Content Moderation",
            body: `Our team reviews all content before publication. We use a combination of automated systems and human review to ensure compliance with these guidelines. Content that violates our guidelines will be removed without notice, and repeat violators may have their accounts terminated.`,
          },
          {
            title: "Reporting Violations",
            body: `If you encounter content that you believe violates these guidelines, please report it immediately by contacting us at mainplatform.nexus@gmail.com or via WhatsApp: +256 760 734 679. Include the content title, URL, and a description of the violation. We will review all reports within 72 hours.`,
          },
          {
            title: "Enforcement",
            body: `Violations of these Content Guidelines may result in content removal, account warnings, temporary suspension, or permanent account termination, depending on the severity and frequency of violations. We reserve the right to take any action we deem appropriate to enforce these guidelines.`,
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
