import { get as lget } from "lodash-es";

import type { LottieDoc } from "./model";
import type { Path } from "./ops";

export interface AnimProp {
  a?: number;
  k?: unknown;
  [key: string]: unknown;
}

export interface Keyframe {
  t: number;
  s?: number[] | number;
  e?: number[] | number;
  o?: { x: number | number[]; y: number | number[] };
  i?: { x: number | number[]; y: number | number[] };
  h?: number;
  [key: string]: unknown;
}

export function isKeyframed(
  prop: AnimProp | undefined,
): prop is AnimProp & { k: Keyframe[] } {
  if (!prop) return false;
  if (prop.a === 1) return Array.isArray(prop.k);
  return (
    Array.isArray(prop.k) &&
    prop.k.length > 0 &&
    typeof prop.k[0] === "object" &&
    prop.k[0] !== null
  );
}

export function keyframeValue(kf: Keyframe | undefined): number[] | null {
  if (!kf) return null;
  if (typeof kf.s === "number") return [kf.s];
  if (Array.isArray(kf.s)) return kf.s.slice();
  return null;
}

/** Linearly sample a keyframed value at a frame (display approximation —
 *  ignores bezier easing, exact on keyframes). */
export function sampleKeyframes(k: Keyframe[], frame: number): number[] {
  if (k.length === 0) return [];
  if (frame <= k[0].t) return keyframeValue(k[0]) ?? [];
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i];
    const b = k[i + 1];
    if (frame >= a.t && frame <= b.t) {
      const av = keyframeValue(a);
      const bv = keyframeValue(b) ?? (Array.isArray(a.e) ? a.e : av);
      if (!av) return bv ?? [];
      if (!bv || a.h === 1) return av;
      const f = b.t === a.t ? 0 : (frame - a.t) / (b.t - a.t);
      return av.map((v, idx) => v + ((bv[idx] ?? v) - v) * f);
    }
  }
  // Past the end: last keyframe with a value.
  for (let i = k.length - 1; i >= 0; i--) {
    const v = keyframeValue(k[i]);
    if (v) return v;
  }
  return [];
}

export interface SampledProp {
  value: number[];
  animated: boolean;
  /** Index of the keyframe exactly at the sampled frame, or -1. */
  keyIndex: number;
}

export function sampleProp(
  prop: AnimProp | undefined,
  fallback: number[],
  frame: number,
): SampledProp {
  if (!prop) return { value: fallback, animated: false, keyIndex: -1 };
  if (isKeyframed(prop)) {
    const k = prop.k as Keyframe[];
    const rounded = Math.round(frame);
    const keyIndex = k.findIndex((kf) => Math.round(kf.t) === rounded);
    const value = sampleKeyframes(k, frame);
    return {
      value: value.length ? value : fallback,
      animated: true,
      keyIndex,
    };
  }
  if (typeof prop.k === "number")
    return { value: [prop.k], animated: false, keyIndex: -1 };
  if (Array.isArray(prop.k))
    return {
      value: (prop.k as number[]).slice(),
      animated: false,
      keyIndex: -1,
    };
  return { value: fallback, animated: false, keyIndex: -1 };
}

// ---------------------------------------------------------------------------
// Track discovery (for the timeline)
// ---------------------------------------------------------------------------

export interface PropTrack {
  id: string;
  label: string;
  /** Path from the doc root to the animated property object. */
  path: Path;
  times: number[];
}

const KEY_LABELS: Record<string, string> = {
  p: "Position",
  a: "Anchor",
  s: "Scale",
  r: "Rotation",
  o: "Opacity",
  c: "Color",
  w: "Stroke width",
  e: "End",
  sk: "Skew",
  sa: "Skew axis",
  t: "Text",
  rd: "Roundness",
};

function trackTimes(prop: AnimProp): number[] {
  return (prop.k as Keyframe[])
    .map((kf) => kf.t)
    .filter((t): t is number => typeof t === "number");
}

