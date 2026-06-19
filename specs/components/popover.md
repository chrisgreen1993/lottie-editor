# Popover

## 1. Metadata

- **Name:** Popover
- **Category:** Overlay
- **Status:** Stable
- **Source:** [`components/ui/Popover.tsx`](../../components/ui/Popover.tsx)

## 2. Overview

A thin wrapper over Radix `@radix-ui/react-popover` that ships a styled,
portalled content surface. Used for the top-bar Export menu and the inspector
color swatches (react-colorful picker).

- **Use when:** you need a floating, anchored surface dismissed on outside
  click / Escape — menus, pickers, small forms.
- **Don't use for:** full-screen modals or always-on panels, and not for
  hover-only tips. For toasts use the toast system, not a popover.

## 3. Anatomy

- **`Popover`** — Radix `Root`; owns open state (controlled or uncontrolled).
- **`PopoverTrigger`** — Radix `Trigger`; pair with `asChild` to wrap a custom
  button.
- **`PopoverContent`** — portalled, styled `Content`: `--popover` surface,
  border, shadow, and `data-[state]`/`data-[side]` enter/exit animations.

## 4. Tokens used

- Surface: `bg-popover`, text `--popover-foreground`, border `--border`.
- Radius: `--radius` (`rounded-md`).
- Shadow: `--shadow-md`.
- Z-index: `--z-popover` (50).
- Padding: default `p-4` (callers tighten, e.g. `p-1.5` for the Export menu).
- Motion: Radix `data-[state]` fade/zoom + directional slide-in.

## 5. Props / API

```ts
const Popover: typeof PopoverPrimitive.Root;
const PopoverTrigger: typeof PopoverPrimitive.Trigger;

const PopoverContent: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    React.RefAttributes<...>
>;
// PopoverContent defaults: align = "center", sideOffset = 4
```

- `Popover` accepts Radix `open` / `onOpenChange` for controlled use (the
  Export menu does this with `exportOpen` state).
- `PopoverContent` forwards all Radix `Content` props (`align`, `side`,
  `sideOffset`, …) and merges `className` via `cn`; it's auto-portalled.

## 6. States

- **Closed:** unmounted content; `data-[state=closed]` plays the exit (fade +
  zoom-out-95 + slide).
- **Open:** `data-[state=open]` plays the enter (fade + zoom-in-95 + slide),
  side chosen by Radix and reflected in `data-[side=*]`.
- **Focus:** content is `outline-none`; focus is trapped/managed by Radix.

## 7. Code example

```tsx
<Popover open={exportOpen} onOpenChange={setExportOpen}>
  <PopoverTrigger asChild>
    <button
      className="inline-flex h-8 items-center gap-1.5 rounded-pill
                       bg-primary px-3.5 text-body font-medium
                       text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <Download size={14} /> Export
    </button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-56 p-1.5">
    {/* menu items */}
  </PopoverContent>
</Popover>
```

## 8. Cross-references

- [top-bar](./top-bar.md) — the Export menu
- [button](./button.md) — common trigger primitive
- Foundations: [color](../foundations/color.md), [elevation](../foundations/elevation.md)
