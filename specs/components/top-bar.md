# TopBar

## 1. Metadata

- **Name:** TopBar
- **Category:** Chrome / navigation
- **Status:** Stable
- **Source:** [`components/editor/TopBar.tsx`](../../components/editor/TopBar.tsx)

## 2. Overview

The persistent bar across the top of the editor. Hosts document identity
(Home + file name), history (undo/redo), the centered Design/Animate mode
switcher, and the right-side actions (Open, Export).

- **Use when:** a document is open — it's always mounted by `Editor`.
- **Don't use for:** canvas tools (those live in the canvas tool rail) or
  per-layer actions (those live in the layer panel / inspector). Keep the bar
  to global, document-level concerns.

## 3. Anatomy

- **Home button** — leading icon button; closes the doc back to the landing
  screen (confirm-guarded).
- **File name** — inline editable text field (transparent until hover/focus).
- **History** — undo / redo icon buttons.
- **Mode switcher** — absolutely centered pill segmented control (`Design` |
  `Animate`); see [mode-switcher](./mode-switcher.md).
- **Spacer** — pushes actions right.
- **Actions** — `Open` (ghost pill) and `Export` (primary pill + popover menu).

## 4. Tokens used

- Surface: bar is transparent (sits on `--background`); buttons hover to
  `--card`. Export uses `bg-primary` / `text-primary-foreground`.
- Text: `--foreground` (file name), `--muted-foreground` (idle controls).
- Radius: `--radius-pill` on every button and the switcher; `--radius-control`
  on the file-name field; `--radius-chip` on Export popover items.
- Shadow: `--shadow-panel` on the switcher; `--shadow-md` on the popover.
- Type: `--text-title` is reserved for the (removed) wordmark; controls use
  `--text-body`, popover hints `--text-meta`, weight `--weight-medium`.
- Motion: `transition-colors` (default timing) on hover.

## 5. Props / API

```ts
function TopBar({ onOpenFile }: { onOpenFile: () => void }): JSX.Element;
```

- `onOpenFile` — opens the native file picker (wired by `Editor`).
- All other state (doc, fileName, undo/redo availability, mode) is read from
  the `useEditor` store directly.

## 6. States

- **Default:** transparent bar; idle buttons `--muted-foreground`.
- **Hover:** buttons fill `--card`, text → `--foreground`; Export → `bg-primary/90`.
- **Active:** switcher segment for the current mode filled `--secondary`.
- **Focus:** file-name field shows `--card` surface + `ring-ring`.
- **Disabled:** undo/redo at 40% opacity when no history.
- **No doc:** only `Open` shows (home/name/switcher/export hidden).

## 7. Code example

```tsx
<header className="relative flex h-12 shrink-0 items-center gap-2 px-4">
  {doc && (
    <div className="absolute left-1/2 top-1/2 z-raised -translate-x-1/2 -translate-y-1/2">
      <ModeSwitcher />
    </div>
  )}
  <IconButton label="Close and go home" className="rounded-pill hover:bg-card" … />
  <input className="h-7 w-48 rounded-control bg-transparent px-2 text-body
                    text-foreground transition-colors hover:bg-card
                    focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-ring" … />
  …
  <button className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-primary
                     px-3.5 text-body font-medium text-primary-foreground
                     transition-colors hover:bg-primary/90">
    <Download size={14} /> Export
  </button>
</header>
```

## 8. Cross-references

- [mode-switcher](./mode-switcher.md) — the centered control
- [icon-button](./icon-button.md) — home / undo / redo
- [popover](./popover.md) — the Export menu
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md)
