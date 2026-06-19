# Lottie Editor — AI working instructions

A browser Lottie animation editor: Next.js 14 (App Router) · React 18 ·
TypeScript · Tailwind · zustand · lottie-web. UI lives in
`components/editor/`, domain logic in `lib/lottie/`, global state in
`lib/store.ts`.

## Design system — REQUIRED before any UI work

**Before writing or modifying any UI code, read the relevant spec file in
`specs/`.** Use only tokens from `app/tokens.css`. Run the token audit script
before committing. Zero errors required.

Concretely:

1. **Read the spec first.** For a component, read
   `specs/components/<name>.md`. For a cross-cutting visual decision (color,
   spacing, type, radius, elevation, motion), read the matching file in
   `specs/foundations/`. The full variable map is
   `specs/tokens/token-reference.md`.
2. **Use only tokens — never raw values.** No hex/rgb colors, no raw `px`/`rem`
   spacing or radii, no raw shadows or z-index in components or CSS. Reference
   **Layer 2** aliases (e.g. `bg-card`, `text-muted-foreground`, `rounded-pill`,
   `text-meta`, `bg-keyframe`, `shadow-panel`, `z-popover`) via Tailwind
   utilities, or `var(--token)` directly in CSS. Never reference Layer 1
   `--ds-*` primitives from a component.
3. **Need a value that has no token?** Add a primitive **and** a Layer 2 alias
   in `app/tokens.css`, document it in `specs/tokens/token-reference.md` and the
   relevant foundation, then use the alias. Do not inline the raw value.
4. **Run the audit before committing:** `npm run token-audit` — it must report
   **zero errors** (exit 0). It scans CSS files; `tokens.css` is the only place
   raw values may live.
5. **Update the spec** when you change a component's anatomy, tokens, states,
   or API, so specs stay the source of truth.

### Token layers (`app/tokens.css`)

- **Layer 1 `--ds-*`** — primitives; raw values live here only.
- **Layer 2** — semantic aliases referencing Layer 1 with a fallback
  (`--color-keyframe: var(--ds-amber-400-hex, #fbbf24)`). This is the API.
- **Layer 3** — components, via Tailwind utilities (`tailwind.config.ts` maps
  them to Layer 2) or direct `var()`.

Exception: SVG **content** colors passed as raw attributes (e.g. the graph
editor's `GRAPH_DIM_COLORS` data palette, imported-artwork fills) are sample
content, not chrome, and are not tokenized.

## Build / verify commands

- `npm run dev` — dev server
- `npm run lint` — ESLint (zero warnings expected)
- `npm run build` — production build must compile
- `npm run token-audit` — design-token audit (zero errors required)

When a change is visible in the browser, verify it in the preview rather than
asking the user to check manually.
