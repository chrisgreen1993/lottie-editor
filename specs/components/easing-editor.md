# EasingEditor

## 1. Metadata

- **Name:** EasingEditor
- **Category:** Timeline / keyframes
- **Status:** Stable
- **Source:** [`components/editor/EasingEditor.tsx`](../../components/editor/EasingEditor.tsx)

## 2. Overview

The interactive cubic-bezier curve editor used by the keyframe toolbar to shape
the easing of a selected keyframe segment. It renders a square SVG grid with the
fixed linear baseline, the live easing curve, and two draggable handles — `o`
(outgoing, from the keyframe) and `i` (incoming, into the next keyframe) —
matching Lottie's easing model.

- **Use when:** editing a keyframe's easing — opened from the keyframe toolbar's
  "Edit easing curve" popover in [`Timeline`](../../components/editor/Timeline.tsx).
- **Don't use for:** picking a named preset (the toolbar offers preset buttons
  alongside it) or editing position/transform paths (that's
  [path-edit-overlay](./path-edit-overlay.md)).

## 3. Anatomy

- **Plot** — square SVG (`168×168`, `14px` inset) on `--background` with a
  `--border` hairline frame.
- **Grid** — quarter gridlines at 0.25 / 0.5 / 0.75 in `--border/60`.
- **Baseline** — dashed `--border` diagonal from start to end (the linear
  reference).
- **Handle arms** — thin `--muted-foreground` lines from each endpoint to its
  handle.
- **Curve** — the cubic-bezier path in `--primary`, 2px.
- **Endpoints** — small fixed `--foreground` dots at (0,0) and (1,1).
- **Handles** — two larger draggable dots with a `--background` outline: the
  outgoing handle on `--primary`, the incoming handle on the amber keyframe
  accent. `cursor-grab` → `grabbing`.

## 4. Tokens used

- Stroke / fill: `--primary` for the curve and the outgoing handle;
  `--color-keyframe` (amber) for the incoming handle — tying it to keyframe
  identity (`fill-amber-400` in source maps to the `--color-keyframe`
  intent / `fill-keyframe`). `--foreground` for endpoints,
  `--muted-foreground` for handle arms, `--border` (and `/60`) for grid and
  baseline.
- Surface: plot on `--background` with a `--border` frame; handle outlines use
  `--background` (`stroke-background`).
- Radius: the SVG frame uses the base `--radius` (`rounded`).
- Sizing: the `168px` plot and `14px` padding are local layout constants, not
  design-system tokens.
- Motion: none — the curve and handles update synchronously on pointer move.

## 5. Props / API

```ts
interface Handles {
  o: { x: number; y: number };
  i: { x: number; y: number };
}

function EasingEditor({
  value,
  onChange,
}: {
  value: Handles;
  onChange: (handles: Handles) => void;
}): JSX.Element;
```

- `value` — current outgoing (`o`) and incoming (`i`) handles in normalized
  bezier space (x clamped 0–1, y allowed −0.4–1.4 for overshoot).
- `onChange` — fired continuously during a drag with the updated handle pair;
  the parent (`Timeline`) maps it back onto the keyframe's easing.

## 6. States

- **Default:** static curve, grid, baseline, and endpoints rendered from
  `value`.
- **Hover:** handles show `cursor-grab`.
- **Active (dragging):** the grabbed handle (`o` or `i`) follows the pointer
  (`active:cursor-grabbing`), values are normalized + clamped via `fromPx`, and
  `onChange` streams the new `Handles` so the curve repaints live.
- No disabled/focus states — the control is always interactive while mounted in
  the popover.

## 7. Code example

```tsx
<EasingEditor
  value={{ o: easing.o, i: easing.i }}
  onChange={(handles) => applyEasing(handles)}
/>

// inside EasingEditor
<path
  d={`M ${x0} ${y0} C ${ox} ${oy}, ${ix} ${iy}, ${x1} ${y1}`}
  fill="none" className="stroke-primary" strokeWidth={2} />
<circle cx={ox} cy={oy} r={6}
  className="cursor-grab fill-primary stroke-background active:cursor-grabbing"
  strokeWidth={2} onPointerDown={startDrag("o")} />
<circle cx={ix} cy={iy} r={6}
  className="cursor-grab fill-keyframe stroke-background active:cursor-grabbing"
  strokeWidth={2} onPointerDown={startDrag("i")} />
```

## 8. Cross-references

- [path-edit-overlay](./path-edit-overlay.md) — the other draggable-bezier editor
- [popover](./popover.md) — the surface the keyframe toolbar opens it in
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md), [motion](../foundations/motion.md)
