# Token Reference

Master map of every CSS variable in [`app/tokens.css`](../../app/tokens.css).
Components reference **Layer 2 aliases only** — never Layer 1 `--ds-*`
primitives, and never raw values.

- **Layer 1 — `--ds-*` primitives.** Raw values live here and nowhere else.
  Swap these to adopt an upstream design system.
- **Layer 2 — semantic aliases.** Reference Layer 1 with a literal fallback
  (`--color-keyframe: var(--ds-amber-400-hex, #fbbf24)`). This is the API.
- **Layer 3 — components.** TSX/CSS, via Tailwind utilities that map to Layer 2
  (see [`tailwind.config.ts`](../../tailwind.config.ts)) or direct `var()`.

Colors used by Tailwind are stored as **HSL channels** (`"H S% L%"`) so they can
be wrapped in `hsl(var(--x))`. Full colors (canvas, keyframe accent) are stored
as complete values.

## Colors — semantic (HSL channel aliases, consumed via `hsl(var(--x))`)

| Alias                  | Primitive          | Tailwind utility              | Use for                               |
| ---------------------- | ------------------ | ----------------------------- | ------------------------------------- |
| `--background`         | `--ds-neutral-950` | `bg-background`               | App / canvas backdrop                 |
| `--foreground`         | `--ds-neutral-080` | `text-foreground`             | Primary text                          |
| `--card`               | `--ds-neutral-880` | `bg-card`                     | Panel & floating-toolbar surfaces     |
| `--popover`            | `--ds-neutral-900` | `bg-popover`                  | Popover / menu surfaces               |
| `--primary`            | `--ds-sky-500`     | `bg-primary` / `text-primary` | Interactive, selection, playhead      |
| `--primary-foreground` | `--ds-neutral-950` | `text-primary-foreground`     | Text on primary fill                  |
| `--secondary`          | `--ds-neutral-820` | `bg-secondary`                | Timeline bars, switcher active seg    |
| `--muted-foreground`   | `--ds-neutral-400` | `text-muted-foreground`       | Secondary / meta text, idle icons     |
| `--accent`             | `--ds-neutral-800` | `bg-accent`                   | Hover fill inside panels, active tool |
| `--destructive`        | `--ds-red-500`     | `text-destructive`            | Delete affordances                    |
| `--border`             | `--ds-neutral-720` | `border-border`               | Dividers, hairlines                   |
| `--input`              | `--ds-neutral-680` | —                             | Legacy input border channel           |
| `--ring`               | `--ds-sky-500`     | `ring-ring`                   | Focus rings                           |

## Colors — full-color tokens

| Alias                  | Primitive            | Tailwind utility                | Use for                       |
| ---------------------- | -------------------- | ------------------------------- | ----------------------------- |
| `--color-keyframe`     | `--ds-amber-400-hex` | `bg-keyframe` / `fill-keyframe` | Keyframe diamonds, snap guide |
| `--color-checker-base` | `--ds-checker-base`  | `bg-checker-base`               | Canvas transparency backdrop  |
| `--color-checker-tile` | `--ds-checker-tile`  | `bg-checker-tile`               | Canvas transparency tiles     |
| `--color-canvas-dark`  | `--ds-canvas-dark`   | `bg-canvas-dark`                | Dark canvas-bg swatch/fill    |
| `--color-canvas-light` | `--ds-canvas-light`  | `bg-canvas-light`               | Light canvas-bg swatch/fill   |
| `--color-on-fill`      | `--ds-white`         | `text-on-fill`                  | Text/icon on a saturated fill |

## Spacing — 4px base step

| Alias          | Value | Tailwind        | Use for                           |
| -------------- | ----- | --------------- | --------------------------------- |
| `--space-none` | 0px   | `p-0`           | Reset                             |
| `--space-3xs`  | 2px   | `gap-0.5`       | Hairline gaps, icon clusters      |
| `--space-2xs`  | 4px   | `gap-1` / `p-1` | Tight control padding             |
| `--space-xs`   | 8px   | `gap-2` / `p-2` | Default control padding / row gap |
| `--space-sm`   | 12px  | `gap-3` / `p-3` | Section padding, panel header     |
| `--space-md`   | 16px  | `gap-4` / `p-4` | Section blocks                    |
| `--space-lg`   | 24px  | `gap-6`         | Empty-state rhythm                |
| `--space-xl`   | 32px  | `gap-8`         | Large layout gaps                 |
| `--space-2xl`  | 48px  | —               | Canvas inset / hero padding       |

## Typography

