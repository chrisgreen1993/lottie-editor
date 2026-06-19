"use client";

import { get as lget, set as lset } from "lodash-es";
import { Diamond, SlidersHorizontal } from "lucide-react";
import * as React from "react";

import { ColorSwatch, NumberField, Section } from "@/components/editor/fields";
import { type RGB } from "@/lib/lottie/color";
import {
  addKeyframe,
  convertToAnimated,
  deleteKeyframe,
  sampleProp,
  setKeyframeValue,
  type AnimProp,
} from "@/lib/lottie/keyframes";
import {
  docDurationSeconds,
  layerName,
  layerTypeName,
} from "@/lib/lottie/model";
import {
  applyColorRef,
  collectDocColors,
  collectLayerColors,
  collectStrokeWidths,
  paletteGroups,
  setStrokeWidth,
  type Path,
} from "@/lib/lottie/ops";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";
import { cn } from "@/lib/utils";

function DocumentSettings() {
  const doc = useEditor((s) => s.doc)!;
  const update = useEditor((s) => s.update);

  return (
    <>
      <Section title="Document">
        <div className="flex gap-2">
          <NumberField
            label="Width"
            value={doc.w}
            min={1}
            precision={0}
            onCommit={(v) => update((d) => void (d.w = Math.round(v)))}
          />
          <NumberField
            label="Height"
            value={doc.h}
            min={1}
            precision={0}
            onCommit={(v) => update((d) => void (d.h = Math.round(v)))}
          />
        </div>
        <div className="mt-2 flex gap-2">
          <NumberField
            label="Frame rate"
            value={doc.fr}
            min={1}
            max={120}
            onCommit={(v) => update((d) => void (d.fr = v))}
          />
          <NumberField
            label="End frame"
            value={doc.op}
            min={doc.ip + 1}
            precision={0}
            onCommit={(v) => update((d) => void (d.op = Math.round(v)))}
          />
        </div>
        <p className="mt-2 text-meta text-muted-foreground">
          {doc.layers.length} layers · {(doc.op - doc.ip).toFixed(0)} frames ·{" "}
          {docDurationSeconds(doc).toFixed(2)}s
        </p>
      </Section>
      <DocPalette />
    </>
  );
}

function DocPalette() {
  const doc = useEditor((s) => s.doc)!;
  const update = useEditor((s) => s.update);

  const groups = React.useMemo(
    () => paletteGroups(collectDocColors(doc)),
    [doc],
  );

  if (groups.length === 0) return null;

  return (
    <Section title="Palette">
      <p className="mb-1 text-meta text-muted-foreground">
        Editing a swatch recolors every use across the document.
      </p>
      {groups.map((group) => (
        <ColorSwatch
          key={group.hex}
          label={
            group.refs.length === 1
              ? group.refs[0].name
              : `${group.refs.length} uses`
          }
          rgb={group.rgb}
          onChange={(rgb: RGB) =>
            update(
              (draft) => {
                for (const ref of group.refs) applyColorRef(draft, ref, rgb);
              },
              { coalesceKey: `palette-${group.hex}` },
            )
          }
        />
      ))}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Transform editing with keyframe awareness
// ---------------------------------------------------------------------------

interface PropSpec {
  key: "p" | "a" | "s" | "r" | "o";
  labels: [string] | [string, string];
  fallback: number[];
  min?: number;
  max?: number;
}

const TRANSFORM_SPECS: PropSpec[] = [
  { key: "p", labels: ["X", "Y"], fallback: [0, 0] },
  { key: "s", labels: ["Scale X %", "Scale Y %"], fallback: [100, 100] },
  { key: "r", labels: ["Rotation °"], fallback: [0] },
  { key: "o", labels: ["Opacity %"], fallback: [100], min: 0, max: 100 },
  { key: "a", labels: ["Anchor X", "Anchor Y"], fallback: [0, 0] },
];

function KeyframeToggle({
  state,
  onClick,
}: {
  state: "static" | "on-key" | "off-key";
  onClick: () => void;
}) {
  const title =
    state === "static"
      ? "Animate — add a keyframe at the playhead"
      : state === "on-key"
        ? "Remove the keyframe at the playhead"
        : "Add a keyframe at the playhead";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "mb-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center self-end rounded hover:bg-accent",
        state === "on-key"
          ? "text-primary"
          : state === "off-key"
            ? "text-keyframe"
            : "text-muted-foreground/60 hover:text-foreground",
      )}
    >
      <Diamond size={11} className={state === "on-key" ? "fill-current" : ""} />
    </button>
  );
}

