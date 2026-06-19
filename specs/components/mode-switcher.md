# ModeSwitcher

## 1. Metadata

- **Name:** ModeSwitcher
- **Category:** Chrome / navigation
- **Status:** Stable
- **Source:** [`components/editor/TopBar.tsx`](../../components/editor/TopBar.tsx)

## 2. Overview

The centered segmented control in the top bar that flips the editor
between `Design` and `Animate`. Absolutely centered in `TopBar` and only
mounted while a document is open.

- **Use when:** switching the whole editor between layout work (Design) and
  timeline work (Animate). It's the single source of truth for `editorMode`.
- **Don't use for:** per-tool or per-layer toggles, or any control with more
  than two mutually exclusive options — this is a fixed two-segment switch.

## 3. Anatomy

- **Track** — `rounded-control` `--background` surface with a `p-0.5` inner pad,
  reading as an inset well on the `--card` top bar.
- **Segments** — two `<button>`s (`Design`, `Animate`), capitalized; the
  active one fills `--secondary`, the idle one is `--muted-foreground` text.

## 4. Tokens used

- Surface: track `bg-background` (inset on the card bar); active segment
  `bg-secondary`.
- Text: active `--foreground`; idle `--muted-foreground` → `--foreground` on hover.
- Radius: concentric — `--radius-control` (4) track, `--radius-handle` (2)
  segments (4 − 2px pad = 2, so segment corners trace the track's).
- Shadow: none — the track is inset, not floating.
- Type: `--text-body`, weight `--weight-medium`.
- Motion: `transition-colors` (default timing) on segment hover/active.

## 5. Props / API

```ts
function ModeSwitcher(): JSX.Element;
```

- Takes no props. Reads `editorMode` and `setEditorMode` from the `useEditor`
  store directly.
- `setEditorMode` is also driven by `Tab` (Rive-style toggle) in
  [`components/editor/Editor.tsx`](../../components/editor/Editor.tsx), and the
  store flips to `design` automatically when a non-`select` tool is picked.

## 6. States

- **Default:** track `--background` (inset); current mode filled `--secondary`.
- **Hover:** idle segment text → `--foreground` (no fill change).
- **Active:** the current-mode segment is filled `--secondary` with
  `--foreground` text.

## 7. Code example

```tsx
<div
  className="flex items-center gap-1 rounded-control bg-background p-0.5"
  title="Switch between Design and Animate (Tab)"
>
  {(["design", "animate"] as EditorMode[]).map((m) => (
    <button
      key={m}
      type="button"
      onClick={() => setEditorMode(m)}
      className={cn(
        "rounded-handle px-3.5 py-1 text-body font-medium capitalize transition-colors",
        mode === m
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {m}
    </button>
  ))}
</div>
```

## 8. Cross-references

- [top-bar](./top-bar.md) — the host that centers this control
- [button](./button.md) — the shadcn primitive (not used here; bespoke buttons)
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md)
