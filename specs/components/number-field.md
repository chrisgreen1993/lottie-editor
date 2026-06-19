# NumberField

## 1. Metadata

- **Name:** NumberField (and `Section`)
- **Category:** Editor / fields
- **Status:** Stable
- **Source:** [`components/editor/fields.tsx`](../../components/editor/fields.tsx)

## 2. Overview

A borderless rounded numeric input with a label stacked above it, used
throughout the [inspector](./inspector.md) for document size, transform values,
and stroke width. Local text state lets the user type freely; the value commits
on blur or Enter (clamped to `min`/`max`), and Escape reverts. `Section` is the
titled block these fields sit inside.

- **Use when:** editing a single numeric property in the inspector.
- **Don't use for:** colors (use [color-swatch](./color-swatch.md)), free text,
  or non-numeric toggles. The field is keyboard-/spinner-numeric only.

## 3. Anatomy

- **Label** — uppercase `--text-meta` caption above the input.
- **Input** — `rounded-lg` numeric field on `bg-background`, `tabular-nums`,
  no visible border, full-width within its flex column.
- **Section** (companion export) — a bordered block with an uppercase title row
  (optional `actions` slot) wrapping arbitrary children.

## 4. Tokens used

- Surface: input sits on `--background` (`bg-background`).
- Text: value `--foreground`; label `--muted-foreground`; `Section` title
  `--muted-foreground`.
- Radius: `--radius` on the input (`rounded-lg`).
- Border: `Section` divider `--border` (`border-border`).
- Type: input `--text-body`, `tabular-nums`; label `--text-meta`
  `--weight-medium` uppercase; `Section` title at the `--text-label`-ish
  uppercase caption, `--weight-semibold`.
- Ring: focus `ring-1 ring-ring` (`--ring`).
- Spacing: `Section` padding `px-3 py-3` (`--space-sm`); label/input gap
  `gap-1` (`--space-2xs`).

> Note: the `Section` title is sized with a raw `text-[11px]` (between
> `--text-meta` and `--text-body`) rather than a named type token — a local
> deviation.

## 5. Props / API

```ts
export function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}): JSX.Element;

interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  step?: number; // default 1
  min?: number;
  max?: number;
  disabled?: boolean;
  precision?: number; // default 2
}
export function NumberField(props: NumberFieldProps): JSX.Element;
```

- `value` is the source of truth; the field mirrors it into local text and only
  fires `onCommit` when the committed, clamped value actually differs.
- `precision` controls the displayed/committed rounding; `disabled` is driven by
  callers when a property is keyframed.

## 6. States

- **Default:** value shown, no border, on `--background`.
- **Focus:** local text editing begins; `ring-1 ring-ring` shows. Enter blurs
  (commits); Escape reverts to the last value and blurs.
- **Disabled:** `cursor-not-allowed` at 50% opacity, with the title
  "This property is keyframed — edit disabled".
- **Invalid input:** a non-finite entry is discarded on commit and the field
  snaps back to the current value.

## 7. Code example

```tsx
<Section title="Document">
  <div className="flex gap-2">
    <NumberField
      label="Width"
      value={doc.w}
      min={1}
      precision={0}
      onCommit={(v) => update((d) => void (d.w = Math.round(v)))}
    />
    <NumberField label="Height" value={doc.h} min={1} precision={0}
      onCommit={(v) => update((d) => void (d.h = Math.round(v)))} />
  </div>
</Section>

// the input, token-backed
<input type="number"
  className="h-7 w-full rounded-lg bg-background px-2 text-body tabular-nums
             text-foreground focus-visible:ring-1 focus-visible:ring-ring
             disabled:cursor-not-allowed disabled:opacity-50" />
```

## 8. Cross-references

- [color-swatch](./color-swatch.md) — its sibling field in `fields.tsx`
- [inspector](./inspector.md) — primary consumer (`Section` + `NumberField`)
- Foundations: [radius](../foundations/radius.md), [typography](../foundations/typography.md), [color](../foundations/color.md)
