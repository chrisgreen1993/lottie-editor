"use client";

import { RotateCw } from "lucide-react";
import * as React from "react";

import { sampleProp, type AnimProp } from "@/lib/lottie/keyframes";
import { hasEditablePath } from "@/lib/lottie/pathEdit";
import { setTransformAtPlayhead } from "@/lib/lottie/transformEdit";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

type DragMode = "move" | "scale" | "rotate";

interface DragContext {
  frame: number;
  startX: number;
  startY: number;
  startPosition: [number, number];
  startScale: number[];
  startRotation: number;
  centerX: number;
  centerY: number;
}

/** lottie-web's renderer keeps one element per layer (parallel to
 *  doc.layers); each has the SVG group it draws into. Untyped internals. */
function layerNode(index: number): SVGGElement | null {
  const anim = playerBridge.get() as unknown as {
    renderer?: { elements?: Array<{ layerElement?: SVGGElement } | undefined> };
  } | null;
  return anim?.renderer?.elements?.[index]?.layerElement ?? null;
}

function samplePosition(
  ks: Record<string, AnimProp & { s?: boolean; x?: AnimProp; y?: AnimProp }>,
  frame: number,
): [number, number] {
  const p = ks.p;
  if (p?.s === true) {
    return [
      sampleProp(p.x, [0], frame).value[0] ?? 0,
      sampleProp(p.y, [0], frame).value[0] ?? 0,
    ];
  }
  const v = sampleProp(p, [0, 0], frame).value;
  return [v[0] ?? 0, v[1] ?? 0];
}

/** The dragged value (position / scale / rotation) for the current pointer
 *  state — shared by the live preview and the final commit. */
function dragValue(
  mode: DragMode,
  ev: PointerEvent,
  ctx: DragContext,
  scale: number,
): number[] {
  if (mode === "move") {
    return [
      ctx.startPosition[0] + (ev.clientX - ctx.startX) / scale,
      ctx.startPosition[1] + (ev.clientY - ctx.startY) / scale,
    ];
  }
  if (mode === "scale") {
    const d0 = Math.hypot(ctx.startX - ctx.centerX, ctx.startY - ctx.centerY);
    const d1 = Math.hypot(ev.clientX - ctx.centerX, ev.clientY - ctx.centerY);
    const factor = d0 < 2 ? 1 : d1 / d0;
    return [ctx.startScale[0] * factor, ctx.startScale[1] * factor];
  }
  const a0 = Math.atan2(ctx.startY - ctx.centerY, ctx.startX - ctx.centerX);
  const a1 = Math.atan2(ev.clientY - ctx.centerY, ev.clientX - ctx.centerX);
  let deg = ctx.startRotation + ((a1 - a0) * 180) / Math.PI;
  if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
  return [deg];
}

/** Preview matrix for a drag, composed in the layer's parent space on top
 *  of lottie's own transform (CSS transform overrides the SVG attribute,
 *  so the original attribute matrix must be folded in). */
function previewMatrix(
  mode: DragMode,
  value: number[],
  ctx: DragContext,
  orig: DOMMatrix,
): DOMMatrix {
  const [px, py] = ctx.startPosition;
  if (mode === "move") {
    return new DOMMatrix()
      .translate(
        value[0] - ctx.startPosition[0],
        value[1] - ctx.startPosition[1],
      )
      .multiply(orig);
  }
  if (mode === "scale") {
    const base = Math.abs(ctx.startScale[0]) < 0.001 ? 1 : ctx.startScale[0];
    const factor = Math.abs(ctx.startScale[0]) < 0.001 ? 1 : value[0] / base;
    return new DOMMatrix()
      .translate(px, py)
      .scale(factor)
      .translate(-px, -py)
      .multiply(orig);
  }
  return new DOMMatrix()
    .translate(px, py)
    .rotate(value[0] - ctx.startRotation)
    .translate(-px, -py)
    .multiply(orig);
}