| Alias                                   | Value (px)     | Tailwind        | Use for                             |
| --------------------------------------- | -------------- | --------------- | ----------------------------------- |
| `--text-ruler`                          | 9              | `text-ruler`    | Timeline ruler ticks                |
| `--text-meta`                           | 10             | `text-meta`     | Section labels, sublabels, counts   |
| `--text-label`                          | 11             | `text-label`    | Track labels, transport readouts    |
| `--text-body`                           | 12             | `text-body`     | Primary control & inspector text    |
| `--text-title`                          | 14             | `text-title`    | Top-bar wordmark, empty-state body  |
| `--text-heading`                        | 24             | `text-heading`  | Empty-state heading                 |
| `--weight-regular`                      | 400            | `font-normal`   | Body                                |
| `--weight-medium`                       | 500            | `font-medium`   | Buttons, field labels, active items |
| `--weight-semibold`                     | 600            | `font-semibold` | Panel headers, headings             |
| `--leading-none` / `-tight` / `-normal` | 1 / 1.25 / 1.5 | `leading-*`     | Line heights                        |
| `--font-sans`                           | Inter stack    | `font-sans`     | All UI                              |
| `--font-mono`                           | mono stack     | `font-mono`     | Reserved                            |

## Radius

| Alias              | Value  | Tailwind          | Use for                     |
| ------------------ | ------ | ----------------- | --------------------------- |
| `--radius`         | 8px    | `rounded-lg`      | Base anchor (md/sm derive)  |
| `--radius-chip`    | 6px    | `rounded-chip`    | Icon buttons, small chips   |
| `--radius-control` | 8px    | `rounded-control` | Inputs, selects             |
| `--radius-panel`   | 16px   | `rounded-panel`   | Floating panels             |
| `--radius-pill`    | 9999px | `rounded-pill`    | Buttons, toolbars, switcher |
| `--radius-handle`  | 2px    | `rounded-handle`  | Vertex/scale handles        |

## Elevation

| Alias             | Value               | Tailwind        | Use for                  |
| ----------------- | ------------------- | --------------- | ------------------------ |
| `--shadow-sm`     | `0 1px 2px …/.3`    | `shadow-sm`     | Swatches                 |
| `--shadow-md`     | `0 2px 6px …/.35`   | `shadow-md`     | Popover content          |
| `--shadow-panel`  | `0 6px 16px …/.35`  | `shadow-panel`  | Floating toolbars, menus |
| `--shadow-canvas` | `0 12px 32px …/.45` | `shadow-canvas` | Canvas artboard lift     |

## Z-index

| Alias         | Value | Tailwind    | Use for                                |
| ------------- | ----- | ----------- | -------------------------------------- |
| `--z-raised`  | 10    | `z-raised`  | Playhead, snap guide, selected diamond |
| `--z-sticky`  | 20    | `z-sticky`  | Timeline resize handle                 |
| `--z-overlay` | 40    | `z-overlay` | Drag-to-replace scrim                  |
| `--z-popover` | 50    | `z-popover` | Toasts, popovers                       |

## Motion

| Alias             | Value                     | Tailwind        | Use for               |
| ----------------- | ------------------------- | --------------- | --------------------- |
| `--duration-fast` | 120ms                     | `duration-fast` | Hover/﻿press feedback |
| `--duration-base` | 150ms                     | `duration-base` | Default transitions   |
| `--duration-slow` | 200ms                     | `duration-slow` | Larger surfaces       |
| `--ease-standard` | `cubic-bezier(.4,0,.2,1)` | `ease-standard` | Default easing        |

Note: most components use Tailwind's `transition-colors` / `transition-transform`
with default timing; reach for the duration tokens when overriding.

## Component sizing

| Alias                        | Value       | Tailwind        | Use for                           |
| ---------------------------- | ----------- | --------------- | --------------------------------- |
| `--size-track-label`         | 176px       | `w-track-label` | Timeline left gutter width        |
| `--size-scrollbar`           | 10px        | —               | Scrollbar thickness (globals.css) |
| `--size-scrollbar-radius`    | 5px         | —               | Scrollbar thumb radius            |
| `--size-scrollbar-border`    | 2px         | —               | Scrollbar thumb border            |
| `--size-colorpicker-w/h`     | 196 / 160px | —               | react-colorful sizing             |
| `--size-colorpicker-pointer` | 14px        | —               | react-colorful pointer            |

## Rules

1. **Never** write a raw hex/rgb, px/rem, or shadow in a component or CSS file.
2. Reach for the closest Layer 2 alias; if none fits, add a primitive **and**
   an alias in `tokens.css`, then use the alias.
3. Run `npm run token-audit` before committing — zero errors required.
