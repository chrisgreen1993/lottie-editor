# Foundations — Elevation

Elevation = shadow + z-index. Because panels float on a seamless backdrop, the
chrome itself is mostly flat; shadows are reserved for things that hover
**above** the panels (toolbars, popovers, the canvas artboard) and z-index is a
small, named layering scale.

## Shadows

| Alias             | Value              | Tailwind        | Use                                                    |
| ----------------- | ------------------ | --------------- | ------------------------------------------------------ |
| `--shadow-sm`     | `0 1px 2px /.3`    | `shadow-sm`     | Color swatches                                         |
| `--shadow-md`     | `0 2px 6px /.35`   | `shadow-md`     | Popover / menu content                                 |
| `--shadow-panel`  | `0 6px 16px /.35`  | `shadow-panel`  | Floating toolbars (tool rail, zoom bar), mode switcher |
| `--shadow-canvas` | `0 12px 32px /.45` | `shadow-canvas` | Canvas artboard lift off the backdrop                  |

Panels (layers/inspector/timeline) are intentionally **flat** — they read as
inset cards, not floating ones.

## Z-index

A four-stop scale; never invent raw z-values.

| Alias         | Value | Tailwind    | Use                                             |
| ------------- | ----- | ----------- | ----------------------------------------------- |
| `--z-raised`  | 10    | `z-raised`  | Playhead, snap guide, selected keyframe diamond |
| `--z-sticky`  | 20    | `z-sticky`  | Timeline resize handle                          |
| `--z-overlay` | 40    | `z-overlay` | Drag-to-replace scrim                           |
| `--z-popover` | 50    | `z-popover` | Toasts, Radix popovers                          |

Floating canvas toolbars rely on DOM order + `shadow-panel`, not z-index.

## Do / Don't

- ✅ `className="shadow-panel"` on a floating toolbar; `z-popover` on a toast
- ❌ `className="z-[60]"` or `shadow-[0_6px_16px_...]` — use the tokens
