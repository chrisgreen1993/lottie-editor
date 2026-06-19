# Foundations — Typography

One typeface (Inter), three weights, and a deliberately **small** type scale —
the UI is a dense tool, so 10–12px dominates. Sizes are exposed as named
Tailwind utilities (`text-meta`, `text-body`, …) backed by Layer 2 aliases, so
no `text-[11px]` arbitrary values should remain in new code.

## Family

- `--font-sans` → Inter (loaded in `app/layout.tsx`), with a system fallback
  stack. Applied globally via `font-sans`.
- `--font-mono` → reserved for any future numeric/monospace need.

## Scale

| Alias            | px  | Tailwind       | Use                                                |
| ---------------- | --- | -------------- | -------------------------------------------------- |
| `--text-ruler`   | 9   | `text-ruler`   | Timeline ruler tick numbers                        |
| `--text-meta`    | 10  | `text-meta`    | Section labels (UPPER), sublabels, counts, hints   |
| `--text-label`   | 11  | `text-label`   | Track labels, transport readouts, keyframe toolbar |
| `--text-body`    | 12  | `text-body`    | Primary control text, inspector values, layer rows |
| `--text-title`   | 14  | `text-title`   | Top-bar wordmark, empty-state body                 |
| `--text-heading` | 24  | `text-heading` | Empty-state heading                                |

## Weights

| Alias               | Value | Tailwind        | Use                                 |
| ------------------- | ----- | --------------- | ----------------------------------- |
| `--weight-regular`  | 400   | `font-normal`   | Body, values                        |
| `--weight-medium`   | 500   | `font-medium`   | Buttons, field labels, active items |
| `--weight-semibold` | 600   | `font-semibold` | Panel headers, headings             |

## Line height

`--leading-none` (1), `--leading-tight` (1.25), `--leading-normal` (1.5) via
`leading-*`. Compact single-line controls use `leading-none`; wrapping help
text uses `leading-normal`.

## Conventions

- **Section labels** (e.g. "TRANSFORM", "COLORS") are `text-meta`,
  `font-semibold`, uppercase, with wide tracking.
- **Numeric fields** use `tabular-nums` so digits don't jitter while scrubbing.
- Migrate `text-[10px]/[11px]/[9px]` → `text-meta` / `text-label` / `text-ruler`.

## Do / Don't

- ✅ `className="text-body font-medium tabular-nums"`
- ❌ `className="text-[11px]"` — use `text-label`
