# ColorSwatch

## 1. Metadata

- **Name:** ColorSwatch
- **Category:** Editor / fields
- **Status:** Stable
- **Source:** [`components/editor/fields.tsx`](../../components/editor/fields.tsx)

## 2. Overview

A small color button that opens a `react-colorful` picker plus a hex input,
paired with a label and optional subtitle and a trailing hex readout. Used in
the [inspector](./inspector.md) for layer fills/strokes and the document
palette. The swatch reflects the bound `RGB`; both the picker and the hex field
report changes through `onChange`.

- **Use when:** editing a single color (fill, stroke, or palette entry).
- **Don't use for:** numeric properties (use [number-field](./number-field.md)).
  Animated colors should be passed `disabled` by the caller.

## 3. Anatomy

- **Swatch button** — square chip filled with the current color; opens the
  picker popover.
- **Popover** — `react-colorful` `HexColorPicker` above a hex text input.
- **Label / subtitle** — name and optional secondary line (e.g. "fill ·
  animated · on key").
- **Hex readout** — trailing uppercase `tabular-nums` hex value.

## 4. Tokens used

- Surface: swatch sits on its own color fill; hex input on `--background`
  (`bg-background`). The popover surface is `--popover` (owned by
  [popover](./popover.md)).
- Text: label `--foreground`; subtitle and hex readout `--muted-foreground`.
- Radius: swatch and hex input round to the control step
  (`rounded` / `rounded-control`, both 4px).
- Border: swatch outline `--border` (`border-border`).
- Shadow: swatch carries `--shadow-sm` (`shadow-sm`) — the elevation token
  reserved for swatches.
- Ring: hex input focus `ring-1 ring-ring` (`--ring`).
- Motion: swatch `transition-transform` with a `hover:scale-110` lift.
- Spacing: row gap `gap-2` (`--space-xs`); popover padding `p-3` (`--space-sm`).

## 5. Props / API

```ts
interface ColorSwatchProps {
  label: string;
  rgb: RGB;
  onChange: (rgb: RGB) => void;
  disabled?: boolean;
  subtitle?: string;
}
export function ColorSwatch(props: ColorSwatchProps): JSX.Element;
```

- `rgb` (from `lib/lottie/color`) is the source of truth; the component derives
  hex via `rgbToHex` and parses edits with `hexToRgb`, reverting on an invalid
  hex.
- `onChange` fires from both the picker and the hex input. `disabled` is set by
  the caller for animated colors.

## 6. States

- **Default:** swatch filled with the current color; hex shown alongside.
- **Hover:** swatch scales up (`hover:scale-110`).
- **Open:** popover shows the picker + hex input; typing a valid hex commits,
  an invalid one reverts.
- **Focus:** hex input shows `ring-1 ring-ring`.
- **Disabled:** swatch `cursor-not-allowed` at 50% opacity with the title
  "Animated color — edit disabled"; the popover does not open.

## 7. Code example

```tsx
<ColorSwatch
  label={ref.name}
  subtitle={ref.animated ? `${ref.kind} · animated` : ref.kind}
  rgb={ref.rgb}
  disabled={ref.animated}
  onChange={(rgb) =>
    update((draft) => applyColorRef(draft, ref, rgb), { coalesceKey: `color-${ref.id}` })
  }
/>

// the swatch button, token-backed
<button
  className="h-6 w-6 shrink-0 rounded border border-border shadow-sm
             transition-transform hover:scale-110
             disabled:cursor-not-allowed disabled:opacity-50"
  style={{ backgroundColor: hex }}
/>
```

## 8. Cross-references

- [number-field](./number-field.md) — its sibling field in `fields.tsx`
- [popover](./popover.md) — the picker container
- [inspector](./inspector.md) — fills, strokes, and the document palette
- Foundations: [color](../foundations/color.md), [elevation](../foundations/elevation.md), [radius](../foundations/radius.md)
