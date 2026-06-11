"use client";

import { RotateCw } from "lucide-react";
import * as React from "react";

import { sampleProp, type AnimProp } from "@/lib/lottie/keyframes";
import { setTransformAtPlayhead } from "@/lib/lottie/transformEdit";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
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

export function CanvasOverlay({ scale }: { scale: number }) {
  const doc = useEditor((s) => s.doc);
  const selected = useEditor((s) => s.selectedLayer);
  const update = useEditor((s) => s.update);
  const setPlaying = useEditor((s) => s.setPlaying);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<Box | null>(null);

  // The lottie instance rebuilds asynchronously after document edits and
  // moves every frame during playback, so track the layer's screen box on a
  // rAF loop and only re-render when it actually changes.
  React.useEffect(() => {
    if (selected === null || !doc) {
      setBox(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
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
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [doc, selected, scale]);

  if (selected === null || !doc)
    return <div ref={rootRef} className="hidden" />;

  const beginDrag = (
    e: React.PointerEvent,
    onMove: (ev: PointerEvent, ctx: DragContext) => void,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setPlaying(false);

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

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    const handleMove = (ev: PointerEvent) => onMove(ev, ctx);
    const handleUp = () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerup", handleUp);
    };
    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerup", handleUp);
  };

  const moveLayer = (ev: PointerEvent, ctx: DragContext) => {
    const dx = (ev.clientX - ctx.startX) / scale;
    const dy = (ev.clientY - ctx.startY) / scale;
    update(
      (draft) =>
        setTransformAtPlayhead(draft, selected, "p", ctx.frame, [
          ctx.startPosition[0] + dx,
          ctx.startPosition[1] + dy,
        ]),
      { coalesceKey: `canvas-move-${selected}` },
    );
  };

  const scaleLayer = (ev: PointerEvent, ctx: DragContext) => {
    const d0 = Math.hypot(ctx.startX - ctx.centerX, ctx.startY - ctx.centerY);
    const d1 = Math.hypot(ev.clientX - ctx.centerX, ev.clientY - ctx.centerY);
    if (d0 < 2) return;
    const factor = d1 / d0;
    update(
      (draft) =>
        setTransformAtPlayhead(draft, selected, "s", ctx.frame, [
          ctx.startScale[0] * factor,
          ctx.startScale[1] * factor,
        ]),
      { coalesceKey: `canvas-scale-${selected}` },
    );
  };

  const rotateLayer = (ev: PointerEvent, ctx: DragContext) => {
    const a0 = Math.atan2(ctx.startY - ctx.centerY, ctx.startX - ctx.centerX);
    const a1 = Math.atan2(ev.clientY - ctx.centerY, ev.clientX - ctx.centerX);
    let deg = ctx.startRotation + ((a1 - a0) * 180) / Math.PI;
    if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
    update(
      (draft) => setTransformAtPlayhead(draft, selected, "r", ctx.frame, [deg]),
      { coalesceKey: `canvas-rotate-${selected}` },
    );
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
        <>
          <div
            className="pointer-events-auto absolute cursor-move border border-primary/90"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }}
            title="Drag to move the layer"
            onPointerDown={(e) => beginDrag(e, moveLayer)}
          />
          {corners.map((c) => (
            <div
              key={c.key}
              className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize rounded-[2px] border border-primary bg-background"
              style={{
                left: c.left,
                top: c.top,
                cursor:
                  c.key === "nw" || c.key === "se"
                    ? "nwse-resize"
                    : "nesw-resize",
              }}
              title="Drag to scale the layer"
              onPointerDown={(e) => beginDrag(e, scaleLayer)}
            />
          ))}
          <div
            className="pointer-events-auto absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-primary bg-background text-primary active:cursor-grabbing"
            style={{
              left: box.left + box.width / 2,
              top: Math.max(12, box.top - 18),
            }}
            title="Drag to rotate (⇧ snaps to 15°)"
            onPointerDown={(e) => beginDrag(e, rotateLayer)}
          >
            <RotateCw size={10} />
          </div>
        </>
      )}
    </div>
  );
}

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
