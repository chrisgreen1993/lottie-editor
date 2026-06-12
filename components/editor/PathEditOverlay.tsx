"use client";

import { get as lget, set as lset } from "lodash-es";
import * as React from "react";

import {
  autoSmoothVertex,
  closePath,
  constrain45,
  cutAtVertex,
  isCornerVertex,
  nearestOnSegment,
  pathToD,
  removeVertex,
  segmentCount,
  splitSegment,
} from "@/lib/lottie/bezier";
import { layerName } from "@/lib/lottie/model";
import {
  collectEditablePaths,
  type BezierPathData,
  type EditablePath,
} from "@/lib/lottie/pathEdit";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";
import { cn } from "@/lib/utils";

function layerNode(index: number): SVGGElement | null {
  const anim = playerBridge.get() as unknown as {
    renderer?: { elements?: Array<{ layerElement?: SVGGElement } | undefined> };
  } | null;
  return anim?.renderer?.elements?.[index]?.layerElement ?? null;
}

function cloneData(data: BezierPathData): BezierPathData {
  return {
    v: data.v.map((p) => [...p] as [number, number]),
    i: data.i.map((p) => [...p] as [number, number]),
    o: data.o.map((p) => [...p] as [number, number]),
    c: data.c,
  };
}

/** Vertex / tangent editing overlay for the layer in path-edit mode.
 *
 *  Drags never commit per move — the new geometry is written straight into
 *  the rendered SVG (when the layer has a single path) and into local state
 *  for the overlay, then committed once on release. That keeps editing at
 *  pointer speed instead of rebuilding lottie per move. */
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
  /** Local geometry while a drag is in flight (no doc commits yet). */
  const [live, setLive] = React.useState<{
    path: number;
    data: BezierPathData;
  } | null>(null);
  const lastVertexDownRef = React.useRef<{
    time: number;
    path: number;
    vertex: number;
  }>({ time: 0, path: -1, vertex: -1 });

  const paths = React.useMemo(
    () =>
      doc && layerIndex !== null
        ? collectEditablePaths(doc, layerIndex, frame)
        : [],
    [doc, layerIndex, frame],
  );
  const pathsRef = React.useRef(paths);
  pathsRef.current = paths;
  const selectedRef = React.useRef(selected);
  selectedRef.current = selected;

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

  // Backspace deletes the selected vertex (the global handler stands down
  // while path editing is active).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      const sel = selectedRef.current;
      if (!sel) return;
      const p = pathsRef.current[sel.path];
      if (!p || p.animated) return;
      const minVerts = p.data.c ? 3 : 2;
      if (p.data.v.length <= minVerts) return;
      e.preventDefault();
      const next = removeVertex(p.data, sel.vertex);
      update((draft) => lset(draft, p.dataPath, next));
      setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [update]);

  if (!doc || layerIndex === null) return null;
  const layer = doc.layers[layerIndex];
  const node = layerNode(layerIndex);
  const wrapper = rootRef.current?.parentElement;
  if (!layer) {
    return <div ref={rootRef} className="hidden" />;
  }

  const ctm = node?.getScreenCTM();
  const wrapperRect = wrapper?.getBoundingClientRect();
  // Artwork preview is only safe when this layer renders a single path —
  // lottie merges all shapes of a group into each style's `d`.
  const singlePath = paths.length === 1;
  const artworkEls: SVGPathElement[] =
    singlePath && node ? Array.from(node.querySelectorAll("path")) : [];

  const screenMatrix = (p: EditablePath): DOMMatrix | null =>
    ctm ? DOMMatrix.fromMatrix(ctm).multiply(p.groupMatrix) : null;

  const dataFor = (p: EditablePath, pi: number): BezierPathData =>
    live && live.path === pi ? live.data : p.data;

  const toOverlay = (
    m: DOMMatrix,
    pt: [number, number],
  ): [number, number] | null => {
    if (!wrapperRect) return null;
    const sp = m.transformPoint(new DOMPoint(pt[0], pt[1]));
    return [sp.x - wrapperRect.left, sp.y - wrapperRect.top];
  };

  const commit = (p: EditablePath, data: BezierPathData) => {
    update((draft) => lset(draft, p.dataPath, data));
  };

  const selectedPath = selected !== null ? paths[selected.path] ?? null : null;

  /** Sever the path at the selected vertex: closed paths open there, open
   *  paths split into two shape items sharing the same group styles. */
  const cutSelected = () => {
    if (!selected || !selectedPath || selectedPath.animated) return;
    const p = selectedPath;
    const data = dataFor(p, selected.path);
    const isInterior =
      data.c || (selected.vertex > 0 && selected.vertex < data.v.length - 1);
    if (!isInterior) return;
    const pieces = cutAtVertex(data, selected.vertex);
    update((draft) => {
      lset(draft, p.dataPath, pieces[0]);
      if (pieces.length === 2) {
        // dataPath = [..., parentArray, shIndex, "ks", "k"]
        const itemPath = p.dataPath.slice(0, -2);
        const parentPath = itemPath.slice(0, -1);
        const shIndex = itemPath[itemPath.length - 1] as number;
        const parent = lget(draft, parentPath) as unknown[];
        if (!Array.isArray(parent)) return;
        const original = parent[shIndex] as { nm?: string };
        const copy = structuredClone(original) as {
          nm?: string;
          ks?: unknown;
        };
        copy.ks = { a: 0, k: pieces[1] };
        copy.nm = `${original.nm ?? "Path"} 2`;
        // Right after the original keeps it under the same group styles.
        parent.splice(shIndex + 1, 0, copy);
      }
    });
    setSelected(null);
  };

  const closeSelected = () => {
    if (!selected || !selectedPath || selectedPath.animated) return;
    const data = dataFor(selectedPath, selected.path);
    if (data.c) return;
    commit(selectedPath, closePath(data));
  };

  const previewArtwork = (data: BezierPathData) => {
    if (!artworkEls.length) return;
    const d = pathToD(data);
    for (const el of artworkEls) el.setAttribute("d", d);
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

    // Manual double-press: toggle corner ↔ smooth (preventDefault on
    // pointerdown suppresses the native dblclick).
    if (part === "v") {
      const last = lastVertexDownRef.current;
      const now = performance.now();
      const isDouble =
        now - last.time < 350 &&
        last.path === pathIdx &&
        last.vertex === vertexIdx;
      lastVertexDownRef.current = {
        time: now,
        path: pathIdx,
        vertex: vertexIdx,
      };
      if (isDouble) {
        const base = cloneData(p.data);
        const next = isCornerVertex(base, vertexIdx)
          ? autoSmoothVertex(base, vertexIdx)
          : (() => {
              base.i[vertexIdx] = [0, 0];
              base.o[vertexIdx] = [0, 0];
              return base;
            })();
        commit(p, next);
        return;
      }
    }

    setSelected({ path: pathIdx, vertex: vertexIdx });
    const m = screenMatrix(p);
    if (!m) return;
    const inv = m.inverse();
    const base = cloneData(p.data);
    const baseVertex = [...base.v[vertexIdx]] as [number, number];
    let lastData: BezierPathData | null = null;

    const target = e.currentTarget as Element;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    const onMove = (ev: PointerEvent) => {
      const lp = inv.transformPoint(new DOMPoint(ev.clientX, ev.clientY));
      let local: [number, number] = [lp.x, lp.y];
      const data = cloneData(base);
      if (part === "v") {
        if (ev.shiftKey) local = constrain45(baseVertex, local);
        data.v[vertexIdx] = local;
      } else {
        if (ev.shiftKey) {
          local = constrain45(baseVertex, local);
        }
        const rel: [number, number] = [
          local[0] - baseVertex[0],
          local[1] - baseVertex[1],
        ];
        data[part][vertexIdx] = rel;
        // Figma behavior: handles stay mirrored unless ⌥ breaks them.
        if (!ev.altKey) {
          const opposite = part === "i" ? "o" : "i";
          data[opposite][vertexIdx] = [-rel[0], -rel[1]];
        }
      }
      lastData = data;
      setLive({ path: pathIdx, data });
      previewArtwork(data);
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerup", onUp);
      setLive(null);
      if (lastData) commit(p, lastData);
    };
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerup", onUp);
  };

  /** Click on the path outline inserts a vertex at that spot. */
  const onSkeletonDown = (
    e: React.PointerEvent,
    p: EditablePath,
    pathIdx: number,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (p.animated) return;
    const m = screenMatrix(p);
    if (!m) return;
    const inv = m.inverse();
    const lp = inv.transformPoint(new DOMPoint(e.clientX, e.clientY));
    const data = dataFor(p, pathIdx);
    let best: { j: number; t: number; dist: number } | null = null;
    for (let j = 0; j < segmentCount(data); j++) {
      const hit = nearestOnSegment(data, j, [lp.x, lp.y]);
      if (!best || hit.dist < best.dist) best = { j, t: hit.t, dist: hit.dist };
    }
    if (!best) return;
    const { data: next, index } = splitSegment(data, best.j, best.t);
    commit(p, next);
    setSelected({ path: pathIdx, vertex: index });
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
          {layerName(layer, layerIndex)} · click outline to add a point ·
          double-click a point for corner/smooth · ⌥ breaks handles · ⌫ deletes
          {hasAnimated && " · animated paths locked"}
        </span>
        {selected && selectedPath && !selectedPath.animated && (
          <>
            <button
              type="button"
              className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium hover:bg-secondary/80 disabled:opacity-40"
              disabled={
                !dataFor(selectedPath, selected.path).c &&
                (selected.vertex === 0 ||
                  selected.vertex ===
                    dataFor(selectedPath, selected.path).v.length - 1)
              }
              title="Sever the path at this point — a closed path opens here, an open path splits in two"
              onClick={cutSelected}
            >
              ✂ Cut here
            </button>
            {!dataFor(selectedPath, selected.path).c && (
              <button
                type="button"
                className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium hover:bg-secondary/80"
                title="Join the open ends with a closing segment"
                onClick={closeSelected}
              >
                Close path
              </button>
            )}
          </>
        )}
        <button
          type="button"
          className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium hover:bg-secondary/80"
          onClick={() => setPathEdit(null)}
        >
          Done (Esc)
        </button>
      </div>

      {/* Path skeletons: visible outline + a wide invisible hit stroke. */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {paths.map((p, pi) => {
          const m = screenMatrix(p);
          if (!m || !wrapperRect) return null;
          const d = pathToD(dataFor(p, pi), (pt) => {
            const sp = m.transformPoint(new DOMPoint(pt[0], pt[1]));
            return [sp.x - wrapperRect.left, sp.y - wrapperRect.top];
          });
          return (
            <g key={pi}>
              <path
                d={d}
                fill="none"
                className={
                  p.animated
                    ? "stroke-muted-foreground/50"
                    : "stroke-primary/70"
                }
                strokeWidth={1}
              />
              {!p.animated && (
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={10}
                  className="pointer-events-auto cursor-copy"
                  style={{ pointerEvents: "stroke" }}
                  onPointerDown={(e) => onSkeletonDown(e, p, pi)}
                >
                  <title>Click to insert a point</title>
                </path>
              )}
            </g>
          );
        })}
      </svg>

      {paths.map((p, pi) => {
        const m = screenMatrix(p);
        if (!m) return null;
        const data = dataFor(p, pi);
        return data.v.map((vert, vi) => {
          const pos = toOverlay(m, vert);
          if (!pos) return null;
          const isSel = selected?.path === pi && selected.vertex === vi;
          const tangents =
            isSel && !p.animated
              ? (["i", "o"] as const).map((part) => {
                  const rel = data[part][vi] ?? [0, 0];
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
                        title={
                          (t.part === "i" ? "In tangent" : "Out tangent") +
                          " — ⌥ drags it alone, ⇧ snaps 45°"
                        }
                        onPointerDown={(e) =>
                          beginPointDrag(e, p, pi, vi, t.part)
                        }
                      />
                    </React.Fragment>
                  ),
              )}
              <div
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-[2px]",
                  p.animated
                    ? "pointer-events-none h-2 w-2 border border-muted-foreground bg-muted opacity-60"
                    : isSel
                      ? "pointer-events-auto h-2.5 w-2.5 cursor-move border-2 border-primary bg-background"
                      : "pointer-events-auto h-2 w-2 cursor-move border border-primary bg-primary/70 hover:scale-125",
                )}
                style={{ left: pos[0], top: pos[1] }}
                title={
                  p.animated
                    ? `${p.name} — animated path (locked)`
                    : `${p.name} · point ${vi + 1} — drag to move (⇧ snaps 45°), double-click toggles corner/smooth, ⌫ deletes`
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
