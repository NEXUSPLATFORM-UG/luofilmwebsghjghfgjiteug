import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, limit,
  serverTimestamp, Timestamp, increment,
} from "firebase/firestore";
import { db } from "./firebase";

function tsToMs(ts: Timestamp | null | undefined): number {
  if (!ts) return Date.now();
  return ts.toMillis ? ts.toMillis() : Date.now();
}

function docToObj(d: any) {
  const data = d.data();
  const out: any = { id: d.id, ...data };
  if (data.createdAt instanceof Timestamp) out.createdAt = tsToMs(data.createdAt);
  if (data.updatedAt instanceof Timestamp) out.updatedAt = tsToMs(data.updatedAt);
  return out;
}

let _cachedIp: string | null = null;
async function getClientIp(): Promise<string> {
  if (_cachedIp) return _cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    _cachedIp = data.ip || "";
    return _cachedIp || "";
  } catch {
    return "";
  }
}

export function cacheUserPhone(phone: string) {
  try { if (phone) localStorage.setItem("lf_user_phone", phone); } catch {}
}
export function getCachedUserPhone(): string {
  try { return localStorage.getItem("lf_user_phone") || ""; } catch { return ""; }
}

export const fbApi = {
  stats: async () => {
    const [usersSnap, contentSnap, subsSnap, txSnap, activitiesSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "content")),
      getDocs(query(collection(db, "subscriptions"), where("status", "==", "active"))),
      getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(10))),
      getDocs(query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(10))),
    ]);

    const recentUsers = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5)));
    const totalRevenue = txSnap.docs.reduce((sum, d) => {
      const amt = d.data().amount || 0;
      return sum + (amt > 0 ? amt : 0);
    }, 0);

    return {
      stats: {
        totalUsers: usersSnap.size,
        totalContent: contentSnap.size,
        activeSubscriptions: subsSnap.size,
        totalRevenue,
        totalActivities: activitiesSnap.size,
      },
      recentTxs: txSnap.docs.map(docToObj),
      recentUsers: recentUsers.docs.map(docToObj),
      recentActivities: activitiesSnap.docs.map(docToObj),
    };
  },

  users: {
    list: async (params?: Record<string, string>) => {
      let q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      let users = snap.docs.map(docToObj);
      if (params?.search) {
        const s = params.search.toLowerCase();
        users = users.filter((u: any) =>
          u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
        );
      }
      return { users };
    },
    get: async (id: string) => {
      const snap = await getDoc(doc(db, "users", id));
      return snap.exists() ? { user: docToObj(snap) } : { user: null };
    },
    create: async (data: any) => {
      const ref2 = await addDoc(collection(db, "users"), {
        ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      return { id: ref2.id };
    },
    update: async (id: string, data: any) => {
      await updateDoc(doc(db, "users", id), { ...data, updatedAt: serverTimestamp() });
      return { id };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "users", id));
      return { id };
    },
  },

  content: {
    list: async (params?: Record<string, string>) => {
      let q = query(collection(db, "content"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      let content = snap.docs.map(docToObj);
      if (params?.search) {
        const s = params.search.toLowerCase();
        content = content.filter((c: any) => c.title?.toLowerCase().includes(s));
      }
      if (params?.type) {
        content = content.filter((c: any) => c.type === params.type);
      }
      return { content };
    },
    get: async (id: string) => {
      const snap = await getDoc(doc(db, "content", id));
      return snap.exists() ? { content: docToObj(snap) } : { content: null };
    },
    create: async (data: any) => {
      const ref2 = await addDoc(collection(db, "content"), {
        ...data, views: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      return { id: ref2.id };
    },
    update: async (id: string, data: any) => {
      await updateDoc(doc(db, "content", id), { ...data, updatedAt: serverTimestamp() });
      return { id };
    },
    delete: async (id: string) => {
      const episodesSnap = await getDocs(collection(db, "content", id, "episodes"));
      for (const ep of episodesSnap.docs) {
        await deleteDoc(ep.ref);
      }
      await deleteDoc(doc(db, "content", id));
      return { id };
    },
    incrementViews: async (id: string) => {
      await updateDoc(doc(db, "content", id), { views: increment(1) });
    },
    episodes: {
      list: async (contentId: string) => {
        const snap = await getDocs(
          query(collection(db, "content", contentId, "episodes"), orderBy("episodeNumber", "asc"))
        );
        return { episodes: snap.docs.map(docToObj) };
      },
      create: async (contentId: string, data: any) => {
        const ref2 = await addDoc(collection(db, "content", contentId, "episodes"), {
          ...data, views: 0, createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "content", contentId), { episodeCount: increment(1) });
        return { id: ref2.id };
      },
      update: async (contentId: string, epId: string, data: any) => {
        await updateDoc(doc(db, "content", contentId, "episodes", epId), {
          ...data, updatedAt: serverTimestamp(),
        });
        return { id: epId };
      },
      delete: async (contentId: string, epId: string) => {
        await deleteDoc(doc(db, "content", contentId, "episodes", epId));
        await updateDoc(doc(db, "content", contentId), { episodeCount: increment(-1) });
        return { id: epId };
      },
    },
  },

  carousel: {
    list: async () => {
      const snap = await getDocs(collection(db, "carousel"));
      const items = snap.docs.map(docToObj);
      return items.sort((a: any, b: any) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0));
    },
    create: async (data: any) => {
      const payload = { ...data, order: data.sortOrder ?? 0, createdAt: serverTimestamp() };
      const ref2 = await addDoc(collection(db, "carousel"), payload);
      return { id: ref2.id };
    },
    update: async (id: string, data: any) => {
      const payload = { ...data, order: data.sortOrder ?? data.order ?? 0 };
      await updateDoc(doc(db, "carousel", id), payload);
      return { id };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "carousel", id));
      return { id };
    },
  },

  featured: {
    list: async () => {
      const snap = await getDocs(collection(db, "featured"));
      const items = snap.docs.map(docToObj);
      return items.sort((a: any, b: any) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0));
    },
    create: async (data: any) => {
      const ref2 = await addDoc(collection(db, "featured"), { ...data, createdAt: serverTimestamp() });
      return { id: ref2.id };
    },
    update: async (id: string, data: any) => {
      await updateDoc(doc(db, "featured", id), data);
      return { id };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "featured", id));
      return { id };
    },
    contentList: async () => {
      const snap = await getDocs(collection(db, "content"));
      return snap.docs.map(docToObj);
    },
  },

  subscriptions: {
    list: async (params?: Record<string, string>) => {
      const snap = await getDocs(query(collection(db, "subscriptions"), orderBy("createdAt", "desc")));
      let subs = snap.docs.map(docToObj);
      if (params?.status) subs = subs.filter((s: any) => s.status === params.status);
      return { subscriptions: subs };
    },
    create: async (data: any) => {
      const ref2 = await addDoc(collection(db, "subscriptions"), { ...data, createdAt: serverTimestamp() });
      if (data.status === "active" && data.amount > 0) {
        const txData = {
          userId: data.userId || null,
          userName: data.userName || null,
          userEmail: data.userEmail || null,
          userPhone: data.userPhone || data.phone || null,
          type: "subscription",
          amount: data.amount,
          status: "completed",
          description: `${data.planLabel || data.plan || "Subscription"} — ${data.paymentMethod || "payment"}`,
          reference: data.reference || `SUB-${Date.now()}`,
        };
        await addDoc(collection(db, "transactions"), { ...txData, createdAt: serverTimestamp() });
        const walletRef = doc(db, "wallet", "main");
        const walletSnap = await getDoc(walletRef);
        const current = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
        const totalEarned = walletSnap.exists() ? (walletSnap.data().totalEarned || 0) : 0;
        await setDoc(walletRef, {
          balance: current + data.amount,
          totalEarned: totalEarned + data.amount,
          currency: "UGX",
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      return { id: ref2.id };
    },
    update: async (id: string, data: any) => {
      await updateDoc(doc(db, "subscriptions", id), { ...data, updatedAt: serverTimestamp() });
      return { id };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "subscriptions", id));
      return { id };
    },
    checkActive: async (userId: string): Promise<boolean> => {
      if (!userId) return false;
      const snap = await getDocs(
        query(
          collection(db, "subscriptions"),
          where("userId", "==", userId),
          where("status", "==", "active")
        )
      );
      const now = Date.now();
      return snap.docs.some((d) => {
        const data = d.data();
        const expiresAt = data.expiresAt instanceof Timestamp
          ? data.expiresAt.toMillis()
          : (typeof data.expiresAt === "number" ? data.expiresAt : 0);
        return expiresAt > now;
      });
    },
  },

  wallet: {
    get: async () => {
      const snap = await getDoc(doc(db, "wallet", "main"));
      return snap.exists() ? snap.data() : { balance: 0, currency: "USD" };
    },
    withdraw: async (data: any) => {
      const walletSnap = await getDoc(doc(db, "wallet", "main"));
      const current = walletSnap.exists() ? walletSnap.data().balance || 0 : 0;
      if (current < data.amount) throw new Error("Insufficient balance");
      await setDoc(doc(db, "wallet", "main"), { balance: current - data.amount, currency: "USD" });
      await addDoc(collection(db, "transactions"), {
        type: "withdrawal", amount: -data.amount, description: data.note || "Withdrawal",
        createdAt: serverTimestamp(), status: "completed",
      });
      return { success: true };
    },
    topup: async (data: any) => {
      const walletSnap = await getDoc(doc(db, "wallet", "main"));
      const current = walletSnap.exists() ? walletSnap.data().balance || 0 : 0;
      await setDoc(doc(db, "wallet", "main"), { balance: current + data.amount, currency: "USD" });
      await addDoc(collection(db, "transactions"), {
        type: "topup", amount: data.amount, description: data.note || "Top-up",
        createdAt: serverTimestamp(), status: "completed",
      });
      return { success: true };
    },
  },

  transactions: {
    list: async (params?: Record<string, string>) => {
      const snap = await getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc")));
      let txs = snap.docs.map(docToObj);
      if (params?.type) txs = txs.filter((t: any) => t.type === params.type);
      return { transactions: txs };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "transactions", id));
      return { id };
    },
    create: async (data: any) => {
      const ref2 = await addDoc(collection(db, "transactions"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      if (data.type === "subscription" && data.status === "completed" && data.amount > 0) {
        const walletRef = doc(db, "wallet", "main");
        const walletSnap = await getDoc(walletRef);
        const current = walletSnap.exists() ? (walletSnap.data().balance || 0) : 0;
        const totalEarned = walletSnap.exists() ? (walletSnap.data().totalEarned || 0) : 0;
        await setDoc(walletRef, {
          balance: current + data.amount,
          totalEarned: totalEarned + data.amount,
          currency: "UGX",
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      return { id: ref2.id };
    },
  },

  activities: {
    list: async (params?: Record<string, string>) => {
      const snap = await getDocs(query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(100)));
      let acts = snap.docs.map(docToObj);
      if (params?.actionType) acts = acts.filter((a: any) => a.actionType === params.actionType);
      return { activities: acts };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "activities", id));
      return { id };
    },
    clearAll: async () => {
      const snap = await getDocs(collection(db, "activities"));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "activities", d.id))));
      return { count: snap.docs.length };
    },
    log: async (data: any) => {
      const ip = await getClientIp();
      const phone = data.userPhone || getCachedUserPhone() || null;
      const enriched = {
        ...data,
        userPhone: phone,
        ipAddress: ip || null,
        userAgent: navigator.userAgent || null,
        createdAt: serverTimestamp(),
      };
      const ref2 = await addDoc(collection(db, "activities"), enriched);
      return { id: ref2.id };
    },
  },

  settings: {
    get: async () => {
      const snap = await getDoc(doc(db, "settings", "main"));
      return snap.exists() ? snap.data() : null;
    },
    save: async (data: any) => {
      await setDoc(doc(db, "settings", "main"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return { success: true };
    },
  },

  userActions: {
    getAnonId: (): string => {
      let id = localStorage.getItem("luofilm_anon_id");
      if (!id) {
        id = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("luofilm_anon_id", id);
      }
      return id;
    },

    checkLike: async (contentId: string, userId: string): Promise<boolean> => {
      const snap = await getDoc(doc(db, "likes", `${contentId}_${userId}`));
      return snap.exists();
    },

    toggleLike: async (contentId: string, userId: string): Promise<boolean> => {
      const ref = doc(db, "likes", `${contentId}_${userId}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        try { await updateDoc(doc(db, "content", contentId), { likesCount: increment(-1) }); } catch {}
        return false;
      } else {
        await setDoc(ref, { contentId, userId, createdAt: serverTimestamp() });
        try { await updateDoc(doc(db, "content", contentId), { likesCount: increment(1) }); } catch {}
        return true;
      }
    },

    checkSave: async (contentId: string, userId: string): Promise<boolean> => {
      const snap = await getDoc(doc(db, "watchlist", `${contentId}_${userId}`));
      return snap.exists();
    },

    toggleSave: async (contentId: string, userId: string, contentMeta?: any): Promise<boolean> => {
      const ref = doc(db, "watchlist", `${contentId}_${userId}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        try { await updateDoc(doc(db, "content", contentId), { savesCount: increment(-1) }); } catch {}
        return false;
      } else {
        await setDoc(ref, {
          contentId, userId, createdAt: serverTimestamp(),
          ...(contentMeta || {}),
        });
        try { await updateDoc(doc(db, "content", contentId), { savesCount: increment(1) }); } catch {}
        return true;
      }
    },

    getWatchlist: async (userId: string) => {
      const snap = await getDocs(
        query(collection(db, "watchlist"), where("userId", "==", userId), orderBy("createdAt", "desc"))
      );
      return snap.docs.map(docToObj);
    },

    getHistory: async (userId: string) => {
      const snap = await getDocs(
        query(
          collection(db, "activities"),
          where("userId", "==", userId),
          where("actionType", "==", "watch"),
          orderBy("createdAt", "desc"),
          limit(100)
        )
      );
      return snap.docs.map(docToObj);
    },

    logWatch: async (userId: string, contentMeta: any) => {
      await addDoc(collection(db, "activities"), {
        userId,
        actionType: "watch",
        contentId: contentMeta.id || null,
        contentTitle: contentMeta.title || null,
        contentType: contentMeta.type || null,
        thumbnailUrl: contentMeta.thumbnailUrl || contentMeta.coverUrl || null,
        createdAt: serverTimestamp(),
      });
    },
  },

  publicContent: {
    listAll: async () => {
      const snap = await getDocs(collection(db, "content"));
      const docs = snap.docs
        .map(docToObj)
        .filter((d: any) => d.status === "published")
        .sort((a: any, b: any) => {
          const aTime = a.updatedAt || a.createdAt || 0;
          const bTime = b.updatedAt || b.createdAt || 0;
          return bTime - aTime;
        });
      const fixPromises = docs
        .filter((d: any) => d.type === "series" && (d.episodeCount || 0) === 0)
        .map(async (d: any) => {
          const epSnap = await getDocs(collection(db, "content", d.id, "episodes"));
          const count = epSnap.size;
          if (count > 0) {
            d.episodeCount = count;
            updateDoc(doc(db, "content", d.id), { episodeCount: count }).catch(() => {});
          }
        });
      await Promise.all(fixPromises);
      return docs;
    },
    getById: async (id: string) => {
      const snap = await getDoc(doc(db, "content", id));
      return snap.exists() ? docToObj(snap) : null;
    },
    getCarousel: async () => {
      const snap = await getDocs(collection(db, "carousel"));
      const items = snap.docs.map(docToObj);
      return items.sort((a: any, b: any) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0));
    },
    getSecondaryCarousel: async () => {
      const snap = await getDocs(collection(db, "carousel"));
      const items = snap.docs.map(docToObj)
        .filter((d: any) => d.page === "carousel2" && d.isActive !== false)
        .sort((a: any, b: any) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0));
      return items;
    },
    getFeatured: async () => {
      const snap = await getDocs(collection(db, "featured"));
      const items = snap.docs.map(docToObj);
      return items.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    },
    getHomeFeatured: async () => {
      const [featuredSnap, contentSnap] = await Promise.all([
        getDocs(collection(db, "featured")),
        getDocs(collection(db, "content")),
      ]);
      const allContentMap = new Map(contentSnap.docs.map(d => [d.id, docToObj(d)]));
      const items = featuredSnap.docs.map(docToObj)
        .filter((d: any) => d.page === "home" && d.isActive !== false)
        .sort((a: any, b: any) => (a.order ?? a.sortOrder ?? 0) - (b.order ?? b.sortOrder ?? 0))
        .map((item: any) => ({
          ...item,
          _content: item.contentId ? allContentMap.get(item.contentId) || null : null,
        }));
      return items;
    },
  },

  comments: {
    list: async (contentId: string) => {
      const snap = await getDocs(
        query(
          collection(db, "comments"),
          where("contentId", "==", contentId),
          orderBy("createdAt", "desc"),
          limit(100)
        )
      );
      return snap.docs.map(docToObj);
    },
    add: async (contentId: string, userId: string, userName: string, text: string) => {
      const ref = await addDoc(collection(db, "comments"), {
        contentId,
        userId,
        userName,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    delete: async (commentId: string) => {
      await deleteDoc(doc(db, "comments", commentId));
    },
  },
};
