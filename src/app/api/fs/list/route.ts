import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { safeResolve, expandHome, PathSecurityError } from "@/lib/paths";
import type { FsEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const MD_EXTS = new Set([".md", ".markdown", ".mdx", ".mdown", ".mkd"]);

async function listDir(absRoot: string, absDir: string, recursive: boolean): Promise<FsEntry[]> {
  const entries = await readdir(absDir, { withFileTypes: true });
  const out: FsEntry[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const entryAbs = path.join(absDir, entry.name);
    const entryRel = path.relative(absRoot, entryAbs);

    if (entry.isDirectory()) {
      const children = recursive ? await listDir(absRoot, entryAbs, true) : undefined;
      const hasMarkdown = children?.some((c) => c.isDir || MD_EXTS.has(path.extname(c.name).toLowerCase()));
      if (recursive && children && children.length === 0) continue;
      if (recursive && !hasMarkdown) continue;
      out.push({
        name: entry.name,
        path: entryRel,
        isDir: true,
        children,
      });
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!MD_EXTS.has(ext)) continue;
      const s = await stat(entryAbs);
      out.push({
        name: entry.name,
        path: entryRel,
        isDir: false,
        size: s.size,
        mtime: s.mtimeMs,
      });
    }
  }

  out.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return out;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rootParam = searchParams.get("root");
  const subPath = searchParams.get("path") ?? "";
  const recursive = searchParams.get("recursive") === "1";

  if (!rootParam) {
    return NextResponse.json({ error: "Missing root parameter" }, { status: 400 });
  }

  try {
    const absRoot = path.resolve(expandHome(rootParam));
    const absTarget = await safeResolve(absRoot, subPath);
    const s = await stat(absTarget);
    if (!s.isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
    }
    const entries = await listDir(absRoot, absTarget, recursive);
    return NextResponse.json({ root: absRoot, path: subPath, entries });
  } catch (err) {
    if (err instanceof PathSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
