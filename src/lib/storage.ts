"use client";

const KEYS = {
  root: "ms.root",
  lastFile: "ms.lastFile",
  editorOpen: "ms.editorOpen",
  sidebarOpen: "ms.sidebarOpen",
  sidebarWidth: "ms.sidebarWidth",
  editorPct: "ms.editorPct",
} as const;

function getItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export const storage = {
  getRoot(): string | null {
    return getItem(KEYS.root);
  },
  setRoot(v: string): void {
    setItem(KEYS.root, v);
  },
  getLastFile(): string | null {
    return getItem(KEYS.lastFile);
  },
  setLastFile(v: string): void {
    setItem(KEYS.lastFile, v);
  },
  getEditorOpen(): boolean {
    const v = getItem(KEYS.editorOpen);
    return v === null ? true : v === "1";
  },
  setEditorOpen(v: boolean): void {
    setItem(KEYS.editorOpen, v ? "1" : "0");
  },
  getSidebarOpen(): boolean {
    const v = getItem(KEYS.sidebarOpen);
    return v === null ? true : v === "1";
  },
  setSidebarOpen(v: boolean): void {
    setItem(KEYS.sidebarOpen, v ? "1" : "0");
  },
  getSidebarWidth(): number {
    const v = getItem(KEYS.sidebarWidth);
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 256;
  },
  setSidebarWidth(v: number): void {
    setItem(KEYS.sidebarWidth, String(Math.round(v)));
  },
  getEditorPct(): number {
    const v = getItem(KEYS.editorPct);
    const n = v ? parseFloat(v) : NaN;
    return Number.isFinite(n) && n > 0 && n < 1 ? n : 0.5;
  },
  setEditorPct(v: number): void {
    setItem(KEYS.editorPct, v.toFixed(4));
  },
};
