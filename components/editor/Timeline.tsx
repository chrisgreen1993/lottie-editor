"use client";

import { get as lget } from "lodash-es";
import {
  ChevronDown,
  ChevronRight,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Spline,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";

import { EasingEditor } from "@/components/editor/EasingEditor";
import { IconButton } from "@/components/editor/fields";
import { ResizeHandle } from "@/components/editor/ResizeHandle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import {
  addKeyframe,
  collectTracks,
  deleteKeyframe,
  EASING_PRESETS,
  getEasing,
  matchEasingPreset,
  moveKeyframe,
  setEasing,
  type AnimProp,
  type Keyframe,
  type PropTrack,
} from "@/lib/lottie/keyframes";
import { layerName, type LottieLayer } from "@/lib/lottie/model";
import { collectKeyframeTimes, setLayerRange } from "@/lib/lottie/ops";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";
import { cn } from "@/lib/utils";

const LABEL_W = 176;
const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

function pickTickStep(pxPerFrame: number): number {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  for (const step of steps) {
    if (step * pxPerFrame >= 50) return step;
  }
  return 1000;
}

function TransportBar() {
  const doc = useEditor((s) => s.doc)!;
  const isPlaying = useEditor((s) => s.isPlaying);
  const loop = useEditor((s) => s.loop);
  const speed = useEditor((s) => s.speed);
  const currentFrame = useEditor((s) => s.currentFrame);
  const setPlaying = useEditor((s) => s.setPlaying);
  const setLoop = useEditor((s) => s.setLoop);
  const setSpeed = useEditor((s) => s.setSpeed);
  const setCurrentFrame = useEditor((s) => s.setCurrentFrame);

  const seek = (frame: number) => {
    const clamped = Math.max(doc.ip, Math.min(doc.op, frame));
    setCurrentFrame(clamped);
    playerBridge.seek(clamped, useEditor.getState().isPlaying);
  };

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border px-2">
      <IconButton label="Go to start" onClick={() => seek(doc.ip)}>
        <SkipBack size={14} />
      </IconButton>
      <IconButton
        label={isPlaying ? "Pause (Space)" : "Play (Space)"}
        onClick={() => setPlaying(!isPlaying)}
        className="text-foreground"
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
      </IconButton>
      <IconButton label="Go to end" onClick={() => seek(doc.op - 0.01)}>
        <SkipForward size={14} />
      </IconButton>
      <IconButton
        label={loop ? "Looping on" : "Looping off"}
        active={loop}
        onClick={() => setLoop(!loop)}
      >
        <Repeat size={14} />
      </IconButton>

      <select
        className="ml-1 h-6 rounded border border-input bg-background px-1 text-[11px] tabular-nums text-foreground focus-visible:outline-none"
        value={speed}
        title="Playback speed"
        onChange={(e) => setSpeed(Number(e.target.value))}
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>

      <KeyframeToolbar />

      <div className="ml-auto flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
        <span>{(Math.max(0, currentFrame - doc.ip) / doc.fr).toFixed(2)}s</span>
        <input
          type="number"
          className="h-6 w-16 rounded border border-input bg-background px-1 text-right text-[11px] tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={Math.round(currentFrame)}
          min={doc.ip}
          max={doc.op}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span>
          / {Math.round(doc.op)} · {doc.fr.toFixed(0)} fps
        </span>
      </div>
    </div>
  );
}