export function collectTracks(doc: LottieDoc, layerIndex: number): PropTrack[] {
  const layer = doc.layers[layerIndex];
  if (!layer) return [];
  const out: PropTrack[] = [];

  const visit = (
    node: unknown,
    path: Path,
    chain: string,
    depth: number,
  ): void => {
    if (depth > 12 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, [...path, i], chain, depth + 1));
      return;
    }
    const obj = node as Record<string, unknown>;
    const nm =
      typeof obj.nm === "string" && obj.nm.trim() ? obj.nm.trim() : null;
    const nextChain =
      nm && chain !== nm ? (chain ? `${chain} › ${nm}` : nm) : chain;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || typeof value !== "object") continue;
      const prop = value as AnimProp;
      if (prop.a === 1 && Array.isArray(prop.k) && isKeyframed(prop)) {
        const label = KEY_LABELS[key] ?? key;
        const fullPath = [...path, key];
        out.push({
          id: fullPath.join("."),
          label: nextChain ? `${nextChain} · ${label}` : label,
          path: fullPath,
          times: trackTimes(prop),
        });
      } else {
        visit(value, [...path, key], nextChain, depth + 1);
      }
    }
  };

  const base: Path = ["layers", layerIndex];
  // Transform first (friendly order), then everything else (shapes, effects…).
  const ks = layer.ks as Record<string, unknown> | undefined;
  if (ks) {
    for (const key of ["p", "a", "s", "r", "o"]) {
      const prop = ks[key] as AnimProp | undefined;
      if (prop && isKeyframed(prop) && prop.a === 1) {
        out.push({
          id: [...base, "ks", key].join("."),
          label: KEY_LABELS[key],
          path: [...base, "ks", key],
          times: trackTimes(prop),
        });
      }
      // Split position: x / y animated separately.
      if (key === "p" && prop && (prop as { s?: boolean }).s === true) {
        for (const axis of ["x", "y"]) {
          const sub = (prop as Record<string, unknown>)[axis] as
            | AnimProp
            | undefined;
          if (sub && isKeyframed(sub) && sub.a === 1) {
            out.push({
              id: [...base, "ks", "p", axis].join("."),
              label: `Position ${axis.toUpperCase()}`,
              path: [...base, "ks", "p", axis],
              times: trackTimes(sub),
            });
          }
        }
      }
    }
  }
  visit(layer.shapes, [...base, "shapes"], "", 0);
  return out;
}

// ---------------------------------------------------------------------------
// Keyframe mutations (operate on a draft doc)
// ---------------------------------------------------------------------------

function propAt(
  draft: LottieDoc,
  path: Path,
): (AnimProp & { k: Keyframe[] }) | null {
  const prop = lget(draft, path) as AnimProp | undefined;
  return prop && isKeyframed(prop)
    ? (prop as AnimProp & { k: Keyframe[] })
    : null;
}

export interface KeyframeRef {
  path: Path;
  index: number;
}

/** How far a group of keyframes may shift together without any of them
 *  crossing a non-selected neighbor on its own track. */
export function groupDeltaBounds(
  doc: LottieDoc,
  refs: KeyframeRef[],
): { min: number; max: number } {
  let min = -Infinity;
  let max = Infinity;
  const selectedByPath = new Map<string, Set<number>>();
  for (const ref of refs) {
    const key = ref.path.join(".");
    if (!selectedByPath.has(key)) selectedByPath.set(key, new Set());
    selectedByPath.get(key)!.add(ref.index);
  }
  for (const ref of refs) {
    const prop = lget(doc, ref.path) as AnimProp | undefined;
    if (!prop || !isKeyframed(prop)) continue;
    const k = prop.k as Keyframe[];
    const kf = k[ref.index];
    if (!kf) continue;
    const selected = selectedByPath.get(ref.path.join("."))!;
    // Nearest non-selected neighbors (selected ones move along).
    for (let i = ref.index - 1; i >= 0; i--) {
      if (!selected.has(i)) {
        min = Math.max(min, k[i].t + 1 - kf.t);
        break;
      }
    }
    for (let i = ref.index + 1; i < k.length; i++) {
      if (!selected.has(i)) {
        max = Math.min(max, k[i].t - 1 - kf.t);
        break;
      }
    }
  }
  return { min, max };
}

/** Shift keyframes by a whole-frame delta; the caller is responsible for
 *  keeping the delta within groupDeltaBounds. */
export function moveKeyframesBy(
  draft: LottieDoc,
  refs: { path: Path; index: number; startT: number }[],
  delta: number,
): void {
  const rounded = Math.round(delta);
  for (const ref of refs) {
    const prop = lget(draft, ref.path) as AnimProp | undefined;
    if (!prop || !isKeyframed(prop)) continue;
    const kf = (prop.k as Keyframe[])[ref.index];
    if (kf) kf.t = Math.round(ref.startT) + rounded;
  }
}

/** Delete several keyframes at once (descending index per track so the
 *  indices stay valid while splicing). */
export function deleteKeyframes(draft: LottieDoc, refs: KeyframeRef[]): void {
  const sorted = [...refs].sort((a, b) => {
    const pathCompare = a.path.join(".").localeCompare(b.path.join("."));
    return pathCompare !== 0 ? pathCompare : b.index - a.index;
  });
  for (const ref of sorted) {
    deleteKeyframe(draft, ref.path, ref.index);
  }
}

export function moveKeyframe(
  draft: LottieDoc,
  path: Path,
  index: number,
  t: number,
): void {
  const prop = propAt(draft, path);
  if (!prop || !prop.k[index]) return;
  const prev = prop.k[index - 1]?.t ?? -Infinity;
  const next = prop.k[index + 1]?.t ?? Infinity;
  prop.k[index].t = Math.round(Math.max(prev + 1, Math.min(next - 1, t)));
}

/** Delete a keyframe; a single remaining keyframe collapses to a static value. */
export function deleteKeyframe(
  draft: LottieDoc,
  path: Path,
  index: number,
): void {
  const prop = propAt(draft, path);
  if (!prop || !prop.k[index]) return;
  if (prop.k.length <= 1) {
    const value = keyframeValue(prop.k[0]) ?? [0];
    prop.a = 0;
    (prop as AnimProp).k = value.length === 1 ? value[0] : value;
    return;
  }
  prop.k.splice(index, 1);
}

