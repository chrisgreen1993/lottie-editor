# Foundations — Color

The editor is a single dark theme tuned for long sessions staring at a canvas.
The chrome is a low-chroma neutral ramp at hue 240; one saturated sky-blue
carries all interaction; amber marks keyframes. Color is defined once in
[`tokens.css`](../../app/tokens.css) and consumed only through Layer 2 aliases.

## Principles

- **One interactive color.** `--primary` (sky 199°) means "actionable or
  selected": Export, the active mode/tool, selected layer rows and timeline
  bars, the playhead, focus rings. Don't use it decoratively.
- **Neutrals carry hierarchy, not borders.** Surfaces step up the ramp
  (`background` → `card` → `secondary`/`accent`); `--border` hairlines are
  used sparingly since the redesign moved to floating cards on a seamless
  backdrop.
- **Amber is reserved.** `--color-keyframe` is only for keyframes and the
  snap guide — never general UI.
- **Two text tones.** `--foreground` for primary, `--muted-foreground` for
  secondary/meta and idle icons. On a `--primary` fill, use `--color-on-fill`.

## Palette

### Surfaces (step up the neutral ramp)

- `--background` — app & canvas backdrop (darkest)
- `--card` — panels, floating toolbars, inputs-on-hover
- `--popover` — menus / popovers
- `--secondary` — timeline layer bars, active switcher segment
- `--accent` — hover fill **inside** panels, active tool chip

### Text & icons

- `--foreground` — primary text
- `--muted-foreground` — secondary text, meta labels, resting icons
- `--color-on-fill` — text/icon on a saturated fill

### Interactive

- `--primary` / `--primary-foreground` — actions & selection
- `--ring` — focus outline
- `--destructive` — delete

### Canvas & accent (full colors)

- `--color-checker-base` / `--color-checker-tile` — transparency grid
- `--color-canvas-dark` / `--color-canvas-light` — canvas-bg swatches
- `--color-keyframe` — keyframes, timeline snap guide
- `--color-snapline` — canvas alignment guides (drag-snap to layers/artboard)

## Hover convention

- **On the page backdrop** (top bar): hover → `--card` (subtle). The accent
  fill reads too loud there.
- **Inside panels / on card surfaces**: hover → `--accent`.

## Do / Don't

- ✅ `className="bg-card text-muted-foreground"`
- ✅ `style={{ background: "var(--color-keyframe)" }}` for a keyframe diamond
- ❌ `className="bg-[#18181b]"` — use `bg-card` or `bg-canvas-dark`
- ❌ `text-amber-400` for anything that isn't a keyframe

See [token-reference](../tokens/token-reference.md) for the full table.
