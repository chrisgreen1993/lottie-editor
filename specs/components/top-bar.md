# TopBar

## 1. Metadata

- **Name:** TopBar
- **Category:** Chrome / navigation
- **Status:** Stable
- **Source:** [`components/editor/TopBar.tsx`](../../components/editor/TopBar.tsx)

## 2. Overview

The persistent bar across the top of the editor. Hosts document identity
(Home + file name), history (undo/redo), the centered Design/Animate mode
switcher, and the right-side actions (Open, Export). It's a `--card` surface at
`--radius-panel`, sharing the same `--space-2xs` layout gutter as the panels so
its left/right edges line up with them.

- **Use when:** a document is open — it's always mounted by `Editor`.
- **Don't use for:** canvas tools (those live in the canvas tool rail) or
  per-layer actions (those live in the layer panel / inspector). Keep the bar
  to global, document-level concerns.

## 3. Anatomy

- **Home button** — leading icon button; closes the doc back to the landing
  screen (confirm-guarded).
- **File name** — inline editable text field (transparent until hover/focus).
- **History** — undo / redo icon buttons.
- **Mode switcher** — absolutely centered segmented control (`Design` |
  `Animate`); see [mode-switcher](./mode-switcher.md).
- **Spacer** — pushes actions right.
- **Actions** — `Open` (ghost button) and `Export` (primary button + popover menu).

## 4. Tokens used

- Surface: bar is a `--card` card; buttons hover to `--accent` (the in-panel
  convention, since the bar is now a card surface). Export uses `bg-primary` /
  `text-primary-foreground`.
- Text: `--foreground` (file name), `--muted-foreground` (idle controls).
- Radius: concentric — `--radius-panel` (6) on the bar card; `--radius-control`
  (4) on every button, the file-name field and the switcher track; Export
  popover items also `--radius-control`. No pills.
- Shadow: none on the bar (flat card, like the panels); `--shadow-md` on the
  popover.
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

- **Default:** `--card` bar; idle buttons `--muted-foreground`.
- **Hover:** buttons fill `--accent`, text → `--foreground`; Export → `bg-primary/90`.
- **Active:** switcher segment for the current mode filled `--secondary`.
- **Focus:** file-name field shows `--accent` surface + `ring-ring`.
- **Disabled:** undo/redo at 40% opacity when no history.
- **No doc:** only `Open` shows (home/name/switcher/export hidden).

## 7. Code example

```tsx
<header className="relative flex h-10 shrink-0 items-center gap-2 rounded-panel bg-card px-3">
  {doc && (
    <div className="absolute left-1/2 top-1/2 z-raised -translate-x-1/2 -translate-y-1/2">
      <ModeSwitcher />
    </div>
  )}
  <IconButton label="Close and go home" className="rounded-control hover:bg-accent" … />
  <input className="h-7 w-48 rounded-control bg-transparent px-2 text-body
                    text-foreground transition-colors hover:bg-card
                    focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-ring" … />
  …
  <button className="inline-flex h-7 items-center gap-1.5 rounded-control bg-primary
                     px-3 text-body font-medium text-primary-foreground
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
