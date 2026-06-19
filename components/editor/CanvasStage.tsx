"use client";

import lottie, { type AnimationItem } from "lottie-web";
import {
  Circle,
  Maximize,
  Minus,
  MousePointer2,
  PenTool,
  Plus,
  Square,
  Star,
} from "lucide-react";
import * as React from "react";

import { CanvasOverlay } from "@/components/editor/CanvasOverlay";
import { IconButton } from "@/components/editor/fields";
import { PathEditOverlay } from "@/components/editor/PathEditOverlay";
import {
  addPathLayer,
  addShapeLayer,
  type PenVertex,
  type ShapeKind,
} from "@/lib/lottie/create";
import { constrain45 } from "@/lib/lottie/bezier";
import { collapseSingleKeyframes } from "@/lib/lottie/keyframes";
import { hasEditablePath } from "@/lib/lottie/pathEdit";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor, type CanvasBackground, type CanvasTool } from "@/lib/store";
import { cn } from "@/lib/utils";

const TOOLS: { id: CanvasTool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select (V)", icon: <MousePointer2 size={14} /> },
  { id: "rect", label: "Rectangle (R)", icon: <Square size={14} /> },
  { id: "ellipse", label: "Ellipse (E)", icon: <Circle size={14} /> },
  { id: "star", label: "Star (S)", icon: <Star size={14} /> },
  { id: "pen", label: "Pen (P)", icon: <PenTool size={14} /> },
];

