# Toasts

## 1. Metadata

- **Name:** Toasts
- **Category:** Feedback / overlay
- **Status:** Stable
- **Source:** [`components/editor/Toasts.tsx`](../../components/editor/Toasts.tsx)

## 2. Overview

A bottom-right stack of transient notifications for short, system-level
messages — a load failure, a successful import, a CORS warning. Each toast is
manually dismissible and (by the store) auto-dismissed after a timeout. Mounted
once near the editor root.

- **Use when:** reporting the outcome of an action the user just took
  (fetch failed, file parsed, copied).
- **Don't use for:** blocking confirmation, persistent status, or validation
  tied to a specific field (handle those inline).

## 3. Anatomy

- **Container** — a `fixed` bottom-right column; pointer-events pass through the
  gap so it never blocks the canvas, while each toast re-enables pointer events.
- **Toast** — a kind icon (Info for `info`, AlertCircle for `error`), the
  message text (max-width clamped), and a trailing dismiss (X) button.
- Renders nothing when the queue is empty.

## 4. Tokens used

- Surface: info toasts use `--card`/`bg-card` (translucent + blur); error
  toasts use a `--destructive` tint fill and border.
- Border: `--border`/`border-border` (info), `--destructive` (error).
- Text: `--foreground` for the message; icon tints `--primary` (info) and
  `--destructive` (error); dismiss button `--muted-foreground` → `--foreground`
  on hover.
- Radius: `--radius`/`rounded-lg` on the toast card.
- Shadow: `--shadow-panel`-scale lift on the floating card.
- Z-index: `--z-popover`/`z-50` — sits above all editor chrome.

## 5. Props / API

```ts
export function Toasts(): JSX.Element | null;
```

- Takes no props; reads `toasts` and `dismissToast` from the `useEditor` store.
- Each entry: `{ id, message, kind: "info" | "error" }`. New toasts are pushed
  via the store's `toast(message, kind)`; auto-dismissal is owned by the store.

## 6. States

- **Default (info):** `--card` surface, `--primary` icon.
- **Error:** `--destructive`-tinted surface and icon.
- **Hover:** dismiss button text → `--foreground`.
- **Empty:** component returns `null` (no container rendered).

## 7. Code example

```tsx
<div className="pointer-events-none fixed bottom-4 right-4 z-popover flex flex-col gap-2">
  {toasts.map((t) => (
    <div
      key={t.id}
      className={cn(
        "pointer-events-auto flex items-center gap-2 rounded-lg border px-3 py-2",
        "text-body shadow-panel backdrop-blur",
        t.kind === "error"
          ? "border-destructive/50 bg-destructive/15 text-foreground"
          : "border-border bg-card/95 text-foreground",
      )}
    >
      {t.kind === "error" ? (
        <AlertCircle size={14} className="shrink-0 text-destructive" />
      ) : (
        <Info size={14} className="shrink-0 text-primary" />
      )}
      <span className="max-w-72">{t.message}</span>
      <button
        className="ml-1 text-muted-foreground hover:text-foreground"
        onClick={() => dismiss(t.id)}
      >
        <X size={12} />
      </button>
    </div>
  ))}
</div>
```

## 8. Cross-references

- [empty-state](./empty-state.md) — a common source of `toast(...)` calls
- Foundations: [color](../foundations/color.md), [elevation](../foundations/elevation.md)
