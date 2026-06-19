# Timeline

## 1. Metadata

- **Name:** Timeline
- **Category:** Editor / panel
- **Status:** Stable
- **Source:** [`components/editor/Timeline.tsx`](../../components/editor/Timeline.tsx)

## 2. Overview

The bottom panel of the editor, mounted **only in animate mode**. A rounded
card holding playback transport, a frame ruler, per-layer duration bars with
keyframe diamonds, expandable property tracks, and an optional value-curve
graph. It is the primary surface for scrubbing, retiming, and shaping easing.

- **Use when:** the doc is open and the editor is in animate mode — it owns all
  time-based interaction (scrub, play, keyframe edit).
- **Don't use for:** static styling or structural edits (those live in the
  inspector / layer panel) or canvas-space transforms (the canvas overlay).

## 3. Anatomy

- **ResizeHandle** — horizontal divider pinned to the top edge; drags the card
  taller/shorter via `panels.timelineH`. See [resize-handle](./resize-handle.md).
- **TransportBar** — 40px row: skip-to-start / play-pause / skip-to-end, loop
  toggle, speed `select` (0.25×–2×), graph-mode toggle, the KeyframeToolbar,
  and a right-aligned frame readout (`seconds`, frame input, `/ op · fps`).
- **KeyframeToolbar** — appears only when a keyframe is selected: label, frame
  input (single selection), easing-preset `select`, easing-curve popover
  trigger, delete, and deselect.
- **Frame ruler** — 24px row; a 176px "Frames" gutter plus a scrubbable track
  with auto-spaced ticks (step chosen so labels stay ≥ 50px apart).
- **Layer rows** — 28px rows with a 176px label gutter (expand chevron + name)
  and a duration **bar** (drag to shift, edge handles to trim) carrying small
  keyframe diamonds.
- **Property tracks** — revealed when a layer is expanded: per-property rows
  (24px, 176px label) with draggable, selectable keyframe diamonds; double-click
  the lane to add a keyframe.
- **GraphView** — replaces the rows when graph mode is on: one bezier value
  curve per component, draggable points and easing handles.
- **Playhead** — primary-tinted vertical line + top triangle at the current
  frame, offset by the label gutter.
- **Snap guide** — amber vertical line + frame badge shown while a shift-drag
  snaps to a keyframe / layer edge / playhead.

## 4. Tokens used

- Surface: card is `--card`/`bg-card` with `--radius-panel`/`rounded-2xl`;
  ruler/transport gutters layer on `--card`, lanes on the `--background` tint.
- Bars: layer duration bars use `--secondary`/`bg-secondary` (idle),
  `--primary`/`bg-primary` (selected layer), `--muted`-style for hidden layers.
- Keyframes: diamonds and the snap guide use `--color-keyframe`
  (`bg-keyframe`/`fill-keyframe`); the selected diamond flips to `--primary`.
- Playhead: `--primary`/`bg-primary` line and triangle.
- Borders: `--border`/`border-border` for ruler/transport rules and row
  hairlines (at reduced opacity for inner lanes).
- Text: `--muted-foreground` for ticks, labels, and readouts;
  `--foreground` on hover / active rows. Selection rings use `--ring`.
- Type: `--text-ruler` on ruler ticks, `--text-meta` on track labels / readouts
  context, `--text-label` on layer names and transport readouts.
- Sizing: `--size-track-label`/`w-track-label` (176px) for every left gutter.
- Z-index: `--z-raised` on playhead, snap guide, and the selected diamond.
- Motion: `transition-transform` on diamond hover/selection scale;
  `transition-colors` on row hovers.

## 5. Props / API

```ts
export function Timeline(): JSX.Element | null;
```

- Takes no props; renders `null` when there is no doc.
- Reads `doc`, `currentFrame`, `selectedLayer`, `graphMode`, `snapGuide`, and
  `panels.timelineH` from the `useEditor` store; writes via `setCurrentFrame`,
  `selectLayer`, `setSnapGuide`, `setPanelSize`, and `update`.
- Internal: `TransportBar`, `KeyframeToolbar`, `LayerTrack`, `PropTrackRow`,
  `KeyframeDiamond`, `GraphView`, `GraphHandles`. Geometry helpers map frames ↔
  pixels (`frameToX` / `xToFrame`) against a measured `TrackGeometry`.

## 6. States

- **Default:** rows on the lane tint; idle diamonds `--color-keyframe`.
- **Hover:** layer label rows fill `accent`; unselected diamonds scale up;
  bar edge trim handles fade in.
- **Active / selected:** selected layer row + bar `--primary`; selected diamond
  `--primary` with a `--background` ring at `--z-raised`.
- **Focus:** numeric frame inputs show `ring-ring`.
- **Disabled:** easing-preset select disabled on the last keyframe; the
  curve-popover trigger disabled for multi-select, last keyframe, or `hold`.
- **Snapping:** amber guide + badge while a shift-drag is snapped.

## 7. Code example

```tsx
{
  /* Playhead — offset past the 176px label gutter */
}
<div
  className="pointer-events-none absolute bottom-0 top-0 z-raised w-px bg-primary"
  style={{ left: LABEL_W + playheadX }}
>
  <div
    className="absolute -left-[5px] top-0 h-0 w-0 border-x-[5px]
                  border-t-[6px] border-x-transparent border-t-primary"
  />
</div>;

{
  /* Keyframe diamond — amber idle, primary when selected */
}
<div
  className={cn(
    "absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45",
    "cursor-ew-resize border transition-transform",
    selected
      ? "z-raised scale-150 border-background bg-primary"
      : "border-transparent bg-keyframe hover:scale-125",
  )}
  style={{ left: x }}
/>;
```

## 8. Cross-references

- [resize-handle](./resize-handle.md) — the height divider above the card
- [easing-editor](./easing-editor.md) — the curve editor inside the popover
- [canvas-overlay](./canvas-overlay.md) — playhead-synced canvas selection
- [icon-button](./icon-button.md) — transport controls
- [popover](./popover.md) — the easing-curve popover
- Foundations: [color](../foundations/color.md), [elevation](../foundations/elevation.md),
  [typography](../foundations/typography.md)
