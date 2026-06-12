# Lottie Editor

A browser-based [Lottie animation](https://lottie.github.io/) editor — inspect, restyle, retime and export Lottie files without leaving the page.

## Features

**Import & create**

- Drag & drop a `.json` anywhere, browse files, load from a URL, try the bundled example — or start from a blank composition
- Shape tools: draw rectangles, ellipses and stars directly on the canvas (`V`/`R`/`E`/`S`); a click drops a default-sized shape
- Validation with friendly errors; sessions are autosaved and restored on reload

**Edit**

- Canvas manipulation: click a layer on the canvas to select it, drag to move, corner handles to scale, rotate handle (⇧ snaps to 15°) — all keyframe-aware with After Effects-style auto-keying at the playhead
- Layer panel: select, rename (double-click), show/hide, drag to reorder, duplicate and delete layers
- Resizable layout: drag the panel dividers and the timeline edge; sizes persist between sessions
- Inspector: document size, frame rate and duration; per-layer transform (position, scale, rotation, opacity, anchor) for non-keyframed properties
- Colors: edit fills, strokes, gradient stops and solid layers — including layers nested inside precomps; the document **palette** recolors every use of a color at once
- Stroke width editing
- Full undo/redo history

**Timeline & keyframes**

- Frame ruler with scrubbing playhead, play/pause, loop and playback speed
- Per-layer bars: drag to shift a layer in time, drag the edges to trim in/out points
- Hold `⇧` while dragging keyframes, layer bars or the playhead to snap to nearby keyframes, layer bounds and the playhead
- Expandable per-property tracks for every animated property
- Drag keyframes to retime them, double-click a track to add one, delete from the keyframe toolbar
- Easing presets (linear, smooth, ease in/out, hold) plus an interactive bezier curve editor per segment
- Inspector "stopwatch" diamonds: animate a static property, add/remove keys at the playhead — values follow the playhead and become editable when parked on a key

**Export**

- Pretty or minified Lottie JSON, dotLottie (`.lottie`), or copy JSON to the clipboard

**Keyboard shortcuts**

| Keys                | Action                            |
| ------------------- | --------------------------------- |
| `Space`             | Play / pause                      |
| `←` / `→` (`⇧` ×10) | Step frames                       |
| `⌘Z` / `⇧⌘Z`        | Undo / redo                       |
| `⌘D`                | Duplicate selected layer          |
| `⌫`                 | Delete selected keyframe or layer |
| `Esc`               | Deselect                          |

## Architecture

- **Next.js 14 + TypeScript + Tailwind** — single-page client app
- **zustand** store with snapshot-based undo/redo (`lib/store.ts`)
- Pure Lottie-document operations in `lib/lottie/` (parsing, color collection, transforms, keyframes, layer ops)
- **lottie-web** drives the canvas directly via an imperative bridge (`lib/playerBridge.ts`) so scrubbing stays frame-accurate
- Editor UI in `components/editor/` (top bar, layer panel, canvas stage, inspector, timeline)

## Development

```bash
npm install
npm run dev   # http://localhost:3000
npm run build
npm run lint
```
