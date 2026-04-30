import { NextRequest, NextResponse } from "next/server";
import { writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { safeResolve, expandHome, PathSecurityError } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { root?: string; path?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { root: rootParam, path: subPath, content } = body;

  if (!rootParam || !subPath || typeof content !== "string") {
    return NextResponse.json({ error: "Missing root, path, or content" }, { status: 400 });
  }

  try {
    const absRoot = path.resolve(expandHome(rootParam));
    const absTarget = await safeResolve(absRoot, subPath);
    await writeFile(absTarget, content, "utf-8");
    const s = await stat(absTarget);
    return NextResponse.json({
      ok: true,
      path: subPath,
      mtime: s.mtimeMs,
      size: s.size,
    });
  } catch (err) {
    if (err instanceof PathSecurityError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
