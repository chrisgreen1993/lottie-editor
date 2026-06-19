# Inspector

## 1. Metadata

- **Name:** Inspector
- **Category:** Editor / panels
- **Status:** Stable
- **Source:** [`components/editor/Inspector.tsx`](../../components/editor/Inspector.tsx)

## 2. Overview

The right floating panel for editing the current selection. With nothing
selected it shows **Document** settings (size, frame rate, duration, palette);
with a layer selected it shows **Layer** settings (transform, colors, stroke
width). Transform rows expose keyframe controls only in animate mode.

- **Use when:** a document is open — `Editor` mounts it opposite the
  [layer-panel](./layer-panel.md).
- **Don't use for:** choosing or ordering layers (that's the layer panel) or
  global actions (the [top-bar](./top-bar.md)). Keep it to property editing.

## 3. Anatomy

- **Card** — `rounded-panel` `bg-card` column; width from the store
  (`panels.inspectorW`).
- **Header** — `SlidersHorizontal` icon + a title that reads "Document" or
  "Inspector" depending on selection.
- **Document view** — a "Document" [Section](./number-field.md) of
  [NumberField](./number-field.md)s (Width, Height, Frame rate, End frame) plus a
  derived stats line, then a "Palette" section of document-wide
  [ColorSwatch](./color-swatch.md)es.
- **Layer view** — a "Layer" identity section; a "Transform" section of
  `TransformPropRow`s; conditional "Colors" and "Stroke width" sections.
- **TransformPropRow** — one or two `NumberField`s (X/Y, Scale, Rotation,
  Opacity, Anchor) plus a `KeyframeToggle` stopwatch diamond shown only in
  animate mode.

## 4. Tokens used

- Surface: card `bg-card` (`--card`); keyframe-toggle hover `bg-accent` (`--accent`).
- Text: values/labels `--foreground`; section sublabels, stats, and hints
  `--muted-foreground`.
- Radius: `--radius-panel` on the card (fields/swatches own their own radii).
- Border: `--border` on the header and every `Section` divider.
- Type: header title `--text-body` `--weight-semibold`; layer name `--text-body`;
  sublabels/stats/hints at `--text-meta`.
- Accent: keyframe diamond uses `--primary` when parked on a key
  (`text-primary`, fill on); the keyframe color (`--color-keyframe`,
  `bg-keyframe`/`fill-keyframe`) is the system token for diamonds.
- Motion: `transition-colors` on the keyframe toggle.

> Note: the off-key keyframe diamond is drawn with a raw `text-amber-400` rather
> than the `--color-keyframe` (`fill-keyframe`) alias — a local deviation.

## 5. Props / API

```ts
export function Inspector(): JSX.Element | null;
```

- Takes no props; reads `doc`, `selectedLayer`, and `panels.inspectorW` from
  `useEditor`. Returns `null` when no document is open.

Internal sections:

```ts
function DocumentSettings(): JSX.Element;
function LayerSettings({ index }: { index: number }): JSX.Element;

interface PropSpec {
  key: "p" | "a" | "s" | "r" | "o";
  labels: [string] | [string, string];
  fallback: number[];
  min?: number;
  max?: number;
}
function TransformPropRow({
  spec,
  layerIndex,
}: {
  spec: PropSpec;
  layerIndex: number;
}): JSX.Element;
function KeyframeToggle({
  state,
  onClick,
}: {
  state: "static" | "on-key" | "off-key";
  onClick: () => void;
}): JSX.Element;
```

- Keyframe state is derived via `lib/lottie/keyframes` (`sampleProp`,
  `addKeyframe`, `deleteKeyframe`, `convertToAnimated`, `setKeyframeValue`).
- Colors and strokes are gathered via `lib/lottie/ops` (`collectDocColors`,
  `collectLayerColors`, `collectStrokeWidths`, `paletteGroups`, `applyColorRef`,
  `setStrokeWidth`).

## 6. States

- **Default (no selection):** Document settings render.
- **Layer selected:** Layer settings render (`selectedLayer !== null`).
- **Animate mode:** `TransformPropRow` shows the `KeyframeToggle`; static props
  are editable, animated props are editable only when the playhead is parked on
  a key (otherwise the field is disabled).
- **Keyframe toggle states:** `static` (muted diamond), `on-key` (filled
  `--primary`), `off-key` (amber, hollow).
- **Disabled:** transform fields when an animated prop is off-key; stroke fields
  when the stroke is animated; animated `ColorSwatch`es are disabled by the
  caller.

## 7. Code example

```tsx
<aside className="flex shrink-0 flex-col overflow-hidden rounded-panel bg-card"
       style={{ width }}>
  <div className="flex h-9 items-center gap-2 border-b border-border px-3">
    <SlidersHorizontal size={13} className="text-muted-foreground" />
    <span className="text-body font-semibold">
      {selectedLayer === null ? "Document" : "Inspector"}
    </span>
  </div>
  {selectedLayer === null ? <DocumentSettings /> : <LayerSettings index={selectedLayer} />}
</aside>

// transform row — diamond only in animate mode
<div className="mt-2 flex gap-2 first:mt-0">
  <NumberField label="X" value={x} onCommit={(v) => commit(0, v)} />
  <NumberField label="Y" value={y} onCommit={(v) => commit(1, v)} />
  {animateMode && <KeyframeToggle state={toggleState} onClick={onToggle} />}
</div>
```

## 8. Cross-references

- [number-field](./number-field.md) — the numeric inputs and `Section` wrapper
- [color-swatch](./color-swatch.md) — fill / stroke / palette color editing
- [layer-panel](./layer-panel.md) — selects the layer this panel edits
- [top-bar](./top-bar.md) — the Design/Animate mode switch that gates keyframes
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md), [typography](../foundations/typography.md)
