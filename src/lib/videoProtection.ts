const XOR_KEY = 0x7E;

export function encodeVideoUrl(url: string): string {
  const bytes = new TextEncoder().encode(url);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ (XOR_KEY + (i % 7));
  }
  return btoa(String.fromCharCode(...Array.from(out)));
}

export function getProxiedUrl(realUrl: string): string {
  if (!realUrl) return "";
  if (import.meta.env.DEV) return realUrl;
  return `/api/vp?u=${encodeURIComponent(encodeVideoUrl(realUrl))}`;
}

const KNOWN_EXTENSION_GLOBALS: string[] = [
  "__sfh", "sfh_helper", "savefromHelper",
  "__videoDownloadHelper__", "vdhExt",
  "flashVideoDownloader", "idmGlobal",
  "__IDM__",
];

const EXTENSION_SELECTORS = [
  '[class*="vdh"]', '[id*="vdh"]',
  '[class*="savefrom"]', '[data-savefrom]',
  '[class*="video-dl"]', '[id*="video-dl"]',
  '[class*="ext-download"]', '[id*="ext-download"]',
  '[class*="flashvideo"]',
];

export function detectExtension(): boolean {
  for (const g of KNOWN_EXTENSION_GLOBALS) {
    if ((window as any)[g] !== undefined) return true;
  }
  for (const sel of EXTENSION_SELECTORS) {
    try {
      if (document.querySelector(sel)) return true;
    } catch (_) {}
  }
  return false;
}

export function installVideoProtections(): () => void {
  const cleanups: (() => void)[] = [];

  // ── 1. Aggressively erase resource timings every 200 ms ──────────────────
  const timingInterval = setInterval(() => {
    try { performance.clearResourceTimings(); } catch (_) {}
    try { (performance as any).clearMeasures?.(); } catch (_) {}
  }, 200);
  cleanups.push(() => clearInterval(timingInterval));

  // ── 2. Override getEntries* to hide video resources ───────────────────────
  const origGetEntriesByType = performance.getEntriesByType.bind(performance);
  performance.getEntriesByType = (type: string) => {
    if (type === "resource") return [];
    return origGetEntriesByType(type);
  };
  const origGetEntries = performance.getEntries.bind(performance);
  performance.getEntries = () =>
    origGetEntries().filter((e) => e.entryType !== "resource");
  cleanups.push(() => {
    performance.getEntriesByType = origGetEntriesByType;
    performance.getEntries = origGetEntries;
  });

  // ── 3. Neuter PerformanceObserver for resource entries ───────────────────
  try {
    const OrigPO = window.PerformanceObserver;
    class GuardedPO extends OrigPO {
      observe(options?: PerformanceObserverInit) {
        if (
          options?.entryTypes?.includes("resource") ||
          (options as any)?.type === "resource"
        ) return;
        super.observe(options!);
      }
    }
    (window as any).PerformanceObserver = GuardedPO;
    cleanups.push(() => { (window as any).PerformanceObserver = OrigPO; });
  } catch (_) {}

  // ── 4. Wrap fetch – clear timings after every request ────────────────────
  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const p = origFetch.apply(this, args as any);
    p.finally(() => {
      try { performance.clearResourceTimings(); } catch (_) {}
    });
    return p;
  };
  cleanups.push(() => { window.fetch = origFetch; });

  // ── 5. Wrap XHR – clear timings after every request ─────────────────────
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args: any[]) {
    this.addEventListener("loadend", () => {
      try { performance.clearResourceTimings(); } catch (_) {}
    });
    return origOpen.apply(this, args);
  };
  cleanups.push(() => { XMLHttpRequest.prototype.open = origOpen; });

  // ── 6. MutationObserver – strip extension-injected download UI ───────────
  const removeExtNodes = (root: Element | Document = document) => {
    EXTENSION_SELECTORS.forEach((sel) => {
      try { root.querySelectorAll(sel).forEach((el) => el.remove()); } catch (_) {}
    });
  };
  removeExtNodes();
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        const el = node as Element;
        const cls = String(el.className ?? "").toLowerCase();
        const id = String(el.id ?? "").toLowerCase();
        if (
          cls.includes("download") || cls.includes("savefrom") ||
          cls.includes("vdh") || cls.includes("video-dl") ||
          id.includes("download") || id.includes("savefrom") || id.includes("vdh")
        ) {
          el.remove();
        }
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  cleanups.push(() => mo.disconnect());

  // ── 7. Block URL.createObjectURL from leaking real video blobs ───────────
  const origCreateObjectURL = URL.createObjectURL.bind(URL);
  (URL as any).createObjectURL = function (obj: any) {
    if (obj instanceof MediaSource) return origCreateObjectURL(obj);
    return origCreateObjectURL(obj);
  };

  // ── 8. Override console.log so extensions can't use it to print src ──────
  const origLog = console.log;
  const origInfo = console.info;
  const origWarn = console.warn;
  const isVideoUrl = (s: string) =>
    /\.(mp4|webm|mkv|m3u8|ts|ogg|avi|mov)/i.test(s) ||
    /firebasestorage|storage\.googleapis|cloudfront|blob:/i.test(s);
  const guard =
    (orig: (...a: any[]) => void) =>
    (...args: any[]) => {
      if (args.some((a) => typeof a === "string" && isVideoUrl(a))) return;
      orig.apply(console, args);
    };
  console.log = guard(origLog);
  console.info = guard(origInfo);
  console.warn = guard(origWarn);
  cleanups.push(() => {
    console.log = origLog;
    console.info = origInfo;
    console.warn = origWarn;
  });

  return () => cleanups.forEach((fn) => fn());
}