const LINEAR_O = { x: 1 / 3, y: 1 / 3 };
const LINEAR_I = { x: 2 / 3, y: 2 / 3 };

/** Insert a keyframe at a frame (value = current sampled value).
 *  Returns the new keyframe's index, or the existing index if one is
 *  already on that frame. */
export function addKeyframe(
  draft: LottieDoc,
  path: Path,
  frame: number,
): number {
  const prop = propAt(draft, path);
  if (!prop) return -1;
  const t = Math.round(frame);
  const k = prop.k;
  const existing = k.findIndex((kf) => Math.round(kf.t) === t);
  if (existing !== -1) return existing;
  const value = sampleKeyframes(k, t);
  const kf: Keyframe = { t, s: value, o: { ...LINEAR_O }, i: { ...LINEAR_I } };
  let index = k.findIndex((other) => other.t > t);
  if (index === -1) index = k.length;
  k.splice(index, 0, kf);
  return index;
}

/** Convert a static property into an animated one with a single keyframe. */
export function convertToAnimated(
  draft: LottieDoc,
  path: Path,
  frame: number,
): void {
  const prop = lget(draft, path) as AnimProp | undefined;
  if (!prop || isKeyframed(prop)) return;
  const value =
    typeof prop.k === "number"
      ? [prop.k]
      : Array.isArray(prop.k)
        ? (prop.k as number[])
        : [0];
  prop.a = 1;
  prop.k = [
    {
      t: Math.round(frame),
      s: value.slice(),
      o: { ...LINEAR_O },
      i: { ...LINEAR_I },
    },
  ];
}

export function setKeyframeValue(
  draft: LottieDoc,
  path: Path,
  index: number,
  value: number[],
): void {
  const prop = propAt(draft, path);
  if (!prop || !prop.k[index]) return;
  const kf = prop.k[index];
  kf.s = typeof kf.s === "number" ? value[0] : value;
}

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

export interface EasingHandles {
  o: { x: number; y: number };
  i: { x: number; y: number };
  hold: boolean;
}

function firstNumber(
  v: number | number[] | undefined,
  fallback: number,
): number {
  if (typeof v === "number") return v;
  if (Array.isArray(v) && typeof v[0] === "number") return v[0];
  return fallback;
}

/** Easing of the segment leaving keyframe `index` (toward the next one). */
export function getEasing(
  prop: AnimProp | undefined,
  index: number,
): EasingHandles | null {
  if (!prop || !isKeyframed(prop)) return null;
  const kf = (prop.k as Keyframe[])[index];
  if (!kf) return null;
  return {
    o: { x: firstNumber(kf.o?.x, 1 / 3), y: firstNumber(kf.o?.y, 1 / 3) },
    i: { x: firstNumber(kf.i?.x, 2 / 3), y: firstNumber(kf.i?.y, 2 / 3) },
    hold: kf.h === 1,
  };
}

export function setEasing(
  draft: LottieDoc,
  path: Path,
  index: number,
  handles:
    | { o: { x: number; y: number }; i: { x: number; y: number } }
    | "hold",
): void {
  const prop = propAt(draft, path);
  if (!prop || !prop.k[index]) return;
  const kf = prop.k[index];
  if (handles === "hold") {
    kf.h = 1;
    return;
  }
  delete kf.h;
  kf.o = { x: handles.o.x, y: handles.o.y };
  kf.i = { x: handles.i.x, y: handles.i.y };
}

export type EasingPresetId =
  | "linear"
  | "smooth"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "hold";

export const EASING_PRESETS: {
  id: EasingPresetId;
  label: string;
  o: { x: number; y: number };
  i: { x: number; y: number };
}[] = [
  {
    id: "linear",
    label: "Linear",
    o: { x: 1 / 3, y: 1 / 3 },
    i: { x: 2 / 3, y: 2 / 3 },
  },
  {
    id: "smooth",
    label: "Smooth",
    o: { x: 1 / 3, y: 0 },
    i: { x: 2 / 3, y: 1 },
  },
  { id: "easeIn", label: "Ease in", o: { x: 0.42, y: 0 }, i: { x: 1, y: 1 } },
  { id: "easeOut", label: "Ease out", o: { x: 0, y: 0 }, i: { x: 0.58, y: 1 } },
  {
    id: "easeInOut",
    label: "Ease in-out",
    o: { x: 0.42, y: 0 },
    i: { x: 0.58, y: 1 },
  },
  { id: "hold", label: "Hold", o: { x: 0, y: 0 }, i: { x: 1, y: 1 } },
];

export function matchEasingPreset(
  handles: EasingHandles,
): EasingPresetId | "custom" {
  if (handles.hold) return "hold";
  const close = (a: number, b: number) => Math.abs(a - b) < 0.02;
  for (const preset of EASING_PRESETS) {
    if (preset.id === "hold") continue;
    if (
      close(handles.o.x, preset.o.x) &&
      close(handles.o.y, preset.o.y) &&
      close(handles.i.x, preset.i.x) &&
      close(handles.i.y, preset.i.y)
    ) {
      return preset.id;
    }
  }
  return "custom";
}
