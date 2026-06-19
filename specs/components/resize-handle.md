# ResizeHandle

## 1. Metadata

- **Name:** ResizeHandle
- **Category:** Layout / primitive
- **Status:** Stable
- **Source:** [`components/editor/ResizeHandle.tsx`](../../components/editor/ResizeHandle.tsx)

## 2. Overview

A thin draggable divider for resizing adjacent panels. It is presentation +
pointer plumbing only: it reports cumulative pointer deltas from the drag start
and leaves the caller to combine them with a captured size. Used between the
layer panel / canvas / inspector (vertical) and above the timeline (horizontal).

- **Use when:** two regions share an edge and the user should be able to drag
  that edge to redistribute space.
- **Don't use for:** moving content, reordering, or anything that needs absolute
  positioning — it only emits deltas.

## 3. Anatomy

- **Hit strip** — a `role="separator"` div, 1 unit thick on its resize axis,
  transparent until interaction; the cursor reflects the axis
  (`col-resize` / `row-resize`).
- **Pointer logic** — `onPointerDown` captures the pointer, fires `onStart`,
  then streams `onDrag(dx, dy)` deltas relative to the start point until
  pointer-up.

## 4. Tokens used

- Surface: transparent at rest; hover tints `--primary` (at half strength),
  active fills `--primary`/`bg-primary`.
- Z-index: `--z-sticky`/`z-20` so the strip stays grabbable above panel content
  (e.g. the timeline resize handle).
- Motion: `transition-colors` on the hover/active tint change.

## 5. Props / API

```ts
export function ResizeHandle({
  orientation,
  onStart,
  onDrag,
  className,
}: {
  orientation: "vertical" | "horizontal";
  onStart: () => void;
  onDrag: (dx: number, dy: number) => void;
  className?: string;
}): JSX.Element;
```

- `orientation` — `"vertical"` is a column divider (`w-1`, `col-resize`),
  `"horizontal"` a row divider (`h-1`, `row-resize`).
- `onStart` — called on pointer-down; capture the current panel size here.
- `onDrag` — cumulative `(dx, dy)` from the drag origin; combine with the
  captured size (e.g. `startHeight - dy` for the timeline).
- `className` — positioning overrides (the timeline pins it to its top edge).

## 6. States

- **Default:** transparent (only the cursor signals it is grabbable).
- **Hover:** `--primary` at half strength.
- **Active:** solid `--primary` while dragging.

## 7. Code example

```tsx
{
  /* Above the timeline: drag up to grow, down to shrink */
}
<ResizeHandle
  orientation="horizontal"
  className="absolute inset-x-0 -top-0.5"
  onStart={() => {
    startHeightRef.current = useEditor.getState().panels.timelineH;
  }}
  onDrag={(_dx, dy) => setPanelSize("timelineH", startHeightRef.current - dy)}
/>;
```

```tsx
// Resting + interactive tint
className={cn(
  "z-sticky shrink-0 bg-transparent transition-colors hover:bg-primary/50 active:bg-primary",
  orientation === "vertical" ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
)}
```

## 8. Cross-references

- [timeline](./timeline.md) — uses it to resize panel height
- Foundations: [color](../foundations/color.md), [motion](../foundations/motion.md)
