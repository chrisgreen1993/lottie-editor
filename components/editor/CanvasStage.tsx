"use client";

import lottie, { type AnimationItem } from "lottie-web";
import { Maximize, Minus, Plus } from "lucide-react";
import * as React from "react";

import { CanvasOverlay } from "@/components/editor/CanvasOverlay";
import { IconButton } from "@/components/editor/fields";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor, type CanvasBackground } from "@/lib/store";
import { cn } from "@/lib/utils";

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
        // lottie-web mutates animationData internally — never hand it the store copy.
        animationData: structuredClone(doc),
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

  // Map a click on the rendered SVG back to the layer that drew it.
  const onStageClick = (e: React.MouseEvent) => {
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
      ? { backgroundColor: doc.bg || "#ffffff" }
      : canvasBg === "dark"
        ? { backgroundColor: "#18181b" }
        : canvasBg === "light"
          ? { backgroundColor: "#fafafa" }
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
            }}
            onClick={onStageClick}
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
            <CanvasOverlay scale={scale} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card/90 px-2 py-1 shadow-lg backdrop-blur">
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
