# markdown-studio

A local-first markdown previewer + editor that runs on `localhost`. Browse a directory of `.md` files, preview them with GitHub-flavored styling and syntax highlighting, edit in place, save with Cmd/Ctrl+S, and refresh from disk when external tools change the file. Each open file gets a stable URL so you can bookmark tabs and restore browser tab groups.

Built because online markdown previewers (e.g. markdownlivepreview.com) cannot save and have no notion of "this is a specific file on disk".

## Features

- Three-pane layout: file tree, editor, preview, all panes resizable via drag handles
- File tree auto-expands to and highlights the active file on bookmarked URLs
- Save with **Cmd/Ctrl+S**; **Refresh** button re-reads the file from disk
- URL-based file state (`?root=<dir>&file=<path>`) so each tab is bookmarkable and tab groups restore
- GitHub-flavored markdown rendering (tables, task lists, code highlighting, blockquotes, inline HTML)
- Light theme, monospace editor, github-light syntax theme for code blocks
- localStorage persistence for sidebar/editor open state, panel widths, last opened file
- Path-traversal protection on all filesystem API routes

## Prerequisites

- Node.js 20 or newer (tested on Node 25)
- npm 10 or newer
- macOS recommended. Should work on Linux/Windows but only macOS has been verified.

## Quick start

```bash
git clone https://github.com/apekshitmoudgil-max/markdown-studio.git
cd markdown-studio
npm install
npm run dev
```

Open http://localhost:3000.

By default the app browses your `~/Desktop`. Type any other directory path in the topbar and click **Open**. Tilde (`~`) expansion works.

## Use it daily (production build)

Dev mode is fine while hacking on the app, but the production build is faster and you can bind it to a fixed port:

```bash
npm run build
npx next start -p 4321
```

Bookmark `http://localhost:4321/?root=~/Desktop` and you are set. Each file you open gets its own URL like `http://localhost:4321/?root=~/Desktop&file=notes/today.md`, so you can bookmark per-file or save them in a browser tab group.

### Auto-start on login (macOS)

Drop a `launchd` plist at `~/Library/LaunchAgents/com.local.markdown-studio.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.local.markdown-studio</string>
  <key>WorkingDirectory</key>
  <string>/absolute/path/to/markdown-studio</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/npx</string>
    <string>next</string>
    <string>start</string>
    <string>-p</string>
    <string>4321</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/markdown-studio.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/markdown-studio.log</string>
</dict>
</plist>
```

Edit the `WorkingDirectory` path to point to your clone, then:

```bash
launchctl load ~/Library/LaunchAgents/com.local.markdown-studio.plist
```

The server will start on every login and stay running. To stop:

```bash
launchctl unload ~/Library/LaunchAgents/com.local.markdown-studio.plist
```

## How to use the UI

1. **Topbar**: type the absolute or `~`-relative path to the directory you want to browse, click **Open**.
2. **File tree (left)**: click a `.md` file to open it. The tree auto-expands the path to the active file.
3. **Editor (middle)**: edit the file. Cmd/Ctrl+S saves. The badge in the topbar shows save state.
4. **Preview (right)**: rendered markdown updates as you type.
5. **Hide editor / Hide files**: collapse panes for a focused view.
6. **Drag the dividers** between panes to resize. Widths persist per browser via localStorage.
7. **Refresh**: reloads the file tree and the currently open file from disk. Use this if you edited the file in another tool.
8. **URL**: each open file has a stable URL. Bookmark it. Add tabs to a group; the group will restore the same files on browser restart.

## Tech stack

- Next.js (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS v4
- react-markdown + remark-gfm + rehype-highlight + rehype-raw
- highlight.js (github light theme for code blocks)

## Architecture

See `docs/architecture.md` and `docs/decisions/ADR-0001-tech-stack.md` for the design rationale and the rejected alternatives (Electron, Tauri, browser-only File System Access API).

## Security notes

- The app binds to `localhost` by default. Don't expose it to the network without adding auth.
- Filesystem API routes resolve every request against the configured root via `realpath` and reject any path that escapes it. Directory-traversal protection is enforced server-side.
- localStorage stores only client-side state (panel widths, last opened file).

## Limitations

- The URL stores a path, not a stable ID. If you rename or move a file outside the app, bookmarked URLs go stale and the read API returns an error. Tree refresh will pick up the new name, but the URL has to be updated by hand.
- No auth, no multi-user. Single-user local tool.
- Recursive directory listing can be slow for very large directory trees (~5-10s for a deeply nested `~/Desktop`). The sidebar shows a loading state while the walk runs.

## License

MIT. See [LICENSE](./LICENSE).