function KeyframeToolbar() {
  const doc = useEditor((s) => s.doc)!;
  const selection = useEditor((s) => s.selectedKeyframe);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const update = useEditor((s) => s.update);

  if (!selection) return null;
  const prop = lget(doc, selection.path) as AnimProp | undefined;
  const k = Array.isArray(prop?.k) ? (prop?.k as Keyframe[]) : null;
  const kf = k?.[selection.index];
  if (!prop || !k || !kf) return null;

  const isLast = selection.index === k.length - 1;
  const easing = getEasing(prop, selection.index);
  const presetId = easing ? matchEasingPreset(easing) : "linear";

  return (
    <div className="ml-3 flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-0.5">
      <span
        className="max-w-44 truncate text-[11px] text-muted-foreground"
        title={selection.label}
      >
        ◆ {selection.label}
      </span>
      <input
        type="number"
        className="h-6 w-14 rounded border border-input bg-background px-1 text-right text-[11px] tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={Math.round(kf.t)}
        title="Keyframe frame"
        onChange={(e) =>
          update(
            (draft) =>
              moveKeyframe(
                draft,
                selection.path,
                selection.index,
                Number(e.target.value),
              ),
            { coalesceKey: `kf-frame-${selection.path.join(".")}` },
          )
        }
      />
      <select
        className="h-6 rounded border border-input bg-background px-1 text-[11px] focus-visible:outline-none disabled:opacity-40"
        value={presetId}
        disabled={isLast}
        title={
          isLast
            ? "Easing applies to the segment after a keyframe — none after the last one"
            : "Easing to the next keyframe"
        }
        onChange={(e) => {
          const preset = EASING_PRESETS.find((p) => p.id === e.target.value);
          if (!preset) return;
          update((draft) =>
            setEasing(
              draft,
              selection.path,
              selection.index,
              preset.id === "hold" ? "hold" : { o: preset.o, i: preset.i },
            ),
          );
        }}
      >
        {EASING_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="custom" disabled>
          Custom
        </option>
      </select>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isLast || presetId === "hold"}
            title="Edit easing curve"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Spline size={13} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="top">
          {easing && (
            <EasingEditor
              value={{ o: easing.o, i: easing.i }}
              onChange={(handles) =>
                update(
                  (draft) =>
                    setEasing(draft, selection.path, selection.index, handles),
                  { coalesceKey: `kf-ease-${selection.path.join(".")}` },
                )
              }
            />
          )}
          <p className="mt-2 max-w-44 text-[10px] text-muted-foreground">
            Blue handle eases out of this keyframe, amber eases into the next.
          </p>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        title="Delete keyframe (⌫)"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
        onClick={() => {
          update((draft) =>
            deleteKeyframe(draft, selection.path, selection.index),
          );
          selectKeyframe(null);
        }}
      >
        <Trash2 size={13} />
      </button>
      <button
        type="button"
        title="Deselect keyframe"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => selectKeyframe(null)}
      >
        <X size={13} />
      </button>
    </div>
  );
}

interface TrackGeometry {
  ip: number;
  op: number;
  width: number;
}

function frameToX(geom: TrackGeometry, frame: number): number {
  return ((frame - geom.ip) / (geom.op - geom.ip)) * geom.width;
}

function xToFrame(geom: TrackGeometry, x: number): number {
  return geom.ip + (x / geom.width) * (geom.op - geom.ip);
}

function KeyframeDiamond({
  track,
  layerIndex,
  kfIndex,
  t,
  geom,
}: {
  track: PropTrack;
  layerIndex: number;
  kfIndex: number;
  t: number;
  geom: TrackGeometry;
}) {
  const update = useEditor((s) => s.update);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);
  const selected = useEditor(
    (s) =>
      s.selectedKeyframe?.index === kfIndex &&
      s.selectedKeyframe.path.join(".") === track.id,
  );

  const x = frameToX(geom, t);
  if (x < -8 || x > geom.width + 8) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    selectKeyframe({
      path: track.path,
      index: kfIndex,
      layer: layerIndex,
      label: track.label,
    });
    const startX = e.clientX;
    const startT = t;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }

    const onMove = (ev: PointerEvent) => {
      const deltaFrames =
        ((ev.clientX - startX) / geom.width) * (geom.op - geom.ip);
      update(
        (draft) =>
          moveKeyframe(draft, track.path, kfIndex, startT + deltaFrames),
        { coalesceKey: `kf-move-${track.id}-${kfIndex}` },
      );
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={cn(
        "absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-ew-resize border transition-transform",
        selected
          ? "z-10 scale-150 border-background bg-primary shadow"
          : "border-transparent bg-amber-400 hover:scale-125",
      )}
      style={{ left: x }}
      title={`${track.label} · frame ${Math.round(t)} — drag to retime`}
      onPointerDown={onPointerDown}
    />
  );
}

function PropTrackRow({
  track,
  layerIndex,
  geom,
}: {
  track: PropTrack;
  layerIndex: number;
  geom: TrackGeometry;
}) {
  const update = useEditor((s) => s.update);
  const selectKeyframe = useEditor((s) => s.selectKeyframe);

  return (
    <div className="flex">
      <div
        className="h-6 w-[176px] shrink-0 truncate border-b border-r border-border/40 bg-card/60 py-1 pl-7 pr-2 text-[10px] text-muted-foreground"
        title={track.label}
      >
        {track.label}
      </div>
      <div
        className="relative h-6 min-w-0 flex-1 border-b border-border/30 bg-background/30"
        style={{ width: geom.width }}
        title="Double-click to add a keyframe"
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const frame = Math.round(xToFrame(geom, e.clientX - rect.left));
          update((draft) => {
            const index = addKeyframe(draft, track.path, frame);
            if (index === -1) return;
          });
          // Select the keyframe that now sits on that frame.
          const doc = useEditor.getState().doc;
          const prop = doc && (lget(doc, track.path) as AnimProp | undefined);
          const k = Array.isArray(prop?.k) ? (prop?.k as Keyframe[]) : [];
          const index = k.findIndex((kf) => Math.round(kf.t) === frame);
          if (index !== -1) {
            selectKeyframe({
              path: track.path,
              index,
              layer: layerIndex,
              label: track.label,
            });
          }
        }}
      >
        {track.times.map((t, i) => (
          <KeyframeDiamond
            key={`${i}-${t}`}
            track={track}
            layerIndex={layerIndex}
            kfIndex={i}
            t={t}
            geom={geom}
          />
        ))}
      </div>
    </div>
  );
}

