# markdown-studio. Architecture

## System Overview

A localhost web app for previewing and editing markdown files that live on the user's machine. The user picks a root directory, the app shows a tree of files in that directory, and clicking a file loads it into a split view: an editor on the left (collapsible) and a styled preview on the right. Save writes back to the same path. A refresh button re-reads the file from disk to pick up changes made by external editors.

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 15 App Router | Single process for UI + filesystem API, simple to run locally |
| Language | TypeScript strict | Project standard |
| Styling | Tailwind CSS v4 | Project standard |
| Markdown render | react-markdown + remark-gfm | GitHub-flavored markdown |
| Code highlighting | rehype-highlight (highlight.js) | Built-in themes, no config |
| HTML in markdown | rehype-raw | Allow inline HTML in markdown source |
| Filesystem access | Node `fs/promises` in API routes | Standard, no extra deps |
| File watch (future) | chokidar | Auto-refresh on external edits |

## Key Components

### Frontend (`src/app/`, `src/components/`)
- `app/page.tsx`: Three-panel layout (file tree, editor, preview)
- `components/FileTree.tsx`: Directory browser with expand/collapse, file selection
- `components/Editor.tsx`: Collapsible textarea editor with save indicator
- `components/Preview.tsx`: Styled markdown preview pane
- `components/RootPicker.tsx`: Set the root directory the app browses

### API (`src/app/api/fs/`)
- `list/route.ts`: List entries (files + dirs) under a given path, recursive option
- `read/route.ts`: Return file contents for a given path
- `save/route.ts`: Write file contents to a given path

### Library (`src/lib/`)
- `paths.ts`: Path validation, root-relative resolution, traversal protection
- `storage.ts`: localStorage helpers for persisting root directory

## Data Model

No database. State lives in:

| Where | What |
|-------|------|
| Disk (user's Desktop) | The actual markdown files |
| localStorage | Root directory path, sidebar collapsed state, last opened file |
| React state | Current file content, dirty flag, file list |

## Security

- Filesystem API routes always reject paths that resolve outside the configured root directory
- App binds to `localhost` only (Next.js default). Not exposed to network.
- No authentication. Single-user local tool.
