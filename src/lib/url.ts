"use client";

export type Location = {
  root: string | null;
  file: string | null;
};

export function parseLocation(): Location {
  if (typeof window === "undefined") return { root: null, file: null };
  const params = new URLSearchParams(window.location.search);
  const root = params.get("root");
  const file = params.get("file");
  return {
    root: root && root.trim() ? root : null,
    file: file && file.trim() ? file : null,
  };
}

export function buildHref(loc: Partial<Location>): string {
  const params = new URLSearchParams();
  if (loc.root) params.set("root", loc.root);
  if (loc.file) params.set("file", loc.file);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function pushLocation(loc: Partial<Location>, replace = false): void {
  if (typeof window === "undefined") return;
  const next = buildHref(loc);
  const current = window.location.pathname + window.location.search;
  if (next === current) return;
  if (replace) {
    window.history.replaceState(null, "", next);
  } else {
    window.history.pushState(null, "", next);
  }
}
