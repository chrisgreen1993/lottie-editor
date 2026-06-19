# Foundations — Radius

The redesign uses one tight **concentric** radius ladder so the whole UI reads
as a single family of sharp-cornered cards. There are no capsule/pill shapes in
the chrome — every surface, control and handle steps down the same scale, and a
nested corner is always smaller than the corner that contains it.

## Scale — the concentric ladder

| Alias                              | px   | Tailwind                          | Use                                                       |
| ---------------------------------- | ---- | --------------------------------- | --------------------------------------------------------- |
| `--radius-handle`                  | 2    | `rounded-handle`                  | Innermost: handles, keyframe ticks, mode-switcher segments |
| `--radius-control` / `--radius-chip` | 4  | `rounded-control` / `rounded-chip` | Controls: buttons, inputs, selects, menu items, chips, bars |
| `--radius-panel` / `--radius`      | 6    | `rounded-panel` / `rounded-lg`    | Surfaces: panels, top bar, canvas, artboard, floating toolbars, popovers, toasts |
| `--radius-pill`                    | 9999 | `rounded-pill`                    | Reserved — no longer used in chrome (kept for flexibility) |

`--radius` (the Tailwind anchor) sits at the **surface** step (6px), so the
derived utilities fall straight onto the ladder:

- `rounded-lg` = `--radius` = **6** (surface)
- `rounded-md` = `--radius` − 2 = **4** (control)
- `rounded-sm` = `--radius` − 4 = **2** (handle)

## Concentric corners

> Inner radius always respects the outer one: `inner = outer − inset`.

Nest down the ladder so corners stay visually parallel:

- **Surface → control.** A button/input inside a panel or the top bar uses
  `rounded-control` (4) inside the surface's `rounded-panel` (6).
- **Control → handle.** Something nested inside a control drops again to
  `rounded-handle` (2). The mode switcher is the clean case: a `rounded-control`
  track (4) with `p-0.5` (2px) padding holds `rounded-handle` segments
  (4 − 2 = 2), so the segment corners trace the track corners exactly.
- **Floating toolbars** (canvas tool rail, zoom bar) are their own surfaces at
  `rounded-panel` (6); their icon buttons step to `rounded-control` (4).

The 2px gap between ladder steps matches the app's tight `p-0.5` inset, so where
a child is inset by 2px the formula lands exactly; for larger insets the child
simply takes the next step down (still smaller than its container).

## Circles vs. corners

`rounded-full` is **not** a chrome radius — it's reserved for true point/round
affordances where a circle is the shape itself: path vertex & tangent handles,
the rotate knob, the drag-to-replace knob, status dots, and the ellipse-tool
draw preview. Everything rectangular uses the ladder above.

## Do / Don't

- ✅ `rounded-panel` for any card/surface, `rounded-control` for a button or
  input inside it, `rounded-handle` for a segment/handle nested deeper
- ✅ `rounded-full` only for an actual circle (a point handle, a dot)
- ❌ `rounded-pill` / `rounded-full` on a rectangular button or toolbar — those
  are now `rounded-control` / `rounded-panel`
- ❌ a child with a **larger** radius than its parent (breaks concentricity)
- ❌ `rounded-2xl` or `rounded-[6px]` — use the named tokens
