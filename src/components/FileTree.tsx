"use client";

import { useEffect, useRef, useState } from "react";
import type { FsEntry } from "@/lib/types";

type Props = {
  entries: FsEntry[];
  activePath: string | null;
  onSelect: (path: string) => void;
  level?: number;
};

export function FileTree({ entries, activePath, onSelect, level = 0 }: Props) {
  return (
    <ul className="text-sm">
      {entries.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          activePath={activePath}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </ul>
  );
}

function isAncestorOf(dirPath: string, filePath: string | null): boolean {
  if (!filePath) return false;
  return filePath === dirPath || filePath.startsWith(dirPath + "/");
}

function FileTreeNode({
  entry,
  activePath,
  onSelect,
  level,
}: {
  entry: FsEntry;
  activePath: string | null;
  onSelect: (path: string) => void;
  level: number;
}) {
  const onActivePath = entry.isDir && isAncestorOf(entry.path, activePath);
  const [open, setOpen] = useState(level < 1 || onActivePath);

  useEffect(() => {
    if (entry.isDir && isAncestorOf(entry.path, activePath)) {
      setOpen(true);
    }
  }, [activePath, entry.isDir, entry.path]);

  const indent = { paddingLeft: `${level * 12 + 8}px` };
  const isActive = !entry.isDir && activePath === entry.path;
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive && btnRef.current) {
      btnRef.current.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [isActive]);

  if (entry.isDir) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900"
          style={indent}
        >
          <span className="inline-block w-3 text-zinc-400">{open ? "v" : ">"}</span>
          <span className="text-zinc-700">{entry.name}</span>
        </button>
        {open && entry.children && entry.children.length > 0 && (
          <FileTree
            entries={entry.children}
            activePath={activePath}
            onSelect={onSelect}
            level={level + 1}
          />
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        ref={btnRef}
        type="button"
        onClick={() => onSelect(entry.path)}
        className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors ${
          isActive
            ? "bg-emerald-100 font-medium text-emerald-900"
            : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900"
        }`}
        style={indent}
      >
        <span className={`inline-block w-3 ${isActive ? "text-emerald-600" : "text-zinc-400"}`}>
          {isActive ? "*" : "."}
        </span>
        <span className="truncate">{entry.name}</span>
      </button>
    </li>
  );
}
