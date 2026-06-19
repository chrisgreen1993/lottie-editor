# CanvasOverlay

## 1. Metadata

- **Name:** CanvasOverlay
- **Category:** Canvas / selection
- **Status:** Stable
- **Source:** [`components/editor/CanvasOverlay.tsx`](../../components/editor/CanvasOverlay.tsx)

## 2. Overview

The transform gizmo drawn over the selected layer: a bounding box with four
corner scale handles and a rotate handle above it. Dragging it transforms the
layer's rendered SVG node directly for a live, lag-free preview and commits one
auto-keyed write to the document on release. The box tracks the layer's screen
position on a rAF loop, and is frozen + moved by a single CSS transform for the
duration of a drag.

- **Use when:** the select tool is active and a layer is selected — hosted by
  [canvas-stage](./canvas-stage.md) inside the artboard.
- **Don't use for:** vertex/path editing (that's
  [path-edit-overlay](./path-edit-overlay.md), which replaces this overlay) or
  numeric transform entry (the inspector). Renders an empty hidden `div` when
  nothing is selected.

## 3. Anatomy

- **Frame wrapper** — full-bleed `div` that carries the single drag transform so
  the box and handles move as one unit; transform origin is set to the box
  center at drag start.
- **Bounding box** — `--primary` hairline rectangle sized to the layer's screen
  box; `cursor-move`, drags the layer (`move`).
- **Corner handles** — four small square handles, half-translated onto the
  corners, `--primary` border on `--background`; `nwse`/`nesw` resize cursors;
  drag scales the layer (`scale`).
- **Rotate handle** — round `--primary` button with a `RotateCw` glyph, floated
  above the box; `cursor-grab` → `grabbing`; drag rotates (⇧ snaps to 15°).

## 4. Tokens used

- Stroke / fill: `--primary` for the box border and all handle borders (the box
  uses `border-primary/90`).
- Handle surface: `--background`; the rotate glyph is `text-primary`.
- Radius: corner handles use `--radius-handle` (`rounded-handle`); the rotate
  handle is a true circle (`rounded-full`).
- Z-index: drawn above the lottie host inside the artboard; reach for
  `--z-raised` when stacking against other in-canvas affordances.
- Motion: none declared — movement is driven imperatively (rAF tracking + a
  live CSS `transform`), not a CSS transition.

## 5. Props / API

```ts
function CanvasOverlay({ scale }: { scale: number }): JSX.Element;

type DragMode = "move" | "scale" | "rotate";
```

- `scale` — the current canvas zoom factor, used to convert pointer delta to
  document units and to keep the screen box accurate as zoom changes.
- All other state comes from `useEditor` (`doc`, `selectedLayer`, `update`,
  `setPlaying`). The live node is reached via
  [`playerBridge`](../../lib/playerBridge.ts); the release commit goes through
  `setTransformAtPlayhead` from
  [`lib/lottie/transformEdit`](../../lib/lottie/transformEdit.ts).

## 6. States

- **Default:** box + handles tracked to the selected layer via a rAF measure
  loop that only re-renders on a >0.5px change; first measure is synchronous so
  the box appears with the selection.
- **Hover:** native resize / move / grab cursors per handle (no color change).
- **Active (dragging):** measurement is frozen (`draggingRef`), the layer's SVG
  node gets a live preview `transform`, and the frame wrapper mirrors it with an
  equivalent screen-space transform so the box never stutters. On release both
  are reconciled in the same frame — the box snaps to the committed position and
  the wrapper transform clears — to avoid the box flashing back to origin.
- **Double-press (move handle):** a quick second press on the box (within 350ms
  / 6px) opens path editing for a layer with an editable path, instead of
  starting a move.
- **No selection:** returns a hidden `div` (no box rendered).

## 7. Code example

```tsx
<div ref={rootRef} className="pointer-events-none absolute inset-0" data-canvas-overlay>
  <div ref={frameRef} className="pointer-events-none absolute inset-0">
    <div
      className="pointer-events-auto absolute cursor-move border border-primary/90"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      onPointerDown={(e) => beginDrag(e, "move")}
    />
    {corners.map((c) => (
      <div key={c.key}
        className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2
                   rounded-handle border border-primary bg-background"
        style={{ left: c.left, top: c.top, cursor: … }}
        onPointerDown={(e) => beginDrag(e, "scale")} />
    ))}
    <div
      className="pointer-events-auto absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2
                 cursor-grab items-center justify-center rounded-full border border-primary
                 bg-background text-primary active:cursor-grabbing"
      style={{ left: box.left + box.width / 2, top: Math.max(12, box.top - 18) }}
      onPointerDown={(e) => beginDrag(e, "rotate")}>
      <RotateCw size={10} />
    </div>
  </div>
</div>
```

## 8. Cross-references

- [canvas-stage](./canvas-stage.md) — hosts this overlay in select mode
- [path-edit-overlay](./path-edit-overlay.md) — replaces it for vertex editing
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md), [motion](../foundations/motion.md)
