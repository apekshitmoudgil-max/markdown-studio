import path from "node:path";
import { realpath } from "node:fs/promises";

export class PathSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSecurityError";
  }
}

/**
 * Resolves a target path against a root and ensures the result stays inside the root.
 * Both paths are realpath-resolved so symlinks cannot escape the root.
 */
export async function safeResolve(root: string, target: string): Promise<string> {
  const absRoot = path.resolve(root);
  const absTarget = path.resolve(absRoot, target);

  let realRoot: string;
  let realTarget: string;
  try {
    realRoot = await realpath(absRoot);
  } catch {
    throw new PathSecurityError(`Root does not exist: ${absRoot}`);
  }

  try {
    realTarget = await realpath(absTarget);
  } catch {
    realTarget = absTarget;
  }

  const rel = path.relative(realRoot, realTarget);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new PathSecurityError(`Path escapes root: ${target}`);
  }
  return realTarget;
}

export function expandHome(p: string): string {
  if (p.startsWith("~")) {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return path.join(home, p.slice(1));
  }
  return p;
}
