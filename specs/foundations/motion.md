# Foundations — Motion

Two kinds of motion in the app: **UI feedback** (CSS transitions on hover/press
/ panel changes) and **canvas interaction** (drag previews, scrubbing, the
animation itself). This spec covers UI feedback only; canvas interaction is
driven imperatively (rAF / pointer math) and intentionally has no easing.

## Tokens

| Alias             | Value                     | Tailwind        | Use                            |
| ----------------- | ------------------------- | --------------- | ------------------------------ |
| `--duration-fast` | 120ms                     | `duration-fast` | Hover / press color feedback   |
| `--duration-base` | 150ms                     | `duration-base` | Default transitions            |
| `--duration-slow` | 200ms                     | `duration-slow` | Larger surfaces / mode changes |
| `--ease-standard` | `cubic-bezier(.4,0,.2,1)` | `ease-standard` | Default easing                 |

## Conventions

- Most interactive chrome uses Tailwind's `transition-colors` (hover tints) or
  `transition-transform` (swatch / handle scale) with **default** timing —
  that's fine and audits clean.
- When you set an explicit duration, use a token (`duration-fast`, etc.), never
  a raw `duration-[170ms]`.
- **Do not** animate canvas-critical interactions (vertex drag, layer move,
  playhead scrub). They must track the pointer 1:1; a transition there reads as
  lag. The live-preview drag system deliberately writes transforms with no
  transition.
- Respect `prefers-reduced-motion` for any future non-essential animation.

## Do / Don't

- ✅ `className="transition-colors hover:bg-accent"`
- ✅ `className="transition-transform duration-fast"`
- ❌ a CSS transition on a dragged selection box or playhead
- ❌ `duration-[200ms]` — use `duration-slow`
