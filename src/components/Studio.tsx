"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { parseLocation, pushLocation } from "@/lib/url";
import type { FsEntry } from "@/lib/types";
import { FileTree } from "./FileTree";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { RootPicker } from "./RootPicker";
import { ResizeHandle } from "./ResizeHandle";

const DEFAULT_ROOT = "~/Desktop";
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 520;
const EDITOR_MIN_PCT = 0.18;
const EDITOR_MAX_PCT = 0.82;

type SaveState = "clean" | "dirty" | "saving" | "saved" | "error";

export function Studio() {
  const [root, setRootState] = useState<string>("");
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [diskContent, setDiskContent] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("clean");
  const [editorOpen, setEditorOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [editorPct, setEditorPct] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const pendingFileRef = useRef<string | null>(null);

  useEffect(() => {
    const url = parseLocation();
    const r = url.root ?? storage.getRoot() ?? DEFAULT_ROOT;
    pendingFileRef.current = url.file ?? storage.getLastFile();
    setRootState(r);
    setEditorOpen(storage.getEditorOpen());
    setSidebarOpen(storage.getSidebarOpen());
    setSidebarWidth(storage.getSidebarWidth());
    setEditorPct(storage.getEditorPct());
    pushLocation({ root: r, file: pendingFileRef.current }, true);
  }, []);

  const refreshTree = useCallback(async (rootPath: string) => {
    setError(null);
    setTreeLoading(true);
    try {
      const res = await fetch(
        `/api/fs/list?root=${encodeURIComponent(rootPath)}&recursive=1`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load directory");
        setEntries([]);
        return;
      }
      setEntries(data.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEntries([]);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const loadFile = useCallback(
    async (filePath: string, opts?: { skipUrlPush?: boolean }) => {
      if (!root) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/fs/read?root=${encodeURIComponent(root)}&path=${encodeURIComponent(filePath)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to read file");
          return;
        }
        setActivePath(filePath);
        setContent(data.content);
        setDiskContent(data.content);
        setSaveState("clean");
        storage.setLastFile(filePath);
        if (!opts?.skipUrlPush) {
          pushLocation({ root, file: filePath });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [root]
  );

  useEffect(() => {
    if (!root) return;
    refreshTree(root);
    const fileToLoad = pendingFileRef.current;
    pendingFileRef.current = null;
    if (fileToLoad) loadFile(fileToLoad, { skipUrlPush: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);

  // Browser back/forward: re-sync state from URL.
  useEffect(() => {
    const onPop = () => {
      const url = parseLocation();
      const nextRoot = url.root ?? root;
      if (nextRoot && nextRoot !== root) {
        pendingFileRef.current = url.file;
        setRootState(nextRoot);
      } else if (url.file && url.file !== activePath) {
        loadFile(url.file, { skipUrlPush: true });
      } else if (!url.file && activePath) {
        setActivePath(null);
        setContent("");
        setDiskContent("");
        setSaveState("clean");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [root, activePath, loadFile]);

  const saveFile = useCallback(async () => {
    if (!root || !activePath) return;
    setSaveState("saving");
    setError(null);
    try {
      const res = await fetch("/api/fs/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ root, path: activePath, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        setSaveState("error");
        return;
      }
      setDiskContent(content);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "clean" : s)), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaveState("error");
    }
  }, [root, activePath, content]);

  const refreshFile = useCallback(async () => {
    if (!activePath) {
      if (root) await refreshTree(root);
      return;
    }
    await refreshTree(root);
    await loadFile(activePath);
  }, [activePath, root, refreshTree, loadFile]);

  const handleContentChange = useCallback(
    (next: string) => {
      setContent(next);
      setSaveState(next === diskContent ? "clean" : "dirty");
    },
    [diskContent]
  );

  const setRoot = useCallback((next: string) => {
    storage.setRoot(next);
    setActivePath(null);
    setContent("");
    setDiskContent("");
    setSaveState("clean");
    setRootState(next);
    pushLocation({ root: next, file: null });
  }, []);

  const toggleEditor = useCallback(() => {
    setEditorOpen((v) => {
      const next = !v;
      storage.setEditorOpen(next);
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((v) => {
      const next = !v;
      storage.setSidebarOpen(next);
      return next;
    });
  }, []);

  const handleSidebarResize = useCallback((dx: number) => {
    setSidebarWidth((w) => Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w + dx)));
  }, []);

  const commitSidebarWidth = useCallback(() => {
    storage.setSidebarWidth(sidebarWidth);
  }, [sidebarWidth]);

  const handleEditorResize = useCallback(
    (dx: number) => {
      const mainW = mainRef.current?.clientWidth ?? 0;
      if (mainW <= 0) return;
      setEditorPct((p) => {
        const next = p + dx / mainW;
        return Math.max(EDITOR_MIN_PCT, Math.min(EDITOR_MAX_PCT, next));
      });
    },
    []
  );

  const commitEditorPct = useCallback(() => {
    storage.setEditorPct(editorPct);
  }, [editorPct]);

  return (
    <div className="flex h-screen w-screen flex-col bg-white text-zinc-900">
      <Topbar
        root={root}
        onSetRoot={setRoot}
        onRefresh={refreshFile}
        onToggleEditor={toggleEditor}
        onToggleSidebar={toggleSidebar}
        onSave={saveFile}
        editorOpen={editorOpen}
        sidebarOpen={sidebarOpen}
        activePath={activePath}
        saveState={saveState}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <>
            <aside
              style={{ width: sidebarWidth }}
              className="shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50"
            >
              <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-500">
                <span className="flex items-center gap-2">
                  Files
                  {treeLoading && <Spinner />}
                </span>
                <button
                  type="button"
                  onClick={() => refreshTree(root)}
                  disabled={treeLoading}
                  className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-50"
                  title="Reload directory"
                >
                  refresh
                </button>
              </div>
              {treeLoading && entries.length === 0 ? (
                <div className="px-3 py-4 text-xs text-zinc-500">
                  Loading {root}.
                </div>
              ) : entries.length === 0 ? (
                <div className="px-3 py-4 text-xs text-zinc-500">
                  {error ? error : "No markdown files found in this directory."}
                </div>
              ) : (
                <FileTree entries={entries} activePath={activePath} onSelect={loadFile} />
              )}
            </aside>
            <ResizeHandle onResize={handleSidebarResize} onCommit={commitSidebarWidth} />
          </>
        )}

        <main ref={mainRef} className="flex flex-1 overflow-hidden">
          {editorOpen ? (
            <>
              <section
                style={{ width: `${editorPct * 100}%` }}
                className="flex shrink-0 flex-col"
              >
                <PaneHeader label={activePath ? activePath : "No file open"} muted={!activePath} />
                <div className="flex-1 overflow-hidden">
                  <Editor
                    value={content}
                    onChange={handleContentChange}
                    onSave={saveFile}
                    disabled={!activePath || loading}
                  />
                </div>
              </section>
              <ResizeHandle onResize={handleEditorResize} onCommit={commitEditorPct} />
              <section className="flex flex-1 flex-col">
                <PaneHeader label="Preview" />
                <div className="flex-1 overflow-hidden">
                  <Preview source={content || "*Pick a file to preview.*"} fluid={false} />
                </div>
              </section>
            </>
          ) : (
            <section className="flex flex-1 flex-col">
              <PaneHeader
                label={activePath ? `Preview. ${activePath}` : "Preview"}
                muted={!activePath}
              />
              <div className="flex-1 overflow-hidden">
                <Preview source={content || "*Pick a file to preview.*"} fluid />
              </div>
            </section>
          )}
        </main>
      </div>
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

function Topbar(props: {
  root: string;
  onSetRoot: (v: string) => void;
  onRefresh: () => void;
  onToggleEditor: () => void;
  onToggleSidebar: () => void;
  onSave: () => void;
  editorOpen: boolean;
  sidebarOpen: boolean;
  activePath: string | null;
  saveState: SaveState;
}) {
  const {
    root,
    onSetRoot,
    onRefresh,
    onToggleEditor,
    onToggleSidebar,
    onSave,
    editorOpen,
    sidebarOpen,
    activePath,
    saveState,
  } = props;

  return (
    <header className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? "Hide files" : "Show files"}
        </button>
        <button
          type="button"
          onClick={onToggleEditor}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
          title={editorOpen ? "Collapse editor" : "Expand editor"}
        >
          {editorOpen ? "Hide editor" : "Show editor"}
        </button>
      </div>
      <div className="h-5 w-px bg-zinc-200" />
      <span className="text-sm font-semibold tracking-tight text-zinc-800">markdown-studio</span>
      <div className="h-5 w-px bg-zinc-200" />
      <RootPicker initial={root} onSet={onSetRoot} />
      <div className="ml-auto flex items-center gap-2">
        <SaveBadge state={saveState} />
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
          title="Reload current file from disk"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!activePath || saveState === "clean" || saveState === "saving"}
          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          title="Save (Cmd/Ctrl+S)"
        >
          Save
        </button>
      </div>
    </header>
  );
}

function PaneHeader({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div
      className={`flex h-9 items-center border-b border-zinc-200 bg-zinc-50 px-3 font-mono text-[11px] uppercase tracking-wider ${
        muted ? "text-zinc-400" : "text-zinc-500"
      }`}
    >
      {label}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-label="loading"
      className="inline-block h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-emerald-500"
    />
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map: Record<SaveState, { text: string; cls: string }> = {
    clean: { text: "saved", cls: "text-zinc-400" },
    dirty: { text: "unsaved changes", cls: "text-amber-600" },
    saving: { text: "saving.", cls: "text-zinc-500" },
    saved: { text: "saved", cls: "text-emerald-600" },
    error: { text: "save failed", cls: "text-red-600" },
  };
  const { text, cls } = map[state];
  return <span className={`text-[11px] uppercase tracking-wider ${cls}`}>{text}</span>;
}