/** Screen-space CSS transform for the selection frame during a drag,
 *  mirroring what the artwork preview does around the box center. */
function frameTransform(
  mode: DragMode,
  ev: PointerEvent,
  ctx: DragContext,
): string {
  if (mode === "move") {
    return `translate(${ev.clientX - ctx.startX}px, ${ev.clientY - ctx.startY}px)`;
  }
  if (mode === "scale") {
    const d0 = Math.hypot(ctx.startX - ctx.centerX, ctx.startY - ctx.centerY);
    const d1 = Math.hypot(ev.clientX - ctx.centerX, ev.clientY - ctx.centerY);
    const factor = d0 < 2 ? 1 : d1 / d0;
    return `scale(${factor})`;
  }
  const a0 = Math.atan2(ctx.startY - ctx.centerY, ctx.startX - ctx.centerX);
  const a1 = Math.atan2(ev.clientY - ctx.centerY, ev.clientX - ctx.centerX);
  let deg = ((a1 - a0) * 180) / Math.PI;
  if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
  return `rotate(${deg}deg)`;
}

export function CanvasOverlay({ scale }: { scale: number }) {
  const doc = useEditor((s) => s.doc);
  const selected = useEditor((s) => s.selectedLayer);
  const update = useEditor((s) => s.update);
  const setPlaying = useEditor((s) => s.setPlaying);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box | null>(null);
  // While a drag is live the box is moved by a single CSS transform on the
  // frame wrapper (lockstep with the artwork preview); measurement pauses so
  // the rAF loop can't fight the transform and make the box stutter.
  const draggingRef = React.useRef(false);
  const lastDownRef = React.useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  // The lottie instance rebuilds asynchronously after document edits and
  // moves every frame during playback, so track the layer's screen box on a
  // rAF loop and only re-render when it actually changes. The first
  // measurement runs synchronously so the box appears with the selection.
  React.useEffect(() => {
    if (selected === null || !doc) {
      setBox(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      // Frozen during a drag — the frame wrapper is transformed directly.
      if (draggingRef.current) return;
      const node = layerNode(selected);
      const parent = rootRef.current?.parentElement;
      if (!node || !parent) {
        setBox((prev) => (prev === null ? prev : null));
        return;
      }
      const prect = parent.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      if (rect.width < 1 && rect.height < 1) {
        setBox((prev) => (prev === null ? prev : null));
        return;
      }
      const next: Box = {
        left: rect.left - prect.left,
        top: rect.top - prect.top,
        width: rect.width,
        height: rect.height,
      };
      setBox((prev) =>
        prev &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next,
      );
    };
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    measure();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [doc, selected, scale]);

  if (selected === null || !doc)
    return <div ref={rootRef} className="hidden" />;

  const beginDrag = (e: React.PointerEvent, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    setPlaying(false);

    // preventDefault on pointerdown suppresses the browser's dblclick, so
    // a quick second press on the box opens path editing manually.
    if (mode === "move") {
      const last = lastDownRef.current;
      const now = performance.now();
      const isDouble =
        now - last.time < 350 &&
        Math.hypot(e.clientX - last.x, e.clientY - last.y) < 6;
      lastDownRef.current = { time: now, x: e.clientX, y: e.clientY };
      if (isDouble && doc && hasEditablePath(doc, selected)) {
        useEditor.getState().setPathEdit(selected);
        return;
      }
    }

    const state = useEditor.getState();
    const layer = state.doc?.layers[selected];
    if (!layer) return;
    const ks = (layer.ks ?? {}) as Record<
      string,
      AnimProp & { s?: boolean; x?: AnimProp; y?: AnimProp }
    >;
    const f = Math.round(state.currentFrame);
    const node = layerNode(selected);
    const rect = node?.getBoundingClientRect();
    const ctx: DragContext = {
      frame: f,
      startX: e.clientX,
      startY: e.clientY,
      startPosition: samplePosition(ks, f),
      startScale: (() => {
        const v = sampleProp(ks.s, [100, 100], f).value;
        return [v[0] ?? 100, v[1] ?? 100];
      })(),
      startRotation: sampleProp(ks.r, [0], f).value[0] ?? 0,
      centerX: rect ? rect.left + rect.width / 2 : e.clientX,
      centerY: rect ? rect.top + rect.height / 2 : e.clientY,
    };

    // Live preview: drags transform the SVG node directly instead of
    // committing document edits per move — a doc commit rebuilds the whole
    // lottie instance, which is what made dragging feel laggy. The real
    // (auto-keyed) write happens once on release.
    let orig = new DOMMatrix();
    const attr = node?.getAttribute("transform");
    if (attr) {
      try {
        orig = new DOMMatrix(attr);
      } catch {
        // Unparseable transform — preview from identity.
      }
    }
    if (node) node.style.transformOrigin = "0 0";

    // Freeze box measurement and move the selection frame as one unit, in
    // lockstep with the artwork preview, so the box never stutters.
    draggingRef.current = true;
    const frame = frameRef.current;
    if (frame && box) {
      frame.style.transformOrigin = `${box.left + box.width / 2}px ${
        box.top + box.height / 2
      }px`;
    }

    let lastValue: number[] | null = null;
    let moved = false;
    const propKey = mode === "move" ? "p" : mode === "scale" ? "s" : "r";

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    const handleMove = (ev: PointerEvent) => {
      moved = true;
      lastValue = dragValue(mode, ev, ctx, scale);
      if (node) {
        node.style.transform = previewMatrix(
          mode,
          lastValue,
          ctx,
          orig,
        ).toString();
      }
      // The frame box follows with the equivalent screen-space transform.
      if (frame) frame.style.transform = frameTransform(mode, ev, ctx);
    };
    const resume = () => {
      if (frame) frame.style.transform = "";
      draggingRef.current = false;
    };
    const handleUp = () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
      if (moved && lastValue) {
        const value = lastValue;
        update((draft) =>
          setTransformAtPlayhead(draft, selected, propKey, ctx.frame, value),
        );
        // Keep the preview (node transform + frame transform) in place until
        // the canvas has rebuilt at the committed position, then resume
        // measuring — avoids a one-frame flash back to the old spot.
        requestAnimationFrame(() => requestAnimationFrame(resume));
      } else {
        if (node) {
          node.style.transform = "";
          node.style.transformOrigin = "";
        }
        resume();
      }
    };
    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
  };

  const corners = box
    ? ([
        { key: "nw", left: box.left, top: box.top },
        { key: "ne", left: box.left + box.width, top: box.top },
        { key: "sw", left: box.left, top: box.top + box.height },
        { key: "se", left: box.left + box.width, top: box.top + box.height },
      ] as const)
    : [];

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0"
      data-canvas-overlay
    >
      {box && (
        <div ref={frameRef} className="pointer-events-none absolute inset-0">
          <div
            className="pointer-events-auto absolute cursor-move border border-primary/90"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }}
            title="Drag to move the layer"
            onPointerDown={(e) => beginDrag(e, "move")}
          />
          {corners.map((c) => (
            <div
              key={c.key}
              className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-primary bg-background"
              style={{
                left: c.left,
                top: c.top,
                cursor:
                  c.key === "nw" || c.key === "se"
                    ? "nwse-resize"
                    : "nesw-resize",
              }}
              title="Drag to scale the layer"
              onPointerDown={(e) => beginDrag(e, "scale")}
            />
          ))}
          <div
            className="pointer-events-auto absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-primary bg-background text-primary active:cursor-grabbing"
            style={{
              left: box.left + box.width / 2,
              top: Math.max(12, box.top - 18),
            }}
            title="Drag to rotate (⇧ snaps to 15°)"
            onPointerDown={(e) => beginDrag(e, "rotate")}
          >
            <RotateCw size={10} />
          </div>
        </div>
      )}
    </div>
  );
}
