"use client";

import { set as lset } from "lodash-es";
import * as React from "react";

import { layerName } from "@/lib/lottie/model";
import { collectEditablePaths, type EditablePath } from "@/lib/lottie/pathEdit";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";

function layerNode(index: number): SVGGElement | null {
  const anim = playerBridge.get() as unknown as {
    renderer?: { elements?: Array<{ layerElement?: SVGGElement } | undefined> };
  } | null;
  return anim?.renderer?.elements?.[index]?.layerElement ?? null;
}

/** Vertex / tangent editing overlay for the layer in path-edit mode. */
export function PathEditOverlay() {
  const doc = useEditor((s) => s.doc);
  const layerIndex = useEditor((s) => s.pathEdit);
  const frame = useEditor((s) => Math.round(s.currentFrame));
  const update = useEditor((s) => s.update);
  const setPathEdit = useEditor((s) => s.setPathEdit);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const [, setTick] = React.useState(0);
  const [selected, setSelected] = React.useState<{
    path: number;
    vertex: number;
  } | null>(null);

  const paths = React.useMemo(
    () =>
      doc && layerIndex !== null
        ? collectEditablePaths(doc, layerIndex, frame)
        : [],
    [doc, layerIndex, frame],
  );

  // The lottie instance rebuilds on a deferred animation frame after each
  // edit; re-render once it has so screen mapping stays accurate.
  React.useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setTick((t) => t + 1));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [doc]);

  if (!doc || layerIndex === null) return null;
  const layer = doc.layers[layerIndex];
  const node = layerNode(layerIndex);
  const wrapper = rootRef.current?.parentElement;
  if (!layer) {
    return <div ref={rootRef} className="hidden" />;
  }

  const ctm = node?.getScreenCTM();
  const wrapperRect = wrapper?.getBoundingClientRect();

  const screenMatrix = (p: EditablePath): DOMMatrix | null =>
    ctm ? DOMMatrix.fromMatrix(ctm).multiply(p.groupMatrix) : null;

  const toOverlay = (
    m: DOMMatrix,
    pt: [number, number],
  ): [number, number] | null => {
    if (!wrapperRect) return null;
    const sp = m.transformPoint(new DOMPoint(pt[0], pt[1]));
    return [sp.x - wrapperRect.left, sp.y - wrapperRect.top];
  };

  const beginPointDrag = (
    e: React.PointerEvent,
    p: EditablePath,
    pathIdx: number,
    vertexIdx: number,
    part: "v" | "i" | "o",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (p.animated) return;
    setSelected({ path: pathIdx, vertex: vertexIdx });
    const m = screenMatrix(p);
    if (!m) return;
    const inv = m.inverse();
    const vertex = p.data.v[vertexIdx];
    const target = e.currentTarget as Element;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    const onMove = (ev: PointerEvent) => {
      const local = inv.transformPoint(new DOMPoint(ev.clientX, ev.clientY));
      update(
        (draft) => {
          if (part === "v") {
            lset(draft, [...p.dataPath, "v", vertexIdx], [local.x, local.y]);
          } else {
            // Tangents are stored relative to their vertex.
            lset(
              draft,
              [...p.dataPath, part, vertexIdx],
              [local.x - vertex[0], local.y - vertex[1]],
            );
          }
        },
        { coalesceKey: `path-${p.dataPath.join(".")}-${part}-${vertexIdx}` },
      );
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerup", onUp);
  };

  const hasAnimated = paths.some((p) => p.animated);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0"
      data-canvas-overlay
    >
      <div className="pointer-events-auto absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-md border border-border bg-card/95 px-2.5 py-1 text-[11px] shadow-lg backdrop-blur">
        <span className="text-muted-foreground">
          Editing paths · {layerName(layer, layerIndex)}
          {hasAnimated && " · animated paths are locked"}
        </span>
        <button
          type="button"
          className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium hover:bg-secondary/80"
          onClick={() => setPathEdit(null)}
        >
          Done (Esc)
        </button>
      </div>

      {paths.map((p, pi) => {
        const m = screenMatrix(p);
        if (!m) return null;
        return p.data.v.map((vert, vi) => {
          const pos = toOverlay(m, vert);
          if (!pos) return null;
          const isSel = selected?.path === pi && selected.vertex === vi;
          const tangents =
            isSel && !p.animated
              ? (["i", "o"] as const).map((part) => {
                  const rel = p.data[part][vi] ?? [0, 0];
                  if (Math.abs(rel[0]) < 0.01 && Math.abs(rel[1]) < 0.01)
                    return null;
                  const hpos = toOverlay(m, [
                    vert[0] + rel[0],
                    vert[1] + rel[1],
                  ]);
                  return hpos ? { part, hpos } : null;
                })
              : [];
          return (
            <React.Fragment key={`${pi}-${vi}`}>
              {tangents.map(
                (t) =>
                  t && (
                    <React.Fragment key={t.part}>
                      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                        <line
                          x1={pos[0]}
                          y1={pos[1]}
                          x2={t.hpos[0]}
                          y2={t.hpos[1]}
                          className="stroke-primary/60"
                          strokeWidth={1}
                        />
                      </svg>
                      <div
                        className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border border-primary bg-background"
                        style={{ left: t.hpos[0], top: t.hpos[1] }}
                        title={t.part === "i" ? "In tangent" : "Out tangent"}
                        onPointerDown={(e) =>
                          beginPointDrag(e, p, pi, vi, t.part)
                        }
                      />
                    </React.Fragment>
                  ),
              )}
              <div
                className={
                  p.animated
                    ? "pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-muted-foreground bg-muted opacity-60"
                    : isSel
                      ? "pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-[2px] border-2 border-primary bg-background"
                      : "pointer-events-auto absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-[2px] border border-primary bg-primary/70 hover:scale-125"
                }
                style={{ left: pos[0], top: pos[1] }}
                title={
                  p.animated
                    ? `${p.name} — animated path (locked)`
                    : `${p.name} · vertex ${vi + 1} — drag to move, click for tangents`
                }
                onPointerDown={(e) => beginPointDrag(e, p, pi, vi, "v")}
              />
            </React.Fragment>
          );
        });
      })}
    </div>
  );
}
