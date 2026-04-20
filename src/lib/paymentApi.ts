import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

const FALLBACK_BASE = "https://function-bun-production-37b5.up.railway.app";

let _cachedPaymentBase: string | null = null;

async function getPaymentBase(): Promise<string> {
  if (_cachedPaymentBase) return _cachedPaymentBase;
  try {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (snap.exists()) {
      const url: string = snap.data()?.paymentBackendUrl || "";
      if (url) {
        _cachedPaymentBase = url.replace(/\/$/, "");
        return _cachedPaymentBase;
      }
    }
  } catch {
  }
  _cachedPaymentBase = FALLBACK_BASE;
  return _cachedPaymentBase;
}

export function clearPaymentBaseCache() {
  _cachedPaymentBase = null;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+256${digits.slice(1)}`;
  if (digits.length === 9) return `+256${digits}`;
  if (digits.startsWith("256") && digits.length === 12) return `+${digits}`;
  return `+${digits}`;
}

async function post(path: string, body: object) {
  const base = await getPaymentBase();
  console.log("[PaymentAPI] POST", path, body, "→", base);
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("[PaymentAPI] Response", path, res.status, data);
  if (!res.ok) {
    const msg = data?.message || data?.error || data?.details?.message || "Payment request failed";
    throw new Error(msg);
  }
  if (data?.success === false) {
    const msg = data?.message || data?.error || "Request was not successful";
    throw new Error(msg);
  }
  return data;
}

async function get(path: string) {
  const base = await getPaymentBase();
  console.log("[PaymentAPI] GET", path, "→", base);
  const res = await fetch(`${base}${path}`);
  const data = await res.json();
  console.log("[PaymentAPI] Response", path, res.status, data);
  if (!res.ok) {
    const msg = data?.message || data?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export const paymentApi = {
  validatePhone: async (phone: string) => {
    const msisdn = normalizePhone(phone);
    console.log("[PaymentAPI] Validating phone:", msisdn);
    return post("/api/validate-phone", { msisdn });
  },

  deposit: async (phone: string, amount: number, description: string, reference: string) => {
    const msisdn = normalizePhone(phone);
    console.log("[PaymentAPI] Deposit:", { msisdn, amount, description, reference });
    return post("/api/deposit", { msisdn, amount, description, reference });
  },

  checkStatus: async (internalReference: string) => {
    return get(`/api/request-status?internal_reference=${encodeURIComponent(internalReference)}`);
  },

  walletBalance: async () => {
    return get("/api/wallet/balance");
  },

  withdraw: async (phone: string, amount: number, description: string, reference: string) => {
    const msisdn = normalizePhone(phone);
    return post("/api/withdraw", { msisdn, amount, description, reference });
  },

  normalizePhone,
};

export type PaymentStatus = "idle" | "validating" | "pending" | "polling" | "success" | "failed";
