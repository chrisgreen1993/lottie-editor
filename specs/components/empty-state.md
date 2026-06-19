# EmptyState

## 1. Metadata

- **Name:** EmptyState
- **Category:** Editor / onboarding
- **Status:** Stable
- **Source:** [`components/editor/EmptyState.tsx`](../../components/editor/EmptyState.tsx)

## 2. Overview

The centered landing screen shown when no document is open. It presents the
ways to get a doc into the editor: drop a file, browse, try the bundled
example, start blank, or load from a URL — and hints that an SVG can be pasted
straight from Figma.

- **Use when:** `doc` is null — `Editor` renders this in place of the workspace.
- **Don't use for:** in-editor errors or transient feedback (use
  [toasts](./toasts.md)) or per-doc actions (the [top-bar](./top-bar.md)).

## 3. Anatomy

- **Hero** — rounded primary-tinted icon badge (Clapperboard), heading, and a
  one-line description.
- **Drop zone** — large dashed button; the whole card opens the file picker and
  doubles as the visual drop target. Its label and tint react to `dragActive`.
- **Action row** — three equal secondary buttons: Try the example (fetches
  `/example-animation.json`), Browse files, Start blank (`blankDoc()`).
- **URL loader** — a Globe-prefixed input plus a Load button; Enter submits.
  Fetch failures surface through `toast`.

## 4. Tokens used

- Surface: page sits on `--background`/`bg-background`; the drop zone and URL
  input use `--card`/`bg-card`; the badge and active drop state use
  `--primary` tints; action buttons use `--secondary`/`bg-secondary` with
  `--secondary-foreground`.
- Border: `--border`/`border-border` for the dashed drop zone, brightening to
  `--primary` on hover / active drag.
- Text: `--foreground` for the heading, `--muted-foreground` for description,
  hints, and placeholder.
- Type: `--text-heading` (the title) and `--text-title`/`--text-body` per the
  reference's empty-state body sizing; meta hints at `--text-body`/smaller.
- Radius: `--radius-panel`-scale rounding on the badge, `--radius-control` on
  the URL input, control rounding on the buttons.
- Focus: `--ring`/`ring-ring` on the URL input.
- Motion: `transition-colors` on drop-zone and button hovers.

## 5. Props / API

```ts
export function EmptyState({
  onOpenFile,
  dragActive,
}: {
  onOpenFile: () => void;
  dragActive: boolean;
}): JSX.Element;
```

- `onOpenFile` — opens the native file picker (wired by `Editor`); fired by the
  drop zone and the Browse button.
- `dragActive` — whether a file is currently dragged over the window; drives the
  drop-zone label and primary tint.
- Internal: `loadDoc` / `toast` from the store; local `url` and `loading`
  (`"example" | "url" | null`) state; `loadFromText` parses via `parseLottie`
  and toasts on failure.

## 6. States

- **Default:** dashed drop zone on `--card`, "Drop a Lottie .json or .svg".
- **Hover:** drop zone border → `--primary` tint, fill → `--card`; buttons
  darken their `--secondary` fill.
- **Drag active:** drop zone border `--primary`, fill primary tint, label
  switches to "Drop to open".
- **Focus:** URL input shows `ring-ring`.
- **Loading:** the in-flight button label becomes "Loading…"; all action
  buttons and Load are disabled (`disabled:opacity-50`).
- **Disabled:** Load is disabled while the URL is empty.

## 7. Code example

```tsx
<button
  type="button"
  onClick={onOpenFile}
  className={cn(
    "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed",
    "border-border bg-card/50 px-6 py-10 text-center transition-colors",
    "hover:border-primary/60 hover:bg-card",
    dragActive && "border-primary bg-primary/10",
  )}
>
  <UploadCloud size={28} className="text-muted-foreground" />
  <span className="text-body font-medium">
    {dragActive ? "Drop to open" : "Drop a Lottie .json or .svg anywhere"}
  </span>
  <span className="text-body text-muted-foreground">
    click to browse — or paste an SVG straight from Figma (⌘V)
  </span>
</button>
```

## 8. Cross-references

- [top-bar](./top-bar.md) — the bar shown once a doc loads
- [toasts](./toasts.md) — surfaces load / fetch errors
- Foundations: [color](../foundations/color.md), [typography](../foundations/typography.md),
  [spacing](../foundations/spacing.md)
