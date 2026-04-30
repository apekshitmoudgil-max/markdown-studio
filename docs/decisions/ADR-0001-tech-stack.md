# ADR-0001: Tech Stack for markdown-studio

**Date:** 2026-04-28
**Status:** Accepted

## Context

User wants a local-first replacement for online markdown previewers like markdownlivepreview.com. Requirements:
- Run on the user's machine (localhost web app, not cloud)
- Preview markdown with proper GitHub-flavored styling and syntax highlighting
- Save edits back to a real file on disk
- Refresh button to pick up edits made by external editors (the file lives on the Desktop and may be modified outside this app)
- Browse a directory of markdown files (file picker / directory tree)
- Collapsible editor panel

## Decision

Build with Next.js 15 (App Router, src dir, TypeScript strict, Tailwind v4). Filesystem access through Next.js API routes using Node `fs/promises`. Markdown rendering via react-markdown + remark-gfm + rehype-highlight + rehype-raw. Optional file watching via chokidar. App bound to localhost.

## Rationale

- **Next.js over Electron/Tauri**: Single-tool stack the user is already fluent in (matches Resume Copilot, Baby Bot, ContentVault, SchoolBot). One process for UI and filesystem. Lower complexity, faster to iterate. If a true desktop wrapper is wanted later, Tauri can wrap the same Next.js app.
- **App Router + src dir**: Project standard for new Next.js work in this workspace.
- **react-markdown over alternatives (marked, markdown-it directly)**: First-class React integration, plugin pipeline for GFM and code highlighting works out of the box.
- **Filesystem via API routes (not direct browser File System Access API)**: API routes give predictable cross-browser behavior and let us read arbitrary paths the user nominates, without per-file permission prompts. Acceptable because the app is intended to run only on the user's own machine.
- **Tailwind v4**: Project standard.

## Alternatives Considered

| Option | Why not |
|--------|---------|
| Electron desktop app | More setup, slower iteration, larger binary. Can wrap later. |
| Tauri desktop app | Same as Electron but lighter. Defer until the web version is validated. |
| Browser-only with File System Access API | Limited to Chromium, prompts on every directory open, friction for the user's daily flow. |
| Pure static HTML + JS (like the inspiration site) | Cannot save to disk. That is the whole reason the user is building this. |
| VS Code extension | The user explicitly wants a previewer, not an editor extension. Different ergonomics. |

## Consequences

- One terminal command (`npm run dev`) starts the app. Easy launchd plist later if desired.
- Filesystem access is unrestricted within the chosen root directory. Path-traversal protection is mandatory in API routes.
- App runs only on localhost, not exposed to network. No auth needed for single-user local use.
- Future features (file watching, multi-root, theme switching) fit cleanly into this stack.
