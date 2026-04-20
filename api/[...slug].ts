import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, desc, sql } from "drizzle-orm";
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

type Handler = (
  req: VercelRequest,
  res: VercelResponse,
  params: Record<string, string>,
  query: URLSearchParams
) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const regexStr = path
    .replace(/:([^/]+)/g, (_, k) => {
      keys.push(k);
      return "([^/]+)";
    })
    .replace(/\//g, "\\/");
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${regexStr}$`),
    keys,
    handler,
  });
}

route("GET", "/api/admin/stats", async (_req, res) => {
  const [{ count: totalUsers }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable);
  const [{ count: totalContent }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contentTable);
  const [{ count: activeSubscriptions }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptionsTable)
    .where(sql`status = 'active'`);
  const [{ count: totalActivities }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activitiesTable);
  const recentTxs = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(5);
  const recentUsers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(5);
  const recentActivities = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.createdAt))
    .limit(10);
  const [{ total: totalRevenue }] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(transactionsTable)
    .where(sql`type = 'subscription' and status = 'completed'`);
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
});

route("GET", "/api/admin/users", async (_req, res, _p, query) => {
  const search = query.get("search") || "";
  const status = query.get("status") || "";
  const role = query.get("role") || "";
  let users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));
  if (search) {
    const s = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.phone || "").includes(s)
    );
  }
  if (status) users = users.filter((u) => u.status === status);
  if (role) users = users.filter((u) => u.role === role);
  res.json({ users, total: users.length });
});

route("GET", "/api/admin/users/:id", async (_req, res, params) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, Number(params.id)));
  if (!user[0]) return res.status(404).json({ error: "User not found" }) as any;
  const subs = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, Number(params.id)))
    .orderBy(desc(subscriptionsTable.createdAt));
  res.json({ user: user[0], subscriptions: subs });
});

route("POST", "/api/admin/users", async (req, res) => {
  const { name, email, phone, role, status, country } = req.body;
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, phone, role: role || "user", status: status || "active", country })
    .returning();
  res.json({ user });
});

route("PUT", "/api/admin/users/:id", async (req, res, params) => {
  const { name, email, phone, role, status, country } = req.body;
  const [user] = await db
    .update(usersTable)
    .set({ name, email, phone, role, status, country, updatedAt: new Date() })
    .where(eq(usersTable.id, Number(params.id)))
    .returning();
  res.json({ user });
});

route("DELETE", "/api/admin/users/:id", async (_req, res, params) => {
  await db.delete(usersTable).where(eq(usersTable.id, Number(params.id)));
  res.json({ success: true });
});

route("GET", "/api/admin/content", async (_req, res, _p, query) => {
  const type = query.get("type") || "";
  const status = query.get("status") || "";
  const search = query.get("search") || "";
  let items = await db
    .select()
    .from(contentTable)
    .orderBy(desc(contentTable.createdAt));
  if (type) items = items.filter((c) => c.type === type);
  if (status) items = items.filter((c) => c.status === status);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        (c.genre || "").toLowerCase().includes(s)
    );
  }
  res.json({ content: items, total: items.length });
});

route("GET", "/api/admin/content/:id", async (_req, res, params) => {
  const [item] = await db
    .select()
    .from(contentTable)
    .where(eq(contentTable.id, Number(params.id)));
  if (!item) return res.status(404).json({ error: "Not found" }) as any;
  const eps =
    item.type === "series"
      ? await db
          .select()
          .from(episodesTable)
          .where(eq(episodesTable.seriesId, item.id))
          .orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber)
      : [];
  res.json({ content: item, episodes: eps });
});

route("POST", "/api/admin/content", async (req, res) => {
  const [item] = await db.insert(contentTable).values(req.body).returning();
  res.json({ content: item });
});

route("PUT", "/api/admin/content/:id", async (req, res, params) => {
  const [item] = await db
    .update(contentTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(contentTable.id, Number(params.id)))
    .returning();
  res.json({ content: item });
});

route("DELETE", "/api/admin/content/:id", async (_req, res, params) => {
  await db.delete(contentTable).where(eq(contentTable.id, Number(params.id)));
  res.json({ success: true });
});

route("GET", "/api/admin/content/:id/episodes", async (_req, res, params) => {
  const eps = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.seriesId, Number(params.id)))
    .orderBy(episodesTable.seasonNumber, episodesTable.episodeNumber);
  res.json({ episodes: eps });
});

route("POST", "/api/admin/content/:id/episodes", async (req, res, params) => {
  const [ep] = await db
    .insert(episodesTable)
    .values({ ...req.body, seriesId: Number(params.id) })
    .returning();
  const allEps = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.seriesId, Number(params.id)));
  await db
    .update(contentTable)
    .set({ episodeCount: allEps.length })
    .where(eq(contentTable.id, Number(params.id)));
  res.json({ episode: ep });
});

route(
  "PUT",
  "/api/admin/content/:id/episodes/:epId",
  async (req, res, params) => {
    const [ep] = await db
      .update(episodesTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(episodesTable.id, Number(params.epId)))
      .returning();
    res.json({ episode: ep });
  }
);

route(
  "DELETE",
  "/api/admin/content/:id/episodes/:epId",
  async (_req, res, params) => {
    await db
      .delete(episodesTable)
      .where(eq(episodesTable.id, Number(params.epId)));
    res.json({ success: true });
  }
);

route("GET", "/api/admin/carousel/carousel", async (_req, res) => {
  const items = await db
    .select()
    .from(carouselTable)
    .orderBy(carouselTable.page, carouselTable.sortOrder);
  res.json({ items });
});

route("POST", "/api/admin/carousel/carousel", async (req, res) => {
  const [item] = await db
    .insert(carouselTable)
    .values(req.body)
    .returning();
  res.json({ item });
});

route(
  "PUT",
  "/api/admin/carousel/carousel/:id",
  async (req, res, params) => {
    const [item] = await db
      .update(carouselTable)
      .set(req.body)
      .where(eq(carouselTable.id, Number(params.id)))
      .returning();
    res.json({ item });
  }
);

route(
  "DELETE",
  "/api/admin/carousel/carousel/:id",
  async (_req, res, params) => {
    await db
      .delete(carouselTable)
      .where(eq(carouselTable.id, Number(params.id)));
    res.json({ success: true });
  }
);

route("GET", "/api/admin/carousel/featured", async (_req, res) => {
  const items = await db
    .select()
    .from(featuredTable)
    .orderBy(featuredTable.page);
  res.json({ items });
});

route("POST", "/api/admin/carousel/featured", async (req, res) => {
  const [item] = await db
    .insert(featuredTable)
    .values(req.body)
    .returning();
  res.json({ item });
});

route(
  "PUT",
  "/api/admin/carousel/featured/:id",
  async (req, res, params) => {
    const [item] = await db
      .update(featuredTable)
      .set(req.body)
      .where(eq(featuredTable.id, Number(params.id)))
      .returning();
    res.json({ item });
  }
);

route(
  "DELETE",
  "/api/admin/carousel/featured/:id",
  async (_req, res, params) => {
    await db
      .delete(featuredTable)
      .where(eq(featuredTable.id, Number(params.id)));
    res.json({ success: true });
  }
);

route("GET", "/api/admin/carousel/content-list", async (_req, res) => {
  const items = await db
    .select({
      id: contentTable.id,
      title: contentTable.title,
      type: contentTable.type,
    })
    .from(contentTable)
    .orderBy(contentTable.title);
  res.json({ items });
});

route("GET", "/api/admin/subscriptions", async (_req, res, _p, query) => {
  const status = query.get("status") || "";
  const plan = query.get("plan") || "";
  let subs = await db
    .select({
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
    })
    .from(subscriptionsTable)
    .leftJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
    .orderBy(desc(subscriptionsTable.createdAt));
  if (status) subs = subs.filter((s) => s.status === status);
  if (plan) subs = subs.filter((s) => s.plan === plan);
  res.json({ subscriptions: subs, total: subs.length });
});

route("POST", "/api/admin/subscriptions", async (req, res) => {
  const [sub] = await db
    .insert(subscriptionsTable)
    .values(req.body)
    .returning();
  res.json({ subscription: sub });
});

route("PUT", "/api/admin/subscriptions/:id", async (req, res, params) => {
  const [sub] = await db
    .update(subscriptionsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(subscriptionsTable.id, Number(params.id)))
    .returning();
  if (req.body.status === "active") {
    const userRows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, sub.userId));
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
});

route("DELETE", "/api/admin/subscriptions/:id", async (_req, res, params) => {
  await db
    .delete(subscriptionsTable)
    .where(eq(subscriptionsTable.id, Number(params.id)));
  res.json({ success: true });
});

async function getOrCreateWallet() {
  const wallets = await db.select().from(walletTable);
  if (wallets.length === 0) {
    const [w] = await db
      .insert(walletTable)
      .values({ balance: "0", totalEarned: "0", totalWithdrawn: "0" })
      .returning();
    return w;
  }
  return wallets[0];
}

route("GET", "/api/admin/wallet", async (_req, res) => {
  const wallet = await getOrCreateWallet();
  res.json({ wallet });
});

route("POST", "/api/admin/wallet/withdraw", async (req, res) => {
  const { amount, description, method, accountDetails } = req.body;
  const wallet = await getOrCreateWallet();
  if (Number(wallet.balance) < Number(amount))
    return res.status(400).json({ error: "Insufficient balance" }) as any;
  const [updated] = await db
    .update(walletTable)
    .set({
      balance: String(Number(wallet.balance) - Number(amount)),
      totalWithdrawn: String(Number(wallet.totalWithdrawn) + Number(amount)),
      updatedAt: new Date(),
    })
    .where(eq(walletTable.id, wallet.id))
    .returning();
  const [tx] = await db
    .insert(transactionsTable)
    .values({
      type: "withdrawal",
      amount: String(-Number(amount)),
      status: "completed",
      description: description || `Withdrawal via ${method}`,
      metadata: JSON.stringify({ method, accountDetails }),
    })
    .returning();
  res.json({ wallet: updated, transaction: tx });
});

route("POST", "/api/admin/wallet/topup", async (req, res) => {
  const { amount, description } = req.body;
  const wallet = await getOrCreateWallet();
  const [updated] = await db
    .update(walletTable)
    .set({
      balance: String(Number(wallet.balance) + Number(amount)),
      totalEarned: String(Number(wallet.totalEarned) + Number(amount)),
      updatedAt: new Date(),
    })
    .where(eq(walletTable.id, wallet.id))
    .returning();
  await db.insert(transactionsTable).values({
    type: "topup",
    amount: String(amount),
    status: "completed",
    description: description || "Manual topup",
  });
  res.json({ wallet: updated });
});

route("GET", "/api/admin/transactions", async (_req, res, _p, query) => {
  const type = query.get("type") || "";
  const status = query.get("status") || "";
  const search = query.get("search") || "";
  let txs = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt));
  if (type) txs = txs.filter((t) => t.type === type);
  if (status) txs = txs.filter((t) => t.status === status);
  if (search) {
    const s = search.toLowerCase();
    txs = txs.filter(
      (t) =>
        (t.userName || "").toLowerCase().includes(s) ||
        (t.userEmail || "").toLowerCase().includes(s) ||
        (t.userPhone || "").includes(s) ||
        (t.description || "").toLowerCase().includes(s)
    );
  }
  const total = txs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  res.json({ transactions: txs, count: txs.length, total });
});

route("GET", "/api/admin/activities", async (_req, res, _p, query) => {
  const actionType = query.get("actionType") || "";
  const search = query.get("search") || "";
  const limit = Number(query.get("limit") || "100");
  const page = Number(query.get("page") || "1");
  let acts = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  if (actionType) acts = acts.filter((a) => a.actionType === actionType);
  if (search) {
    const s = search.toLowerCase();
    acts = acts.filter(
      (a) =>
        (a.userName || "").toLowerCase().includes(s) ||
        (a.userEmail || "").toLowerCase().includes(s) ||
        (a.userPhone || "").includes(s) ||
        (a.contentTitle || "").toLowerCase().includes(s) ||
        (a.page || "").toLowerCase().includes(s)
    );
  }
  res.json({ activities: acts, count: acts.length });
});

route("POST", "/api/admin/activities", async (req, res) => {
  const [act] = await db
    .insert(activitiesTable)
    .values(req.body)
    .returning();
  res.json({ activity: act });
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const urlObj = new URL(req.url || "/", "http://localhost");
    const path = urlObj.pathname;
    const query = urlObj.searchParams;

    for (const r of routes) {
      if (r.method !== req.method) continue;
      const match = path.match(r.pattern);
      if (!match) continue;
      const params = Object.fromEntries(
        r.keys.map((k, i) => [k, match[i + 1]])
      );
      await r.handler(req, res, params, query);
      return;
    }

    res.status(404).json({ error: "Route not found", path });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
}
