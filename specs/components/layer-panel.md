# LayerPanel

## 1. Metadata

- **Name:** LayerPanel
- **Category:** Editor / panels
- **Status:** Stable
- **Source:** [`components/editor/LayerPanel.tsx`](../../components/editor/LayerPanel.tsx)

## 2. Overview

The left floating panel listing every layer in the open document. Each row
exposes visibility, a type icon, the name (inline-renamable), and hover-revealed
reorder/duplicate/delete actions. Rows are draggable for reorder with a live
insertion indicator.

- **Use when:** a document is open — `Editor` mounts it beside the canvas.
- **Don't use for:** per-property editing (that's the [inspector](./inspector.md))
  or global document actions (those live in the [top-bar](./top-bar.md)). Keep it
  to layer identity, ordering, and lifecycle.

## 3. Anatomy

- **Card** — `rounded-panel` `bg-card` column; width comes from the store
  (`panels.layerPanelW`).
- **Header** — `Layers` icon + "Layers" title + right-aligned layer count.
- **List** — scrollable column of `LayerRow`s, or an empty-state hint when there
  are no layers.
- **LayerRow** — eye toggle, type icon, name (or rename input), and a hover/
  selected action cluster: move up, move down, duplicate, delete.
- **Insertion indicator** — an inset top/bottom edge line drawn on the row a
  dragged layer would drop above/below.

## 4. Tokens used

- Surface: card is `bg-card` (`--card`); rows hover to `--accent` (`hover:bg-accent/60`);
  the selected row fills `bg-primary` (`--primary`).
- Text: names use `--foreground`; icons, count, and idle controls use
  `--muted-foreground`; delete hovers to `--destructive`; selected-row text/icons
  sit on the primary fill.
- Radius: `--radius-panel` on the card; the rename input rounds to `--radius`.
- Border: `--border` on the header rule and row dividers (`border-border` /
  `border-border/50`).
- Type: title at `--text-body` weight `--weight-semibold`; row text at
  `--text-body`; count at `--text-meta`, `tabular-nums`.
- Accent: the drop-edge indicator is drawn from `--primary`.
- Motion: `transition-colors` (default timing) on row hover/selection.

> Note: the row uses `text-white` for the on-primary selected state rather than
> the `--color-on-fill` (`text-on-fill`) alias, and the rename input uses
> `rounded-md`; both are local deviations from the token set.

## 5. Props / API

```ts
export function LayerPanel(): JSX.Element | null;
```

- Takes no props; reads `doc` and `panels.layerPanelW` from the `useEditor` store.
- Returns `null` when no document is open.

Internal row component:

```ts
function LayerRow({
  layer,
  index,
  total,
}: {
  layer: LottieLayer;
  index: number;
  total: number;
}): JSX.Element;
```

- Reads/writes selection and the doc via `useEditor` (`selectedLayer`,
  `selectLayer`, `update`).
- Ops are delegated to `lib/lottie/ops`: `moveLayer`, `duplicateLayer`,
  `deleteLayer`, `renameLayer`, `toggleLayerVisibility`.

## 6. States

- **Default:** transparent row; name `--foreground`, icons `--muted-foreground`.
- **Hover:** row fills `--accent` (`hover:bg-accent/60`); the action cluster
  becomes visible (`group-hover:flex`).
- **Selected:** row fills `bg-primary`; text/icons flip to the on-fill color and
  the action cluster stays visible.
- **Focus:** rename input shows `ring-1 ring-ring` (`--ring`).
- **Disabled:** move-up disabled on the first row, move-down on the last
  (`disabled:opacity-30`).
- **Hidden layer:** whole row drops to 50% opacity; eye icon toggles to `EyeOff`.
- **Drag-over:** an inset `--primary` line marks the above/below drop edge.

## 7. Code example

```tsx
<aside
  className="flex shrink-0 flex-col overflow-hidden rounded-panel bg-card"
  style={{ width }}
>
  <div className="flex h-9 items-center gap-2 border-b border-border px-3">
    <Layers size={13} className="text-muted-foreground" />
    <span className="text-body font-semibold">Layers</span>
    <span className="ml-auto text-meta tabular-nums text-muted-foreground">
      {doc.layers.length}
    </span>
  </div>
  {/* selected row */}
  <div
    className="group flex h-8 items-center gap-1.5 border-b border-border/50
                  px-2 text-body transition-colors bg-primary text-on-fill"
  >
    <Eye size={13} /> <LayerIcon ty={layer.ty} />
    <span className="min-w-0 flex-1 truncate">{name}</span>
  </div>
</aside>
```

## 8. Cross-references

- [inspector](./inspector.md) — edits the selected layer's properties
- [top-bar](./top-bar.md) — global document actions
- [color-swatch](./color-swatch.md), [number-field](./number-field.md) — sibling field controls
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md), [spacing](../foundations/spacing.md)
