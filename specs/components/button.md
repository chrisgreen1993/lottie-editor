# Button

## 1. Metadata

- **Name:** Button
- **Category:** Control / primitive
- **Status:** Stable (low usage)
- **Source:** [`components/ui/Button.tsx`](../../components/ui/Button.tsx)

## 2. Overview

The CVA-driven shadcn button primitive — a variant/size matrix with a `Slot`
escape hatch. It's the generic, framework-style button.

- **Use when:** you need a standard labelled action and none of the bespoke
  editor buttons fit, or when scaffolding new surfaces (dialogs, settings).
- **Don't use for:** the editor chrome. The top bar, tool rails, and inspector
  ship **bespoke** buttons (see [icon-button](./icon-button.md) and the inline
  pill buttons in [top-bar](./top-bar.md)); this primitive is the fallback, not
  the default in-app control.

## 3. Anatomy

- **Root** — `<button>` (or any element via `asChild` → Radix `Slot`).
- **Variant** — color treatment: `default`, `destructive`, `outline`,
  `secondary`, `ghost`, `link`.
- **Size** — `default`, `sm`, `lg`, `icon`.

## 4. Tokens used

- Surface: `default` `bg-primary`; `destructive` `bg-destructive`; `secondary`
  `bg-secondary`; `outline`/`ghost` hover `bg-accent`; `outline` border `--input`.
- Text: `--primary-foreground`, `--destructive-foreground`,
  `--secondary-foreground`, `--accent-foreground`; `link` uses `--primary`.
- Radius: `--radius` (`rounded-md`); `sm`/`lg` keep `rounded-md`.
- Type: `--text-label` (`text-sm`), weight `--weight-medium`.
- Motion: `transition-colors` (default timing).
- Focus: `ring-ring` with offset against `--background`.
- Disabled: 50% opacity, pointer events off.

## 5. Props / API

```ts
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
export { Button, buttonVariants };
```

- `variant` — `"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"` (default `"default"`).
- `size` — `"default" | "sm" | "lg" | "icon"` (default `"default"`).
- `asChild` — render via `Slot` to merge props onto a child element.
- `buttonVariants` is also exported for composing the class set elsewhere.

## 6. States

- **Default:** per-variant fill/text.
- **Hover:** fills dim to `/90`–`/80`; `outline`/`ghost` gain `bg-accent`;
  `link` underlines.
- **Focus:** 2px `ring-ring` with a 2px offset.
- **Disabled:** 50% opacity, pointer events off.

## 7. Code example

```tsx
<Button>Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="destructive">Delete layer</Button>
<Button variant="ghost" size="icon" aria-label="More">
  <MoreHorizontal size={16} />
</Button>
<Button asChild>
  <a href="/docs">Docs</a>
</Button>
```

## 8. Cross-references

- [icon-button](./icon-button.md) — the bespoke icon button used in-editor
- [top-bar](./top-bar.md) — example of the inline pill buttons used instead
- [popover](./popover.md) — often paired as a trigger
- Foundations: [color](../foundations/color.md), [radius](../foundations/radius.md)
