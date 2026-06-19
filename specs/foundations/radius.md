# Foundations — Radius

The redesign uses radius to separate **surfaces** (soft, large) from
**controls** (medium) from **fully-round** actions. `--radius` (8px) is the
Tailwind anchor; `rounded-md`/`rounded-sm` derive from it.

## Scale

| Alias                           | px   | Tailwind                         | Use                                           |
| ------------------------------- | ---- | -------------------------------- | --------------------------------------------- |
| `--radius-handle`               | 2    | `rounded-handle`                 | Vertex / scale handles, keyframe ticks        |
| `--radius-chip`                 | 6    | `rounded-chip`                   | Icon buttons, small chips, menu items         |
| `--radius-panel`                | 6    | `rounded-panel`                  | Panels & surfaces (layers, inspector, timeline, canvas, top bar) |
| `--radius-control` / `--radius` | 8    | `rounded-control` / `rounded-lg` | Inputs, selects, swatch popovers              |
| `--radius-pill`                 | 9999 | `rounded-pill`                   | Buttons, floating toolbars, mode switcher     |

Derived (Tailwind): `rounded-md` = `--radius` − 2px, `rounded-sm` = − 4px.

## Conventions

- **Panels & surfaces** → `rounded-panel` (6px). The three editor panels, the
  canvas card and artboard, and the top bar are all cards at this radius, so
  every chrome surface shares one corner. (Equal to `--radius-chip` by value;
  kept as a distinct alias so surfaces and chips can diverge later.)
- **Pills** → top-bar buttons (Home, undo/redo, Open, Export), the mode
  switcher and its active segment, the canvas tool rail and zoom bar.
- **Controls** → number inputs, the file-name field, selects, the color
  popover: `rounded-control`/`rounded-lg`.
- **Handles** → tiny canvas affordances use `rounded-handle`.

## Do / Don't

- ✅ `className="rounded-panel"` for a panel, `rounded-pill` for a button
- ❌ `className="rounded-2xl"` or `rounded-[6px]` — use `rounded-panel`
