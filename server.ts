import express from "express";
import { createServer as createViteServer } from "vite";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, desc, sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

const { Pool } = pg;

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").default("user"),
  status: text("status").default("active"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const contentTable = pgTable("content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  genre: text("genre"),
  status: text("status").default("active"),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  year: integer("year"),
  rating: text("rating"),
  episodeCount: integer("episode_count").default(0),
  views: integer("views").default(0),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const episodesTable = pgTable("episodes", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id").notNull(),
  title: text("title").notNull(),
  seasonNumber: integer("season_number").default(1),
  episodeNumber: integer("episode_number").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const carouselTable = pgTable("carousel_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  page: text("page").default("home"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

const featuredTable = pgTable("featured_items", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id"),
  page: text("page").default("home"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  notes: text("notes"),
  activatedBy: text("activated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const walletTable = pgTable("wallet", {
  id: serial("id").primaryKey(),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0"),
  totalEarned: numeric("total_earned", { precision: 10, scale: 2 }).default("0"),
  totalWithdrawn: numeric("total_withdrawn", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name"),
  userEmail: text("user_email"),
  userPhone: text("user_phone"),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  status: text("status").default("completed"),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name"),
  userEmail: text("user_email"),
  userPhone: text("user_phone"),
  actionType: text("action_type").notNull(),
  page: text("page"),
  contentId: integer("content_id"),
  contentTitle: text("content_title"),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

const apiRouter = express.Router();

apiRouter.get("/admin/stats", async (_req, res) => {
  try {
    const [{ count: totalUsers }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [{ count: totalContent }] = await db.select({ count: sql<number>`count(*)` }).from(contentTable);
    const [{ count: activeSubscriptions }] = await db.select({ count: sql<number>`count(*)` }).from(subscriptionsTable).where(sql`status = 'active'`);
    const [{ count: totalActivities }] = await db.select({ count: sql<number>`count(*)` }).from(activitiesTable);
    const recentTxs = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(5);
    const recentUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(5);
    const recentActivities = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(10);
    const [{ total: totalRevenue }] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(sql`type = 'subscription' and status = 'completed'`);
    res.json({
      stats: {
        totalUsers: Number(totalUsers),
        totalContent: Number(totalContent),
        activeSubscriptions: Number(activeSubscriptions),
        totalActivities: Number(totalActivities),
        totalRevenue: Number(totalRevenue) || 0,
      },
      recentTxs,
      recentUsers,
      recentActivities,
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/users", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const role = (req.query.role as string) || "";
    let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone || "").includes(s));
    }
    if (status) users = users.filter(u => u.status === status);
    if (role) users = users.filter(u => u.role === role);
    res.json({ users, total: users.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/users/:id", async (req, res) => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id)));
    if (!user[0]) return res.status(404).json({ error: "User not found" }) as any;
    const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, Number(req.params.id))).orderBy(desc(subscriptionsTable.createdAt));
    res.json({ user: user[0], subscriptions: subs });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/users", async (req, res) => {
  try {
    const { name, email, phone, role, status, country } = req.body;
    const [user] = await db.insert(usersTable).values({ name, email, phone, role: role || "user", status: status || "active", country }).returning();
    res.json({ user });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.put("/admin/users/:id", async (req, res) => {
  try {
    const { name, email, phone, role, status, country } = req.body;
    const [user] = await db.update(usersTable).set({ name, email, phone, role, status, country, updatedAt: new Date() }).where(eq(usersTable.id, Number(req.params.id))).returning();
    res.json({ user });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.delete("/admin/users/:id", async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/content", async (req, res) => {
  try {
    const type = (req.query.type as string) || "";
    const status = (req.query.status as string) || "";
    const search = (req.query.search as string) || "";
    let items = await db.select().from(contentTable).orderBy(desc(contentTable.createdAt));
    if (type) items = items.filter(c => c.type === type);
    if (status) items = items.filter(c => c.status === status);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(c => c.title.toLowerCase().includes(s) || (c.genre || "").toLowerCase().includes(s));
    }
    res.json({ content: items, total: items.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/content/:id", async (req, res) => {
  try {
    const [item] = await db.select().from(contentTable).where(eq(contentTable.id, Number(req.params.id)));
    if (!item) return res.status(404).json({ error: "Not found" }) as any;
    const eps = item.type === "series"
      ? await db.select().from(episodesTable).where(eq(episodesTable.seriesId, item.id)).orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber)
      : [];
    res.json({ content: item, episodes: eps });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/content", async (req, res) => {
  try {
    const [item] = await db.insert(contentTable).values(req.body).returning();
    res.json({ content: item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.put("/admin/content/:id", async (req, res) => {
  try {
    const [item] = await db.update(contentTable).set({ ...req.body, updatedAt: new Date() }).where(eq(contentTable.id, Number(req.params.id))).returning();
    res.json({ content: item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.delete("/admin/content/:id", async (req, res) => {
  try {
    await db.delete(contentTable).where(eq(contentTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/content/:id/episodes", async (req, res) => {
  try {
    const eps = await db.select().from(episodesTable).where(eq(episodesTable.seriesId, Number(req.params.id))).orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber);
    res.json({ episodes: eps });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/content/:id/episodes", async (req, res) => {
  try {
    const [ep] = await db.insert(episodesTable).values({ ...req.body, seriesId: Number(req.params.id) }).returning();
    const allEps = await db.select().from(episodesTable).where(eq(episodesTable.seriesId, Number(req.params.id)));
    await db.update(contentTable).set({ episodeCount: allEps.length }).where(eq(contentTable.id, Number(req.params.id)));
    res.json({ episode: ep });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.put("/admin/content/:id/episodes/:epId", async (req, res) => {
  try {
    const [ep] = await db.update(episodesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(episodesTable.id, Number(req.params.epId))).returning();
    res.json({ episode: ep });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.delete("/admin/content/:id/episodes/:epId", async (req, res) => {
  try {
    await db.delete(episodesTable).where(eq(episodesTable.id, Number(req.params.epId)));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/carousel/carousel", async (_req, res) => {
  try {
    const items = await db.select().from(carouselTable).orderBy(carouselTable.page, carouselTable.sortOrder);
    res.json({ items });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/carousel/carousel", async (req, res) => {
  try {
    const [item] = await db.insert(carouselTable).values(req.body).returning();
    res.json({ item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.put("/admin/carousel/carousel/:id", async (req, res) => {
  try {
    const [item] = await db.update(carouselTable).set(req.body).where(eq(carouselTable.id, Number(req.params.id))).returning();
    res.json({ item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.delete("/admin/carousel/carousel/:id", async (req, res) => {
  try {
    await db.delete(carouselTable).where(eq(carouselTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/carousel/featured", async (_req, res) => {
  try {
    const items = await db.select().from(featuredTable).orderBy(featuredTable.page);
    res.json({ items });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/carousel/featured", async (req, res) => {
  try {
    const [item] = await db.insert(featuredTable).values(req.body).returning();
    res.json({ item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.put("/admin/carousel/featured/:id", async (req, res) => {
  try {
    const [item] = await db.update(featuredTable).set(req.body).where(eq(featuredTable.id, Number(req.params.id))).returning();
    res.json({ item });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.delete("/admin/carousel/featured/:id", async (req, res) => {
  try {
    await db.delete(featuredTable).where(eq(featuredTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/carousel/content-list", async (_req, res) => {
  try {
    const items = await db.select({ id: contentTable.id, title: contentTable.title, type: contentTable.type }).from(contentTable).orderBy(contentTable.title);
    res.json({ items });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/subscriptions", async (req, res) => {
  try {
    const status = (req.query.status as string) || "";
    const plan = (req.query.plan as string) || "";
    let subs = await db.select({
      id: subscriptionsTable.id,
      userId: subscriptionsTable.userId,
      plan: subscriptionsTable.plan,
      status: subscriptionsTable.status,
      startDate: subscriptionsTable.startDate,
      endDate: subscriptionsTable.endDate,
      price: subscriptionsTable.price,
      currency: subscriptionsTable.currency,
      notes: subscriptionsTable.notes,
      activatedBy: subscriptionsTable.activatedBy,
      createdAt: subscriptionsTable.createdAt,
      updatedAt: subscriptionsTable.updatedAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userPhone: usersTable.phone,
    }).from(subscriptionsTable).leftJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id)).orderBy(desc(subscriptionsTable.createdAt));
    if (status) subs = subs.filter(s => s.status === status);
    if (plan) subs = subs.filter(s => s.plan === plan);
    res.json({ subscriptions: subs, total: subs.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/subscriptions", async (req, res) => {
  try {
    const [sub] = await db.insert(subscriptionsTable).values(req.body).returning();
    res.json({ subscription: sub });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.put("/admin/subscriptions/:id", async (req, res) => {
  try {
    const [sub] = await db.update(subscriptionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(subscriptionsTable.id, Number(req.params.id))).returning();
    if (req.body.status === "active") {
      const userRows = await db.select().from(usersTable).where(eq(usersTable.id, sub.userId));
      if (userRows[0]) {
        await db.insert(transactionsTable).values({
          userId: sub.userId,
          userName: userRows[0].name,
          userEmail: userRows[0].email,
          userPhone: userRows[0].phone,
          type: "subscription",
          amount: sub.price || "0",
          status: "completed",
          description: `Subscription ${req.body.status}: ${sub.plan} plan`,
        });
      }
    }
    res.json({ subscription: sub });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.delete("/admin/subscriptions/:id", async (req, res) => {
  try {
    await db.delete(subscriptionsTable).where(eq(subscriptionsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

async function getOrCreateWallet() {
  const wallets = await db.select().from(walletTable);
  if (wallets.length === 0) {
    const [w] = await db.insert(walletTable).values({ balance: "0", totalEarned: "0", totalWithdrawn: "0" }).returning();
    return w;
  }
  return wallets[0];
}

apiRouter.get("/admin/wallet", async (_req, res) => {
  try {
    const wallet = await getOrCreateWallet();
    res.json({ wallet });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/wallet/withdraw", async (req, res) => {
  try {
    const { amount, description, method, accountDetails } = req.body;
    const wallet = await getOrCreateWallet();
    if (Number(wallet.balance) < Number(amount)) return res.status(400).json({ error: "Insufficient balance" }) as any;
    const [updated] = await db.update(walletTable).set({
      balance: String(Number(wallet.balance) - Number(amount)),
      totalWithdrawn: String(Number(wallet.totalWithdrawn) + Number(amount)),
      updatedAt: new Date(),
    }).where(eq(walletTable.id, wallet.id)).returning();
    const [tx] = await db.insert(transactionsTable).values({
      type: "withdrawal",
      amount: String(-Number(amount)),
      status: "completed",
      description: description || `Withdrawal via ${method}`,
      metadata: JSON.stringify({ method, accountDetails }),
    }).returning();
    res.json({ wallet: updated, transaction: tx });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/wallet/topup", async (req, res) => {
  try {
    const { amount, description } = req.body;
    const wallet = await getOrCreateWallet();
    const [updated] = await db.update(walletTable).set({
      balance: String(Number(wallet.balance) + Number(amount)),
      totalEarned: String(Number(wallet.totalEarned) + Number(amount)),
      updatedAt: new Date(),
    }).where(eq(walletTable.id, wallet.id)).returning();
    await db.insert(transactionsTable).values({
      type: "topup",
      amount: String(amount),
      status: "completed",
      description: description || "Manual topup",
    });
    res.json({ wallet: updated });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/transactions", async (req, res) => {
  try {
    const type = (req.query.type as string) || "";
    const status = (req.query.status as string) || "";
    const search = (req.query.search as string) || "";
    let txs = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt));
    if (type) txs = txs.filter(t => t.type === type);
    if (status) txs = txs.filter(t => t.status === status);
    if (search) {
      const s = search.toLowerCase();
      txs = txs.filter(t =>
        (t.userName || "").toLowerCase().includes(s) ||
        (t.userEmail || "").toLowerCase().includes(s) ||
        (t.userPhone || "").includes(s) ||
        (t.description || "").toLowerCase().includes(s)
      );
    }
    const total = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    res.json({ transactions: txs, count: txs.length, total });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.get("/admin/activities", async (req, res) => {
  try {
    const actionType = (req.query.actionType as string) || "";
    const search = (req.query.search as string) || "";
    const limit = Number(req.query.limit || "100");
    const page = Number(req.query.page || "1");
    let acts = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(limit).offset((page - 1) * limit);
    if (actionType) acts = acts.filter(a => a.actionType === actionType);
    if (search) {
      const s = search.toLowerCase();
      acts = acts.filter(a =>
        (a.userName || "").toLowerCase().includes(s) ||
        (a.userEmail || "").toLowerCase().includes(s) ||
        (a.userPhone || "").includes(s) ||
        (a.contentTitle || "").toLowerCase().includes(s) ||
        (a.page || "").toLowerCase().includes(s)
      );
    }
    res.json({ activities: acts, count: acts.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

apiRouter.post("/admin/activities", async (req, res) => {
  try {
    const [act] = await db.insert(activitiesTable).values(req.body).returning();
    res.json({ activity: act });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use("/api", apiRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Firestore REST API helpers (public content — no auth required)
// ─────────────────────────────────────────────────────────────────────────────
const FIREBASE_PROJECT_ID = "luo-film-site";
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function fsVal(field: any): any {
  if (!field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return Number(field.doubleValue);
  if ("booleanValue" in field) return field.booleanValue;
  if ("timestampValue" in field) return field.timestampValue;
  return null;
}

function fsDocToContent(doc: any) {
  const id = doc.name.split("/").pop();
  const f = doc.fields || {};
  return {
    id,
    title: fsVal(f.title) || "",
    status: fsVal(f.status) || "",
    type: fsVal(f.type) || "",
    genre: fsVal(f.genre) || "",
    description: fsVal(f.description) || "",
    thumbnailUrl: fsVal(f.thumbnailUrl) || fsVal(f.coverUrl) || "",
    year: fsVal(f.year) || "",
    updatedAt: fsVal(f.updatedAt) || new Date().toISOString(),
  };
}

async function fetchAllPublishedContent(): Promise<any[]> {
  const all: any[] = [];
  let pageToken = "";
  do {
    const url = `${FS_BASE}/content?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (data.documents) all.push(...data.documents);
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return all.map(fsDocToContent).filter((d) => d.status === "published" && d.title);
}

// Cache published content for 5 minutes so sitemap updates as new movies are added
let _contentCache: any[] | null = null;
let _contentCacheTime = 0;
const CONTENT_CACHE_MS = 5 * 60 * 1000;

async function getCachedContent(): Promise<any[]> {
  const now = Date.now();
  if (_contentCache && now - _contentCacheTime < CONTENT_CACHE_MS) return _contentCache;
  _contentCache = await fetchAllPublishedContent();
  _contentCacheTime = now;
  return _contentCache;
}

function xmlEsc(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function attrEsc(s: string): string {
  return String(s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getIndexHtml(): string {
  const candidates = [
    resolve(process.cwd(), "dist/index.html"),
    resolve(process.cwd(), "index.html"),
  ];
  for (const p of candidates) {
    try { return readFileSync(p, "utf-8"); } catch {}
  }
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// No-cache middleware for all HTML responses
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (!req.path.match(/\.\w{2,5}$/)) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic sitemap — lists EVERY published movie & series individually
// Updates every 5 minutes as new content is added
// ─────────────────────────────────────────────────────────────────────────────
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const content = await getCachedContent();
    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "https://luofilm.site/", priority: "1.0", changefreq: "hourly" },
      { loc: "https://luofilm.site/drama", priority: "0.9", changefreq: "hourly" },
      { loc: "https://luofilm.site/movie", priority: "0.9", changefreq: "hourly" },
      { loc: "https://luofilm.site/anime", priority: "0.8", changefreq: "daily" },
      { loc: "https://luofilm.site/variety", priority: "0.8", changefreq: "daily" },
      { loc: "https://luofilm.site/sports", priority: "0.7", changefreq: "daily" },
      { loc: "https://luofilm.site/documentary", priority: "0.7", changefreq: "daily" },
      { loc: "https://luofilm.site/search", priority: "0.8", changefreq: "hourly" },
      { loc: "https://luofilm.site/terms", priority: "0.3", changefreq: "monthly" },
      { loc: "https://luofilm.site/privacy", priority: "0.3", changefreq: "monthly" },
      { loc: "https://luofilm.site/contact", priority: "0.5", changefreq: "monthly" },
    ];

    const staticXml = staticPages
      .map(
        (p) =>
          `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
      )
      .join("\n");

    const contentXml = content
      .map((c) => {
        const videoBlock = c.thumbnailUrl
          ? `\n    <image:image>\n      <image:loc>${xmlEsc(c.thumbnailUrl)}</image:loc>\n      <image:title>${xmlEsc(c.title + " — Luo Translated by VJ Paul UG")}</image:title>\n      <image:caption>${xmlEsc((c.description || c.title).slice(0, 200))}</image:caption>\n    </image:image>\n    <video:video>\n      <video:thumbnail_loc>${xmlEsc(c.thumbnailUrl)}</video:thumbnail_loc>\n      <video:title>${xmlEsc(c.title + " (Luo Translated) — VJ Paul UG | LUOFILM.SITE")}</video:title>\n      <video:description>${xmlEsc((c.description || c.title).slice(0, 2048))}</video:description>\n      <video:player_loc>https://luofilm.site/play/${xmlEsc(c.id)}</video:player_loc>\n      <video:publication_date>${today}</video:publication_date>\n      <video:family_friendly>yes</video:family_friendly>\n    </video:video>`
          : "";
        return `  <url>\n    <loc>https://luofilm.site/play/${xmlEsc(c.id)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>${videoBlock}\n  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${staticXml}\n${contentXml}\n</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    res.send(xml);
  } catch (e) {
    console.error("Sitemap error:", e);
    res.status(500).send("<?xml version=\"1.0\"?><error>Sitemap generation failed</error>");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Server-side meta injection for /play/:id
// Google sees actual movie title + description + image without needing JS
// ─────────────────────────────────────────────────────────────────────────────
app.get("/play/:id", async (req, res) => {
  const id = req.params.id;
  let html = getIndexHtml();

  try {
    const fsRes = await fetch(`${FS_BASE}/content/${id}`);
    if (fsRes.ok) {
      const doc = await fsRes.json();
      if (doc.fields) {
        const c = fsDocToContent(doc);
        if (c.title) {
          const title = `${c.title} (Luo Translated) — Watch Free | VJ Paul UG | LUOFILM.SITE`;
          const desc = c.description
            ? `${c.description.slice(0, 155)} — Watch this Luo translated ${c.type === "movie" ? "movie" : "series"} by VJ Paul UG free on LUOFILM.SITE.`
            : `Watch "${c.title}" in Luo language — translated by VJ Paul UG. Stream free on LUOFILM.SITE, Uganda's #1 Luo streaming platform.`;
          const image = c.thumbnailUrl || "https://luofilm.site/logo.png";
          const url = `https://luofilm.site/play/${id}`;
          const today = new Date().toISOString().split("T")[0];

          const schema = JSON.stringify({
            "@context": "https://schema.org",
            "@type": c.type === "movie" ? "Movie" : "TVSeries",
            "@id": url,
            name: c.title,
            alternateName: `${c.title} Luo Translated`,
            description: c.description || c.title,
            image,
            thumbnailUrl: image,
            url,
            inLanguage: "luo",
            genre: c.genre || "Entertainment",
            datePublished: today,
            director: { "@type": "Person", name: "VJ Paul UG" },
            productionCompany: { "@type": "Organization", name: "LUOFILM.SITE" },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "UGX",
              availability: "https://schema.org/InStock",
            },
            potentialAction: { "@type": "WatchAction", target: url },
          });

          html = html
            .replace(/<title>[^<]*<\/title>/, `<title>${attrEsc(title)}</title>`)
            .replace(/<meta name="title"[^>]*\/?>/, `<meta name="title" content="${attrEsc(title)}" />`)
            .replace(/<meta name="description"[^>]*\/?>/, `<meta name="description" content="${attrEsc(desc)}" />`)
            .replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${attrEsc(title)}" />`)
            .replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${attrEsc(desc)}" />`)
            .replace(/<meta property="og:image"[^>]*\/?>/, `<meta property="og:image" content="${attrEsc(image)}" />`)
            .replace(/<meta property="og:image:secure_url"[^>]*\/?>/, `<meta property="og:image:secure_url" content="${attrEsc(image)}" />`)
            .replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${attrEsc(url)}" />`)
            .replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${attrEsc(title)}" />`)
            .replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${attrEsc(desc)}" />`)
            .replace(/<meta name="twitter:image"[^>]*\/?>/, `<meta name="twitter:image" content="${attrEsc(image)}" />`)
            .replace(
              "</head>",
              `  <link rel="canonical" href="${attrEsc(url)}" />\n  <script type="application/ld+json">${schema}</script>\n</head>`
            );
        }
      }
    }
  } catch (e) {
    console.error("Meta injection error for /play/:id", e);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  if (html) return res.send(html);
  res.redirect("/");
});

const PORT = parseInt(process.env.PORT || "5000");
const isDev = process.env.NODE_ENV !== "production";

async function startServer() {
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const { default: sirv } = await import("sirv" as any);
    app.use(sirv("dist", { single: true }));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
