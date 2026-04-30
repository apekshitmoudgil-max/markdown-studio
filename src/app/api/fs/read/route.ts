import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { safeResolve, expandHome, PathSecurityError } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rootParam = searchParams.get("root");
  const subPath = searchParams.get("path");

  if (!rootParam || !subPath) {
    return NextResponse.json({ error: "Missing root or path parameter" }, { status: 400 });
  }

  try {
    const absRoot = path.resolve(expandHome(rootParam));
    const absTarget = await safeResolve(absRoot, subPath);
    const s = await stat(absTarget);
    if (!s.isFile()) {
      return NextResponse.json({ error: "Path is not a file" }, { status: 400 });
    }
    const content = await readFile(absTarget, "utf-8");
    return NextResponse.json({
      path: subPath,
      content,
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