/** Preview path for the in-progress pen drawing (screen coordinates). */
function penPathD(
  points: PenVertex[],
  cursor: [number, number] | null,
  scale: number,
): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].v[0] * scale} ${points[0].v[1] * scale}`;
  for (let j = 0; j < points.length - 1; j++) {
    const a = points[j];
    const b = points[j + 1];
    d += ` C ${(a.v[0] + a.o[0]) * scale} ${(a.v[1] + a.o[1]) * scale}, ${
      (b.v[0] + b.i[0]) * scale
    } ${(b.v[1] + b.i[1]) * scale}, ${b.v[0] * scale} ${b.v[1] * scale}`;
  }
  if (cursor) {
    const last = points[points.length - 1];
    d += ` C ${(last.v[0] + last.o[0]) * scale} ${
      (last.v[1] + last.o[1]) * scale
    }, ${cursor[0] * scale} ${cursor[1] * scale}, ${cursor[0] * scale} ${
      cursor[1] * scale
    }`;
  }
  return d;
}

const BG_OPTIONS: {
  value: CanvasBackground;
  label: string;
  swatchClass: string;
}[] = [
  { value: "checker", label: "Checkerboard", swatchClass: "bg-checker" },
  { value: "dark", label: "Dark", swatchClass: "bg-zinc-900" },
  { value: "light", label: "Light", swatchClass: "bg-zinc-100" },
  {
    value: "doc",
    label: "Document color",
    swatchClass: "bg-gradient-to-br from-sky-500 to-violet-500",
  },
];

export function CanvasStage() {
  const doc = useEditor((s) => s.doc);
  const isPlaying = useEditor((s) => s.isPlaying);
  const loop = useEditor((s) => s.loop);
  const speed = useEditor((s) => s.speed);
  const zoom = useEditor((s) => s.zoom);
  const canvasBg = useEditor((s) => s.canvasBg);
  const setZoom = useEditor((s) => s.setZoom);
  const setCanvasBg = useEditor((s) => s.setCanvasBg);
  const setCurrentFrame = useEditor((s) => s.setCurrentFrame);
  const setPlaying = useEditor((s) => s.setPlaying);
  const selectLayer = useEditor((s) => s.selectLayer);
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const update = useEditor((s) => s.update);
  const [drawRect, setDrawRect] = React.useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const justDrewRef = React.useRef(false);
  const pathEdit = useEditor((s) => s.pathEdit);
  const setPathEdit = useEditor((s) => s.setPathEdit);
  const editorMode = useEditor((s) => s.editorMode);
  const [penPoints, setPenPoints] = React.useState<PenVertex[]>([]);
  const [penCursor, setPenCursor] = React.useState<[number, number] | null>(
    null,
  );

  // Leaving the pen tool discards an unfinished path.
  React.useEffect(() => {
    if (tool !== "pen") {
      setPenPoints([]);
      setPenCursor(null);
    }
  }, [tool]);

  const finishPen = React.useCallback(
    (closed: boolean, points: PenVertex[]) => {
      if (points.length >= 2) {
        update((draft) => addPathLayer(draft, points, closed));
        selectLayer(0);
        justDrewRef.current = true;
      }
      setPenPoints([]);
      setPenCursor(null);
      setTool("select");
    },
    [update, selectLayer, setTool],
  );

  // Enter finishes an open pen path.
  React.useEffect(() => {
    if (tool !== "pen") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && penPoints.length >= 2) {
        e.preventDefault();
        finishPen(false, penPoints);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, penPoints, finishPen]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const animRef = React.useRef<AnimationItem | null>(null);
  const [fitScale, setFitScale] = React.useState(1);

  // (Re)build the lottie-web instance whenever the document changes.
  // Reloads are batched to one per animation frame so timeline drags stay smooth.
  React.useEffect(() => {
    if (!doc || !stageRef.current) return;
    const raf = requestAnimationFrame(() => {
      const container = stageRef.current;
      if (!container) return;

      const state = useEditor.getState();
      const previous = animRef.current;
      const resumeFrame = state.currentFrame;
      const resumePlaying = state.isPlaying;
      previous?.destroy();
      container.innerHTML = "";

      const item = lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: state.loop,
        autoplay: false,
        // lottie-web mutates animationData internally — never hand it the
        // store copy. Single-keyframe props would break its interpolator,
        // so they're collapsed to constants for playback.
        animationData: collapseSingleKeyframes(structuredClone(doc)),
      });
      item.setSpeed(state.speed);

      item.addEventListener("enterFrame", () => {
        setCurrentFrame(item.currentFrame + item.firstFrame);
      });
      item.addEventListener("complete", () => {
        setPlaying(false);
      });

      const local = Math.max(
        0,
        Math.min(item.totalFrames - 0.001, resumeFrame - item.firstFrame),
      );
      if (resumePlaying) {
        item.goToAndPlay(local, true);
      } else {
        item.goToAndStop(local, true);
      }

      animRef.current = item;
      playerBridge.register(item);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [doc, setCurrentFrame, setPlaying]);

  // Destroy on unmount / when the document is closed.
  React.useEffect(() => {
    return () => {
      animRef.current?.destroy();
      animRef.current = null;
      playerBridge.register(null);
    };
  }, []);

  React.useEffect(() => {
    const item = animRef.current;
    if (!item) return;
    if (isPlaying) item.play();
    else item.pause();
  }, [isPlaying, doc]);

  React.useEffect(() => {
    animRef.current?.setSpeed(speed);
  }, [speed, doc]);

  React.useEffect(() => {
    const item = animRef.current;
    if (item) item.loop = loop;
  }, [loop, doc]);

  // Fit-to-view scale tracking.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !doc) return;
    const compute = () => {
      const pad = 48;
      const scale = Math.min(
        (el.clientWidth - pad) / doc.w,
        (el.clientHeight - pad) / doc.h,
      );
      setFitScale(Math.max(0.05, Math.min(scale, 4)));
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc]);

  if (!doc) return null;

  const scale = zoom === "fit" ? fitScale : zoom;

  const zoomBy = (factor: number) => {
    const next = Math.min(8, Math.max(0.05, scale * factor));
    setZoom(Number(next.toFixed(3)));
  };

  // Drag-to-draw a new shape layer when a shape tool is active.
  // Pen tool: click to place vertices, drag to pull out smooth tangents,
  // click the first vertex to close, Enter to finish open.
  const onPenDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wrapper = e.currentTarget as HTMLElement;
    const rect = wrapper.getBoundingClientRect();
    let docPt: [number, number] = [
      (e.clientX - rect.left) / scale,
      (e.clientY - rect.top) / scale,
    ];
    if (e.shiftKey && penPoints.length > 0) {
      docPt = constrain45(penPoints[penPoints.length - 1].v, docPt);
    }

    // Closing click on the first vertex?
    if (penPoints.length >= 3) {
      const first = penPoints[0].v;
      const dx = (first[0] - docPt[0]) * scale;
      const dy = (first[1] - docPt[1]) * scale;
      if (Math.hypot(dx, dy) < 10) {
        finishPen(true, penPoints);
        return;
      }
    }

    const vertex: PenVertex = { v: docPt, i: [0, 0], o: [0, 0] };
    setPenPoints((prev) => [...prev, vertex]);
    const index = penPoints.length;

    try {
      wrapper.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    const onMove = (ev: PointerEvent) => {
      // Dragging pulls out a smooth (mirrored) tangent pair.
      let tip: [number, number] = [
        (ev.clientX - rect.left) / scale,
        (ev.clientY - rect.top) / scale,
      ];
      if (ev.shiftKey) tip = constrain45(docPt, tip);
      const ox = tip[0] - docPt[0];
      const oy = tip[1] - docPt[1];
      setPenPoints((prev) =>
        prev.map((p, i) =>
          i === index ? { ...p, o: [ox, oy], i: [-ox, -oy] } : p,
        ),
      );
    };
    const onUp = () => {
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerup", onUp);
    };
    wrapper.addEventListener("pointermove", onMove);
    wrapper.addEventListener("pointerup", onUp);
  };

  const onDrawStart = (e: React.PointerEvent) => {
    if (tool === "select") return;
    if (tool === "pen") {
      onPenDown(e);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const wrapper = e.currentTarget as HTMLElement;
    const rect = wrapper.getBoundingClientRect();
    const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDrawRect({ x0: start.x, y0: start.y, x1: start.x, y1: start.y });
    try {
      wrapper.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }

    const kind = tool as ShapeKind;
    const onMove = (ev: PointerEvent) => {
      setDrawRect({
        x0: start.x,
        y0: start.y,
        x1: ev.clientX - rect.left,
        y1: ev.clientY - rect.top,
      });
    };
    const onUp = (ev: PointerEvent) => {
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerup", onUp);
      setDrawRect(null);
      const end = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      let w = Math.abs(end.x - start.x) / scale;
      let h = Math.abs(end.y - start.y) / scale;
      const cx = (start.x + end.x) / 2 / scale;
      const cy = (start.y + end.y) / 2 / scale;
      if (w < 4 && h < 4) {
        // A click without a drag drops a default-sized shape.
        w = 160;
        h = 160;
      }
      update((draft) => addShapeLayer(draft, kind, { cx, cy, w, h }));
      setTool("select");
      selectLayer(0);
      justDrewRef.current = true;
    };
    wrapper.addEventListener("pointermove", onMove);
    wrapper.addEventListener("pointerup", onUp);
  };

  // Map a click on the rendered SVG back to the layer that drew it.
  // Double-click a layer with bezier paths to edit its vertices.
  const onStageDoubleClick = (e: React.MouseEvent) => {
    if (tool !== "select" || pathEdit !== null || !doc) return;
    const target = e.target as Element;
    if (target.closest("[data-canvas-overlay]")) return;
    const anim = playerBridge.get() as unknown as {
      renderer?: {
        elements?: Array<{ layerElement?: SVGGElement } | undefined>;
      };
    } | null;
    const elements = anim?.renderer?.elements ?? [];
    for (let i = 0; i < elements.length; i++) {
      const node = elements[i]?.layerElement;
      if (node && (node === target || node.contains(target))) {
        if (hasEditablePath(doc, i)) {
          setPlaying(false);
          selectLayer(i);
          setPathEdit(i);
        }
        return;
      }
    }
  };

  const onStageClick = (e: React.MouseEvent) => {
    if (tool !== "select") return;
    if (justDrewRef.current) {
      // The click that ends a draw gesture must not re-run hit-testing.
      justDrewRef.current = false;
      return;
    }
    const target = e.target as Element;
    if (target.closest("[data-canvas-overlay]")) return;
    const anim = playerBridge.get() as unknown as {
      renderer?: {
        elements?: Array<{ layerElement?: SVGGElement } | undefined>;
      };
    } | null;
    const elements = anim?.renderer?.elements ?? [];
    for (let i = 0; i < elements.length; i++) {
      const node = elements[i]?.layerElement;
      if (node && (node === target || node.contains(target))) {
        selectLayer(i);
        return;
      }
    }
    selectLayer(null);
  };

  const stageBgStyle: React.CSSProperties =
    canvasBg === "doc"
      ? { backgroundColor: doc.bg || "var(--color-on-fill)" }
      : canvasBg === "dark"
        ? { backgroundColor: "var(--color-canvas-dark)" }
        : canvasBg === "light"
          ? { backgroundColor: "var(--color-canvas-light)" }
          : {};

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-auto"
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1);
        }}
      >
        <div className="flex min-h-full min-w-full items-center justify-center p-6">
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-sm shadow-2xl ring-1 ring-border",
              canvasBg === "checker" && "bg-checker",
            )}
            style={{
              width: doc.w * scale,
              height: doc.h * scale,
              ...stageBgStyle,
              cursor: tool === "select" ? undefined : "crosshair",
            }}
            onClick={onStageClick}
            onDoubleClick={onStageDoubleClick}
            onPointerDown={onDrawStart}
            onPointerMove={
              tool === "pen" && penPoints.length > 0
                ? (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    let pt: [number, number] = [
                      (e.clientX - rect.left) / scale,
                      (e.clientY - rect.top) / scale,
                    ];
                    if (e.shiftKey) {
                      pt = constrain45(penPoints[penPoints.length - 1].v, pt);
                    }
                    setPenCursor(pt);
                  }
                : undefined
            }
          >
            <div
              ref={stageRef}
              style={{
                width: doc.w,
                height: doc.h,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
            {pathEdit !== null ? (
              <PathEditOverlay />
            ) : (
              tool === "select" && <CanvasOverlay scale={scale} />
            )}
            {drawRect && (
              <div
                className={cn(
                  "pointer-events-none absolute border border-dashed border-primary bg-primary/10",
                  tool === "ellipse" && "rounded-full",
                )}
                style={{
                  left: Math.min(drawRect.x0, drawRect.x1),
                  top: Math.min(drawRect.y0, drawRect.y1),
                  width: Math.abs(drawRect.x1 - drawRect.x0),
                  height: Math.abs(drawRect.y1 - drawRect.y0),
                }}
              />
            )}
            {tool === "pen" && penPoints.length > 0 && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                {penPoints.length >= 2 && (
                  <path
                    d={`${penPathD(penPoints, penCursor, scale)} Z`}
                    className="fill-primary/10"
                    stroke="none"
                  />
                )}
                <path
                  d={penPathD(penPoints, penCursor, scale)}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                {penPoints.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.v[0] * scale}
                    cy={p.v[1] * scale}
                    r={i === 0 && penPoints.length >= 3 ? 6 : 3.5}
                    className={cn(
                      "fill-background stroke-primary",
                      i === 0 && penPoints.length >= 3 && "fill-primary/30",
                    )}
                    strokeWidth={1.5}
                  />
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>

      {editorMode === "design" && (
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <div className="pointer-events-auto flex flex-col gap-0.5 rounded-full bg-card/95 px-1 py-1.5 shadow-lg backdrop-blur">
            {TOOLS.map((t) => (
              <IconButton
                key={t.id}
                label={t.label}
                active={tool === t.id}
                className="rounded-full"
                onClick={() => setTool(t.id)}
              >
                {t.icon}
              </IconButton>
            ))}
          </div>
        </div>
      )}
      {tool === "pen" && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <div className="rounded-md border border-border bg-card/90 px-2 py-0.5 text-meta text-muted-foreground shadow backdrop-blur">
            Click to add points · drag for curves · click the first point to
            close · Enter finishes open · Esc cancels
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 shadow-lg backdrop-blur">
          <IconButton label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
            <Minus size={14} />
          </IconButton>
          <button
            type="button"
            className="min-w-14 rounded px-1 text-center text-xs tabular-nums text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Reset to 100%"
            onClick={() => setZoom(1)}
          >
            {Math.round(scale * 100)}%
          </button>
          <IconButton label="Zoom in" onClick={() => zoomBy(1.25)}>
            <Plus size={14} />
          </IconButton>
          <IconButton
            label="Fit to view"
            active={zoom === "fit"}
            onClick={() => setZoom("fit")}
          >
            <Maximize size={14} />
          </IconButton>
          <div className="mx-1 h-4 w-px bg-border" />
          {BG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => setCanvasBg(opt.value)}
              className={cn(
                "h-5 w-5 rounded border border-border transition-transform hover:scale-110",
                opt.swatchClass,
                canvasBg === opt.value &&
                  "ring-2 ring-primary ring-offset-1 ring-offset-card",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