function LayerTrack({
  layer,
  index,
  geom,
}: {
  layer: LottieLayer;
  index: number;
  geom: TrackGeometry;
}) {
  const update = useEditor((s) => s.update);
  const selectLayer = useEditor((s) => s.selectLayer);
  const selected = useEditor((s) => s.selectedLayer) === index;

  const keyframes = React.useMemo(() => collectKeyframeTimes(layer), [layer]);

  const barLeft = frameToX(geom, Math.max(geom.ip, layer.ip));
  const barRight = frameToX(geom, Math.min(geom.op, layer.op));

  const startDrag = (
    e: React.PointerEvent,
    mode: "move" | "trim-in" | "trim-out",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const { ip: startIp, op: startOp } = layer;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }

    const onMove = (ev: PointerEvent) => {
      const deltaFrames =
        ((ev.clientX - startX) / geom.width) * (geom.op - geom.ip);
      update(
        (draft) => {
          if (mode === "move") {
            const span = startOp - startIp;
            let ip = Math.round(startIp + deltaFrames);
            ip = Math.max(geom.ip - span, Math.min(geom.op, ip));
            setLayerRange(draft, index, ip, ip + span, true);
          } else if (mode === "trim-in") {
            const ip = Math.round(
              Math.max(geom.ip, Math.min(startOp - 1, startIp + deltaFrames)),
            );
            setLayerRange(draft, index, ip, startOp);
          } else {
            const op = Math.round(
              Math.min(geom.op, Math.max(startIp + 1, startOp + deltaFrames)),
            );
            setLayerRange(draft, index, startIp, op);
          }
        },
        { coalesceKey: `range-${index}` },
      );
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  return (
    <div
      className={cn(
        "relative h-7 border-b border-border/40",
        selected && "bg-primary/10",
      )}
      onClick={() => selectLayer(index)}
    >
      <div
        className={cn(
          "absolute top-1.5 h-4 cursor-grab rounded-sm border active:cursor-grabbing",
          layer.hd
            ? "border-border bg-muted"
            : selected
              ? "border-primary/70 bg-primary/40"
              : "border-border bg-secondary",
        )}
        style={{ left: barLeft, width: Math.max(4, barRight - barLeft) }}
        title={`${layerName(layer, index)} · ${Math.round(layer.ip)}–${Math.round(layer.op)} (drag to shift, edges to trim)`}
        onPointerDown={(e) => startDrag(e, "move")}
      >
        <div
          className="absolute -left-0.5 top-0 h-full w-1.5 cursor-ew-resize rounded-l-sm bg-foreground/30 opacity-0 hover:opacity-100"
          onPointerDown={(e) => startDrag(e, "trim-in")}
        />
        <div
          className="absolute -right-0.5 top-0 h-full w-1.5 cursor-ew-resize rounded-r-sm bg-foreground/30 opacity-0 hover:opacity-100"
          onPointerDown={(e) => startDrag(e, "trim-out")}
        />
      </div>
      {keyframes.map((t) => {
        const x = frameToX(geom, t);
        if (x < 0 || x > geom.width) return null;
        return (
          <div
            key={t}
            className="pointer-events-none absolute top-[11px] h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-amber-400/80"
            style={{ left: x }}
          />
        );
      })}
    </div>
  );
}

export function Timeline() {
  const doc = useEditor((s) => s.doc);
  const currentFrame = useEditor((s) => s.currentFrame);
  const setCurrentFrame = useEditor((s) => s.setCurrentFrame);
  const selectedLayer = useEditor((s) => s.selectedLayer);
  const selectLayer = useEditor((s) => s.selectLayer);
  const height = useEditor((s) => s.panels.timelineH);
  const setPanelSize = useEditor((s) => s.setPanelSize);
  const startHeightRef = React.useRef(height);

  const trackAreaRef = React.useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    const el = trackAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setTrackWidth(el.clientWidth));
    observer.observe(el);
    setTrackWidth(el.clientWidth);
    return () => observer.disconnect();
  }, [doc]);

  // Property tracks are a deep walk over the layer; only pay for the
  // layers that are actually expanded.
  const layerTracks = React.useMemo(() => {
    const map = new Map<number, PropTrack[]>();
    if (!doc) return map;
    expanded.forEach((i) => {
      if (doc.layers[i]) map.set(i, collectTracks(doc, i));
    });
    return map;
  }, [doc, expanded]);

  if (!doc) return null;

  const geom: TrackGeometry = {
    ip: doc.ip,
    op: doc.op,
    width: Math.max(1, trackWidth),
  };
  const pxPerFrame = geom.width / Math.max(1, doc.op - doc.ip);
  const tickStep = pickTickStep(pxPerFrame);
  const ticks: number[] = [];
  for (
    let f = Math.ceil(doc.ip / tickStep) * tickStep;
    f <= doc.op;
    f += tickStep
  ) {
    ticks.push(f);
  }

  const scrubTo = (clientX: number) => {
    const el = trackAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frame = Math.max(
      doc.ip,
      Math.min(doc.op, xToFrame(geom, clientX - rect.left)),
    );
    setCurrentFrame(frame);
    playerBridge.seek(frame, useEditor.getState().isPlaying);
  };

  const onScrubStart = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    scrubTo(e.clientX);
    const onMove = (ev: PointerEvent) => scrubTo(ev.clientX);
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  const toggleExpanded = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const playheadX = frameToX(
    geom,
    Math.max(doc.ip, Math.min(doc.op, currentFrame)),
  );

  return (
    <div
      className="relative flex shrink-0 flex-col border-t border-border bg-card"
      style={{ height }}
    >
      <ResizeHandle
        orientation="horizontal"
        className="absolute inset-x-0 -top-0.5"
        onStart={() => {
          startHeightRef.current = useEditor.getState().panels.timelineH;
        }}
        onDrag={(_dx, dy) =>
          setPanelSize("timelineH", startHeightRef.current - dy)
        }
      />
      <TransportBar />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Ruler */}
        <div className="flex h-6 shrink-0 border-b border-border">
          <div className="w-[176px] shrink-0 border-r border-border px-2 text-[10px] leading-6 text-muted-foreground">
            Frames
          </div>
          <div
            ref={trackAreaRef}
            className="relative min-w-0 flex-1 cursor-col-resize select-none"
            onPointerDown={onScrubStart}
          >
            {ticks.map((f) => (
              <div
                key={f}
                className="absolute top-0 h-full border-l border-border/70 pl-1 text-[9px] tabular-nums leading-6 text-muted-foreground"
                style={{ left: frameToX(geom, f) }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {doc.layers.map((layer, i) => {
            const tracks = layerTracks.get(i) ?? [];
            const isExpanded = expanded.has(i);
            return (
              <React.Fragment key={`${layer.ind ?? "x"}-${i}`}>
                <div className="flex">
                  <div
                    className={cn(
                      "flex h-7 w-[176px] shrink-0 items-center border-b border-r border-border/40",
                      selectedLayer === i
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      layer.hd && "opacity-50",
                    )}
                  >
                    <button
                      type="button"
                      className="flex h-full w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                      title={
                        isExpanded ? "Collapse properties" : "Expand properties"
                      }
                      onClick={() => toggleExpanded(i)}
                    >
                      {isExpanded ? (
                        <ChevronDown size={11} />
                      ) : (
                        <ChevronRight size={11} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="h-full min-w-0 flex-1 truncate pr-2 text-left text-[11px]"
                      onClick={() =>
                        selectLayer(selectedLayer === i ? null : i)
                      }
                    >
                      {layerName(layer, i)}
                    </button>
                  </div>
                  <div
                    className="relative min-w-0 flex-1"
                    style={{ width: trackWidth }}
                  >
                    <LayerTrack layer={layer} index={i} geom={geom} />
                  </div>
                </div>
                {isExpanded &&
                  (tracks.length > 0 ? (
                    tracks.map((track) => (
                      <PropTrackRow
                        key={track.id}
                        track={track}
                        layerIndex={i}
                        geom={geom}
                      />
                    ))
                  ) : (
                    <div className="flex h-6 items-center border-b border-border/30 bg-card/60 pl-7 text-[10px] text-muted-foreground">
                      No animated properties
                    </div>
                  ))}
              </React.Fragment>
            );
          })}
        </div>

        {/* Playhead */}
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-primary"
          style={{ left: LABEL_W + playheadX }}
        >
          <div className="absolute -left-[5px] top-0 h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-primary" />
        </div>
      </div>
    </div>
  );
}
