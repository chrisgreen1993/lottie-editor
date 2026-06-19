# Foundations — Spacing

A 4px base step. The editor is information-dense (timeline rows, inspector
fields), so most spacing lives at the small end — `--space-2xs` (4px) and
`--space-xs` (8px) do the heavy lifting; larger steps appear in the empty
state and canvas insets.

## Scale

| Alias          | px  | Tailwind      | Typical use                         |
| -------------- | --- | ------------- | ----------------------------------- |
| `--space-none` | 0   | `p-0` `gap-0` | Resets (e.g. number-input margin)   |
| `--space-3xs`  | 2   | `gap-0.5`     | Icon clusters, hairline gaps        |
| `--space-2xs`  | 4   | `p-1` `gap-1` | Tight control padding, toolbar gaps |
| `--space-xs`   | 8   | `p-2` `gap-2` | Default control padding, row gaps   |
| `--space-sm`   | 12  | `p-3` `gap-3` | Panel headers, section padding      |
| `--space-md`   | 16  | `p-4` `gap-4` | Section blocks, checker tile size   |
| `--space-lg`   | 24  | `gap-6`       | Empty-state vertical rhythm         |
| `--space-xl`   | 32  | `gap-8`       | Large layout gaps                   |
| `--space-2xl`  | 48  | —             | Canvas inset, hero padding          |

## Guidance

- **Panels** use the layout gutter of `--space-2xs` (the `gap-1`/`p-1` around
  the panel row in `Editor`), so cards visually float on the backdrop.
- **Panel headers** are `h-9` with `--space-sm` horizontal padding.
- **Inspector sections** pad `--space-sm` all round, `--space-xs` between rows.
- **Timeline rows** are fixed heights (28px layer rows, 24px tracks/ruler);
  treat those as component constants, not spacing tokens.
- Prefer Tailwind spacing utilities (which map to the same 4px grid). Only use
  arbitrary values when a true one-off is unavoidable — and prefer adding a
  token if it recurs.

## Do / Don't

- ✅ `className="px-3 py-2 gap-2"`
- ❌ `className="px-[13px]"` — snap to the 4px grid (`px-3`)
