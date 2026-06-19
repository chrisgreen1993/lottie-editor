# CanvasStage

## 1. Metadata

- **Name:** CanvasStage
- **Category:** Canvas / viewport
- **Status:** Stable
- **Source:** [`components/editor/CanvasStage.tsx`](../../components/editor/CanvasStage.tsx)

## 2. Overview

The center stage of the editor. Hosts a lottie-web SVG instance rendering the
document into a lifted, checkerboard-backed artboard, plus the floating chrome
that surrounds it: the bottom zoom/fit/background bar, and — in design mode
only — the left tool rail. It also owns the canvas-level pointer gestures:
shape drag-to-draw, pen drawing, click-to-select, and double-click-to-path-edit.

- **Use when:** a document is open — `Editor` mounts it as the primary work
  surface. Returns `null` when there is no `doc`.
- **Don't use for:** layer ordering or property editing (layer panel /
  inspector), transport controls (the timeline), or the selection handles
  themselves — those are drawn by [canvas-overlay](./canvas-overlay.md) and
  [path-edit-overlay](./path-edit-overlay.md), which CanvasStage hosts.

## 3. Anatomy

- **Scroll container** — fills the stage; ctrl/⌘-wheel zooms about the pointer.
- **Artboard** — fixed-size lifted card (`width/height = doc.w/h × scale`),
  `rounded-panel`, ring hairline, checkerboard when the background is `checker`.
- **Lottie host** — the inner `div` lottie-web renders into; CSS-scaled by the
  current zoom from a top-left origin.
- **Overlays** — [path-edit-overlay](./path-edit-overlay.md) when a path layer
  is being edited, otherwise [canvas-overlay](./canvas-overlay.md) in select
  mode. The in-progress draw rectangle and pen preview SVG also live here.
- **Tool rail** _(design mode only)_ — left, vertically centered floating
  `rounded-panel` column of [icon-button](./icon-button.md)s: Select / Rectangle /
  Ellipse / Star / Pen.
- **Pen hint banner** _(pen tool only)_ — top-centered chip of usage hints.
- **View bar** — bottom-centered floating bar: zoom out / percentage (reset
  to 100%) / zoom in / fit-to-view, a divider, then four background swatches
  (Checkerboard / Dark / Light / Document color).

## 4. Tokens used

- Surface: stage backdrop `bg-background`; the artboard lift uses `--shadow-canvas`
  (the floating rails currently use Tailwind `shadow-lg`/`shadow` — the canvas
  elevation token is the design-system intent). Floating rails sit on `--card`
  (translucent `bg-card/95`); the artboard ring is `--border`.
- Checkerboard: `bg-checker` composed from `--color-checker-base` /
  `--color-checker-tile`. Dark/Light/Document swatch fills map to
  `--color-canvas-dark` / `--color-canvas-light` and the document's own `bg`.
- Selection / draw affordances: `--primary` (draw-rect border + fill, pen
  stroke + vertices, swatch active ring).
- Text: `--muted-foreground` for the zoom readout and pen hint; `--foreground`
  on hover.
- Radius: concentric — `--radius-panel` on the artboard and the floating tool
  rail / view bar (surfaces); `--radius-control` on the tool and zoom buttons
  nested inside them.
- Z-index: overlays render above the lottie host inside the artboard; reach for
  `--z-raised` for stacked affordances.
- Motion: `transition-transform` on the background swatches (hover scale).
- **Not tokens:** the document's paper-plane placeholder artwork colors are
  sample _content_ carried in the Lottie JSON, not design-system tokens.

## 5. Props / API

```ts
function CanvasStage(): JSX.Element | null;
```

- Takes no props. All state is read from the `useEditor` store: `doc`, `zoom`,
  `canvasBg`, `tool`, `editorMode`, `pathEdit`, playback flags, and the matching
  setters (`setZoom`, `setCanvasBg`, `setTool`, `selectLayer`, `update`, …).
- Drawing commits go through `update()` (`addShapeLayer` / `addPathLayer` from
  [`lib/lottie/create`](../../lib/lottie/create.ts)); the live lottie instance
  is shared via [`playerBridge`](../../lib/playerBridge.ts).
- Tool / background unions: `CanvasTool = "select" | "rect" | "ellipse" |
"star" | "pen"`, `CanvasBackground = "checker" | "dark" | "light" | "doc"`
  (from [`lib/store`](../../lib/store.ts)).

## 6. States

- **Default (select tool):** cursor inherits; clicking the artwork hit-tests
  lottie's rendered layer groups and selects the topmost match, empty space
  clears selection.
- **Design vs Animate mode:** the left tool rail renders **only** in design
  mode (`editorMode === "design"`). Animate mode hides it, leaving select-only
  interaction with the artboard.
- **Shape tools (rect/ellipse/star):** `crosshair` cursor; drag draws a dashed
  `--primary` marquee (ellipse marquee is `rounded-full`); release adds the
  shape (a no-drag click drops a 160×160 default) and snaps back to select.
- **Pen tool:** `crosshair` cursor; click places vertices, drag pulls mirrored
  tangents, ⇧ constrains to 45°, clicking the enlarged first vertex (≥3 points)
  or Enter finishes, leaving the tool discards an unfinished path.
- **Double-click (select):** on a layer with an editable bezier path, pauses
  playback, selects it, and enters path-edit mode.
- **Hover:** background swatches scale up; zoom readout fills `--accent`.
- **Active:** current tool button and the `fit` button show the active state;
  the chosen background swatch gets a `--primary` ring.

## 7. Code example

```tsx
<div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-background">
  <div className="flex flex-1 items-center justify-center overflow-auto" onWheel={…}>
    <div className="flex min-h-full min-w-full items-center justify-center p-6">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-panel shadow-canvas ring-1 ring-border",
          canvasBg === "checker" && "bg-checker",
        )}
        style={{ width: doc.w * scale, height: doc.h * scale, ...stageBgStyle }}
        onClick={onStageClick}
        onDoubleClick={onStageDoubleClick}
        onPointerDown={onDrawStart}
      >
        <div ref={stageRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left" }} />
        {pathEdit !== null ? <PathEditOverlay /> : tool === "select" && <CanvasOverlay scale={scale} />}
      </div>
    </div>
  </div>

  {editorMode === "design" && (
    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
      <div className="pointer-events-auto flex flex-col gap-0.5 rounded-panel bg-card/95 px-1 py-1.5 shadow-panel backdrop-blur">
        {TOOLS.map((t) => (
          <IconButton key={t.id} label={t.label} active={tool === t.id}
            className="rounded-control" onClick={() => setTool(t.id)}>{t.icon}</IconButton>
        ))}
      </div>
    </div>
  )}
</div>
```

## 8. Cross-references

- [canvas-overlay](./canvas-overlay.md) — selection box + handles (select mode)
- [path-edit-overlay](./path-edit-overlay.md) — vertex editing (double-click a path)
- [icon-button](./icon-button.md) — tool rail + zoom buttons
- [mode-switcher](./mode-switcher.md) — toggles the design/animate distinction
- Foundations: [color](../foundations/color.md), [elevation](../foundations/elevation.md), [radius](../foundations/radius.md)
