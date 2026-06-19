"use client";

import * as React from "react";

interface Handles {
  o: { x: number; y: number };
  i: { x: number; y: number };
}

const SIZE = 168;
const PAD = 14;

function toPx(x: number, y: number): [number, number] {
  return [PAD + x * (SIZE - 2 * PAD), SIZE - PAD - y * (SIZE - 2 * PAD)];
}

function fromPx(px: number, py: number): [number, number] {
  return [
    Math.min(1, Math.max(0, (px - PAD) / (SIZE - 2 * PAD))),
    Math.min(1.4, Math.max(-0.4, (SIZE - PAD - py) / (SIZE - 2 * PAD))),
  ];
}

/** Interactive cubic-bezier editor for a keyframe segment.
 *  `o` is the outgoing handle (from the keyframe), `i` the incoming
 *  handle (into the next keyframe) — matching Lottie's easing model. */
export function EasingEditor({
  value,
  onChange,
}: {
  value: Handles;
  onChange: (handles: Handles) => void;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const [x0, y0] = toPx(0, 0);
  const [x1, y1] = toPx(1, 1);
  const [ox, oy] = toPx(value.o.x, value.o.y);
  const [ix, iy] = toPx(value.i.x, value.i.y);

  const startDrag = (which: "o" | "i") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const target = e.currentTarget as Element;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }

    const onMove = (ev: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const [x, y] = fromPx(ev.clientX - rect.left, ev.clientY - rect.top);
      onChange(
        which === "o" ? { ...value, o: { x, y } } : { ...value, i: { x, y } },
      );
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerup", onUp);
  };

  return (
    <svg
      ref={svgRef}
      width={SIZE}
      height={SIZE}
      className="touch-none select-none rounded border border-border bg-background"
    >
      {/* grid */}
      {[0.25, 0.5, 0.75].map((f) => {
        const [gx] = toPx(f, 0);
        const [, gy] = toPx(0, f);
        return (
          <g key={f} className="stroke-border/60">
            <line x1={gx} y1={PAD} x2={gx} y2={SIZE - PAD} strokeWidth={1} />
            <line x1={PAD} y1={gy} x2={SIZE - PAD} y2={gy} strokeWidth={1} />
          </g>
        );
      })}
      <line
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        className="stroke-border"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* handle arms */}
      <line
        x1={x0}
        y1={y0}
        x2={ox}
        y2={oy}
        className="stroke-muted-foreground"
        strokeWidth={1}
      />
      <line
        x1={x1}
        y1={y1}
        x2={ix}
        y2={iy}
        className="stroke-muted-foreground"
        strokeWidth={1}
      />
      {/* curve */}
      <path
        d={`M ${x0} ${y0} C ${ox} ${oy}, ${ix} ${iy}, ${x1} ${y1}`}
        fill="none"
        className="stroke-primary"
        strokeWidth={2}
      />
      {/* endpoints */}
      <circle cx={x0} cy={y0} r={3} className="fill-foreground" />
      <circle cx={x1} cy={y1} r={3} className="fill-foreground" />
      {/* draggable handles */}
      <circle
        cx={ox}
        cy={oy}
        r={6}
        className="cursor-grab fill-primary stroke-background active:cursor-grabbing"
        strokeWidth={2}
        onPointerDown={startDrag("o")}
      />
      <circle
        cx={ix}
        cy={iy}
        r={6}
        className="cursor-grab fill-keyframe stroke-background active:cursor-grabbing"
        strokeWidth={2}
        onPointerDown={startDrag("i")}
      />
    </svg>
  );
}
