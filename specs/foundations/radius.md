# Foundations — Radius

The redesign uses radius to separate **surfaces** (soft, large) from
**controls** (medium) from **fully-round** actions. `--radius` (8px) is the
Tailwind anchor; `rounded-md`/`rounded-sm` derive from it.

## Scale

| Alias                           | px   | Tailwind                         | Use                                           |
| ------------------------------- | ---- | -------------------------------- | --------------------------------------------- |
| `--radius-handle`               | 2    | `rounded-handle`                 | Vertex / scale handles, keyframe ticks        |
| `--radius-chip`                 | 6    | `rounded-chip`                   | Icon buttons, small chips, menu items         |
| `--radius-control` / `--radius` | 8    | `rounded-control` / `rounded-lg` | Inputs, selects, swatch popovers              |
| `--radius-panel`                | 16   | `rounded-panel`                  | Floating panels (layers, inspector, timeline) |
| `--radius-pill`                 | 9999 | `rounded-pill`                   | Buttons, floating toolbars, mode switcher     |

Derived (Tailwind): `rounded-md` = `--radius` − 2px, `rounded-sm` = − 4px.

## Conventions

- **Panels** → `rounded-panel` (16px). All three editor panels are floating
  cards at this radius.
- **Pills** → top-bar buttons (Home, undo/redo, Open, Export), the mode
  switcher and its active segment, the canvas tool rail and zoom bar.
- **Controls** → number inputs, the file-name field, selects, the color
  popover: `rounded-control`/`rounded-lg`.
- **Handles** → tiny canvas affordances use `rounded-handle`.

## Do / Don't

- ✅ `className="rounded-panel"` for a panel, `rounded-pill` for a button
- ❌ `className="rounded-[16px]"` — use `rounded-panel`