function TransformPropRow({
  spec,
  layerIndex,
}: {
  spec: PropSpec;
  layerIndex: number;
}) {
  const doc = useEditor((s) => s.doc)!;
  const update = useEditor((s) => s.update);
  const frame = useEditor((s) => Math.round(s.currentFrame));
  const animateMode = useEditor((s) => s.editorMode === "animate");

  const layer = doc.layers[layerIndex];
  const ks = (layer.ks ?? {}) as Record<string, AnimProp>;
  const prop = ks[spec.key] as
    | (AnimProp & { s?: boolean; x?: AnimProp; y?: AnimProp })
    | undefined;
  const propPath: Path = ["layers", layerIndex, "ks", spec.key];

  const split = spec.key === "p" && prop?.s === true;

  // Split positions sample each axis; everything else samples the prop.
  const sampled = split
    ? (() => {
        const sx = sampleProp(prop?.x, [0], frame);
        const sy = sampleProp(prop?.y, [0], frame);
        return {
          value: [sx.value[0] ?? 0, sy.value[0] ?? 0],
          animated: sx.animated || sy.animated,
          keyIndex: -1,
          axes: [sx, sy] as const,
        };
      })()
    : { ...sampleProp(prop, spec.fallback, frame), axes: null };

  const editable = split ? false : !sampled.animated || sampled.keyIndex !== -1;

  const commit = (componentIndex: number, v: number) => {
    const next = sampled.value.slice();
    next[componentIndex] = v;
    update(
      (draft) => {
        const draftProp = lget(draft, propPath) as AnimProp | undefined;
        if (!sampled.animated) {
          // Static write, preserving any extra components (e.g. z).
          const existing =
            draftProp && Array.isArray(draftProp.k)
              ? (draftProp.k as number[])
              : [];
          const merged = [...existing];
          next.forEach((n, idx) => (merged[idx] = n));
          lset(draft, propPath, {
            ...(draftProp ?? {}),
            a: 0,
            k: spec.labels.length === 1 ? next[0] : merged,
          });
        } else if (sampled.keyIndex !== -1) {
          setKeyframeValue(draft, propPath, sampled.keyIndex, next);
        }
      },
      { coalesceKey: `transform-${spec.key}-${layerIndex}` },
    );
  };

  const toggleState = !sampled.animated
    ? "static"
    : sampled.keyIndex !== -1
      ? "on-key"
      : "off-key";

  const onToggle = () => {
    const removing = sampled.animated && sampled.keyIndex !== -1;
    update((draft) => {
      if (!sampled.animated) {
        convertToAnimated(draft, propPath, frame);
      } else if (sampled.keyIndex !== -1) {
        deleteKeyframe(draft, propPath, sampled.keyIndex);
      } else {
        addKeyframe(draft, propPath, frame);
      }
    });
    if (!removing) {
      // Park the playhead on the new key so the value is editable right
      // away — otherwise playback carries it off the keyframe instantly.
      const state = useEditor.getState();
      state.setPlaying(false);
      state.setCurrentFrame(frame);
      playerBridge.seek(frame, false);
    }
  };

  return (
    <div className="mt-2 flex gap-2 first:mt-0">
      {spec.labels.map((label, idx) => (
        <NumberField
          key={label}
          label={label}
          value={sampled.value[idx] ?? spec.fallback[idx] ?? 0}
          min={spec.min}
          max={spec.max}
          disabled={!editable}
          onCommit={(v) => commit(idx, v)}
        />
      ))}
      {!split && animateMode && (
        <KeyframeToggle state={toggleState} onClick={onToggle} />
      )}
    </div>
  );
}

function LayerSettings({ index }: { index: number }) {
  const doc = useEditor((s) => s.doc)!;
  const update = useEditor((s) => s.update);
  const frame = useEditor((s) => Math.round(s.currentFrame));
  const animateMode = useEditor((s) => s.editorMode === "animate");
  const layer = doc.layers[index];

  const colors = React.useMemo(
    () => collectLayerColors(doc, index, frame),
    [doc, index, frame],
  );
  const strokes = React.useMemo(
    () => collectStrokeWidths(doc, index),
    [doc, index],
  );

  if (!layer) return null;

  return (
    <>
      <Section title="Layer">
        <div className="text-xs text-foreground">{layerName(layer, index)}</div>
        <div className="mt-0.5 text-meta text-muted-foreground">
          {layerTypeName(layer.ty)} · frames {layer.ip.toFixed(0)}–
          {layer.op.toFixed(0)}
        </div>
      </Section>

      <Section title="Transform">
        {TRANSFORM_SPECS.map((spec) => (
          <TransformPropRow key={spec.key} spec={spec} layerIndex={index} />
        ))}
        {animateMode && (
          <p className="mt-2 text-meta text-muted-foreground">
            Keyframed values follow the playhead. Park it on a ◆ to edit that
            keyframe, or use the diamond buttons to add and remove keys.
          </p>
        )}
      </Section>

      {colors.length > 0 && (
        <Section title="Colors">
          {colors.map((ref) => (
            <ColorSwatch
              key={ref.id}
              label={ref.name}
              subtitle={
                ref.animated
                  ? `${ref.kind} · animated${ref.keyIndex !== -1 ? " · on key" : ""}`
                  : ref.kind
              }
              rgb={ref.rgb}
              onChange={(rgb) => {
                // Editing an animated color mid-playback would spray keys
                // across frames — pause at the first change.
                const state = useEditor.getState();
                if (ref.animated && state.isPlaying) state.setPlaying(false);
                const f = Math.round(state.currentFrame);
                update((draft) => applyColorRef(draft, ref, rgb, f), {
                  coalesceKey: `color-${ref.id}`,
                });
              }}
            />
          ))}
        </Section>
      )}

      {strokes.length > 0 && (
        <Section title="Stroke width">
          <div className="flex flex-col gap-2">
            {strokes.map((ref) => (
              <div key={ref.id} className="flex items-end gap-2">
                <NumberField
                  label={ref.name}
                  value={ref.value}
                  min={0}
                  step={0.5}
                  disabled={ref.animated}
                  onCommit={(v) =>
                    update((draft) => setStrokeWidth(draft, ref, v), {
                      coalesceKey: `stroke-${ref.id}`,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

export function Inspector() {
  const doc = useEditor((s) => s.doc);
  const selectedLayer = useEditor((s) => s.selectedLayer);
  const width = useEditor((s) => s.panels.inspectorW);
  if (!doc) return null;

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-card"
      style={{ width }}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <SlidersHorizontal size={13} className="text-muted-foreground" />
        <span className="text-xs font-semibold">
          {selectedLayer === null ? "Document" : "Inspector"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedLayer === null ? (
          <DocumentSettings />
        ) : (
          <LayerSettings index={selectedLayer} />
        )}
      </div>
    </aside>
  );
}
