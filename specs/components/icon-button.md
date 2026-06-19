# IconButton

## 1. Metadata

- **Name:** IconButton
- **Category:** Control / primitive
- **Status:** Stable
- **Source:** [`components/editor/fields.tsx`](../../components/editor/fields.tsx)

## 2. Overview

The square 28px icon button used across the editor's toolbars, tool rails,
section headers, and the top bar (home / undo / redo). Wraps a single
lucide icon with an accessible label and an optional `active` press state.

- **Use when:** you need a compact, icon-only action — toggling a tool,
  triggering undo/redo, or a section-header affordance.
- **Don't use for:** labelled actions like `Open` / `Export` (those are
  bespoke buttons), or text-bearing controls. Pass a `<label>` for text.

## 3. Anatomy

- **Hit area** — fixed `h-7 w-7` (28px) flex box, centered icon.
- **Icon** — a single lucide glyph passed as `children` (typically `size={15}`).
- **Label** — `title` + `aria-label`, both set from the `label` prop.

## 4. Tokens used

- Surface: transparent by default; `--accent` on hover and when `active`.
- Text: `--muted-foreground` idle → `--foreground` on hover; `--primary` when
  `active`.
- Radius: `--radius-control` (4) — the control step of the concentric ladder,
  matching the surface (`--radius-panel`) it sits inside.
- Type: icon-only; no text token.
- Motion: `transition-colors` (default timing).
- Disabled: `disabled:opacity-40` with pointer events off.

## 5. Props / API

```ts
function IconButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    active?: boolean;
  },
): JSX.Element;
```

- `label` — required; sets both `title` and `aria-label`.
- `active` — adds the pressed `bg-accent text-primary` look.
- `className` — merged via `cn`, so callers can override radius/hover (e.g.
  the top bar and tool rail pass `rounded-control`).
- All other `<button>` attributes (`onClick`, `disabled`, …) pass through.

## 6. States

- **Default:** transparent, `--muted-foreground` icon.
- **Hover:** `bg-accent`, icon → `--foreground`.
- **Active:** `bg-accent`, icon → `--primary` (toggled-on look).
- **Focus:** inherits the browser/global focus ring; no bespoke ring here.
- **Disabled:** 40% opacity, pointer events off.

## 7. Code example

```tsx
<IconButton label="Undo (⌘Z)" disabled={!canUndo} onClick={undo}>
  <Undo2 size={15} />
</IconButton>

<IconButton label="Convert to keyframes" active={isKeyframed} onClick={toggle}>
  <Diamond size={15} />
</IconButton>
```

## 8. Cross-references

- [top-bar](./top-bar.md) — home / undo / redo use this
- [button](./button.md) — the shadcn primitive (separate from this bespoke button)
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md)
