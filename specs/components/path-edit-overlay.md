# PathEditOverlay

## 1. Metadata

- **Name:** PathEditOverlay
- **Category:** Canvas / path editing
- **Status:** Stable
- **Source:** [`components/editor/PathEditOverlay.tsx`](../../components/editor/PathEditOverlay.tsx)

## 2. Overview

The vertex/tangent editing surface for a single path layer. It draws each
editable path's outline plus draggable vertex and tangent handles, and a small
toolbar of contextual actions (Cut here / Close path / Done). Like
[canvas-overlay](./canvas-overlay.md) it edits at pointer speed: drags write the
new geometry straight into the rendered SVG `d` (when the layer is a single
path) and into local state, committing one document write on release.

- **Use when:** a path layer is in path-edit mode — entered by double-clicking a
  path layer on the canvas (or a quick double-press on its selection box). It
  replaces [canvas-overlay](./canvas-overlay.md) while active; hosted by
  [canvas-stage](./canvas-stage.md).
- **Don't use for:** moving/scaling/rotating the whole layer (that's
  [canvas-overlay](./canvas-overlay.md)) or editing animated paths — those are
  shown locked and read-only.

## 3. Anatomy

- **Toolbar** — top-centered floating chip on `--card`: layer name + inline
  usage hints, then contextual `✂ Cut here` and `Close path` buttons (shown for
  a non-animated selected vertex) and a `Done (Esc)` button. Buttons are
  `--secondary` pills.
- **Path skeleton** — per path, a visible `--primary` outline plus a wide
  invisible hit-stroke (`cursor-copy`) for click-to-insert; animated paths draw
  in `--muted-foreground` with no hit stroke.
- **Vertex handles** — small squares on each vertex: idle filled
  `--primary/70`, selected hollow with a 2px `--primary` border, animated
  vertices muted and locked.
- **Tangent handles** — for the selected vertex, round `--primary` handles on a
  thin connector line out to each non-zero in/out tangent.

## 4. Tokens used

- Stroke / fill: `--primary` for editable outlines (`stroke-primary/70`),
  vertices, tangent connectors, and tangent handles; `--muted-foreground` for
  locked animated paths.
- Surface: toolbar on `--card` (`bg-card/95`) with `--border` hairline; handle
  fills on `--background`; toolbar buttons on `--secondary`.
- Text: `--muted-foreground` for the hint string.
- Radius: `--radius-handle` (`rounded-handle`) on vertex squares; tangent
  handles are true circles (`rounded-full`); the floating toolbar is a surface
  (`rounded-panel`).
- Note on amber: vertex/tangent handles render in `--primary` (sky) in the
  current source, not amber — the amber accent token `--color-keyframe` is
  reserved for keyframe affordances (timeline/easing), not path handles.

## 5. Props / API

```ts
function PathEditOverlay(): JSX.Element | null;
```

- Takes no props. Reads `doc`, `pathEdit` (the layer index under edit),
  `currentFrame`, `update`, and `setPathEdit` from `useEditor`; returns `null`
  when not in path-edit mode.
- Geometry helpers come from [`lib/lottie/bezier`](../../lib/lottie/bezier.ts)
  (`splitSegment`, `cutAtVertex`, `closePath`, `removeVertex`,
  `autoSmoothVertex`, `isCornerVertex`, `constrain45`, `pathToD`, …) and
  editable paths from
  [`lib/lottie/pathEdit`](../../lib/lottie/pathEdit.ts) (`collectEditablePaths`).
  Commits use `lodash` `set` into the path's `dataPath`.

## 6. States

- **Default:** outlines + vertex squares drawn; clicking the outline inserts a
  vertex at the nearest point on the segment and selects it.
- **Hover:** idle vertices scale up (`hover:scale-125`); the hit stroke shows
  `cursor-copy`.
- **Selected vertex:** hollow bordered square; its in/out tangent handles and
  connector lines appear; Cut/Close toolbar actions enable.
- **Active (dragging):** vertex or tangent drags update geometry locally and
  repaint the artwork `d` directly; ⇧ snaps to 45°, ⌥ breaks the otherwise
  mirrored tangent pair. Commit happens once on pointer up.
- **Double-press (vertex):** toggles corner ↔ smooth (auto-smooth, or zeroed
  tangents).
- **Disabled / locked:** animated paths render muted and ignore all pointer
  edits; Cut/Close are guarded for endpoints of open paths and minimum vertex
  counts. `⌫`/`Delete` removes the selected vertex (above the minimum).

## 7. Code example

```tsx
<div
  ref={rootRef}
  className="pointer-events-none absolute inset-0"
  data-canvas-overlay
>
  <div
    className="pointer-events-auto absolute left-1/2 top-2 z-raised flex -translate-x-1/2
                  items-center gap-2 rounded-panel border border-border bg-card/95 px-2.5 py-1
                  text-label shadow-panel backdrop-blur"
  >
    <span className="text-muted-foreground">
      {layerName(layer, layerIndex)} · click outline to add a point …
    </span>
    <button
      className="rounded bg-secondary px-1.5 py-0.5 text-meta font-medium hover:bg-secondary/80"
      onClick={cutSelected}
    >
      ✂ Cut here
    </button>
    <button
      className="rounded bg-secondary px-1.5 py-0.5 text-meta font-medium hover:bg-secondary/80"
      onClick={() => setPathEdit(null)}
    >
      Done (Esc)
    </button>
  </div>

  {/* selected vertex */}
  <div
    className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2
               cursor-move rounded-handle border-2 border-primary bg-background"
    style={{ left: pos[0], top: pos[1] }}
    onPointerDown={(e) => beginPointDrag(e, p, pi, vi, "v")}
  />
</div>
```

## 8. Cross-references

- [canvas-stage](./canvas-stage.md) — hosts this overlay; double-click enters it
- [canvas-overlay](./canvas-overlay.md) — the box this overlay replaces
- [easing-editor](./easing-editor.md) — the other draggable-handle bezier surface
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md), [elevation](../foundations/elevation.md)
