import { get as lget, set as lset } from "lodash-es";

import { normalizeComponents, rgbToHex, type RGB } from "./color";
import { addKeyframe, sampleKeyframes, type Keyframe } from "./keyframes";
import { layerName, type LottieDoc, type LottieLayer } from "./model";

export type Path = (string | number)[];

// ---------------------------------------------------------------------------
// Animated-property helpers
// ---------------------------------------------------------------------------

interface AnimatableProp {
  a?: number;
  k?: unknown;
  [key: string]: unknown;
}

export function isAnimated(prop: AnimatableProp | undefined): boolean {
  if (!prop) return false;
  if (prop.a === 1) return true;
  return (
    Array.isArray(prop.k) &&
    prop.k.length > 0 &&
    typeof prop.k[0] === "object" &&
    prop.k[0] !== null
  );
}

function staticNumber(
  prop: AnimatableProp | undefined,
  fallback: number,
): number {
  if (!prop) return fallback;
  if (isAnimated(prop)) {
    const first = (prop.k as Array<{ s?: number[] | number }>)[0];
    if (typeof first?.s === "number") return first.s;
    if (Array.isArray(first?.s)) return first.s[0] ?? fallback;
    return fallback;
  }
  if (typeof prop.k === "number") return prop.k;
  if (Array.isArray(prop.k) && typeof prop.k[0] === "number") return prop.k[0];
  return fallback;
}

function staticVector(
  prop: AnimatableProp | undefined,
  fallback: number[],
): number[] {
  if (!prop) return fallback;
  if (isAnimated(prop)) {
    const first = (prop.k as Array<{ s?: number[] }>)[0];
    if (Array.isArray(first?.s)) return first.s;
    return fallback;
  }
  if (Array.isArray(prop.k)) return prop.k as number[];
  return fallback;
}

// ---------------------------------------------------------------------------
// Layer transform
// ---------------------------------------------------------------------------

export interface ScalarValue {
  value: number;
  animated: boolean;
}

export interface VectorValue {
  value: number[];
  animated: boolean;
}

export interface LayerTransform {
  position: VectorValue;
  anchor: VectorValue;
  scale: VectorValue;
  rotation: ScalarValue;
  opacity: ScalarValue;
}

export function getLayerTransform(layer: LottieLayer): LayerTransform {
  const ks = (layer.ks ?? {}) as Record<string, AnimatableProp>;
  const p = ks.p as
    | (AnimatableProp & { s?: boolean; x?: AnimatableProp; y?: AnimatableProp })
    | undefined;

  let position: VectorValue;
  if (p?.s === true) {
    // Split position: separate x/y animatable props.
    position = {
      value: [staticNumber(p.x, 0), staticNumber(p.y, 0)],
      animated: isAnimated(p.x) || isAnimated(p.y),
    };
  } else {
    position = {
      value: staticVector(p, [0, 0]).slice(0, 2),
      animated: isAnimated(p),
    };
  }

  return {
    position,
    anchor: {
      value: staticVector(ks.a, [0, 0]).slice(0, 2),
      animated: isAnimated(ks.a),
    },
    scale: {
      value: staticVector(ks.s, [100, 100]).slice(0, 2),
      animated: isAnimated(ks.s),
    },
    rotation: { value: staticNumber(ks.r, 0), animated: isAnimated(ks.r) },
    opacity: { value: staticNumber(ks.o, 100), animated: isAnimated(ks.o) },
  };
}

export type TransformKey =
  | "position"
  | "anchor"
  | "scale"
  | "rotation"
  | "opacity";

/** Write a static (non-animated) transform value on a draft layer.
 *  No-op if the underlying property is animated. */
export function setLayerTransform(
  layer: LottieLayer,
  key: TransformKey,
  value: number | number[],
): void {
  if (!layer.ks) layer.ks = {};
  const ks = layer.ks as Record<string, AnimatableProp>;
  const propKey = {
    position: "p",
    anchor: "a",
    scale: "s",
    rotation: "r",
    opacity: "o",
  }[key];

  if (key === "position") {
    const p = ks.p as
      | (AnimatableProp & {
          s?: boolean;
          x?: AnimatableProp;
          y?: AnimatableProp;
        })
      | undefined;
    const v = value as number[];
    if (p?.s === true) {
      if (p.x && !isAnimated(p.x)) p.x.k = v[0];
      if (p.y && !isAnimated(p.y)) p.y.k = v[1];
      return;
    }
  }

  const prop = ks[propKey];
  if (prop && isAnimated(prop)) return;
  if (key === "rotation" || key === "opacity") {
    ks[propKey] = { ...(prop ?? {}), a: 0, k: value as number };
  } else {
    const prev = (
      prop && Array.isArray(prop.k) ? (prop.k as number[]) : []
    ).slice();
    const v = value as number[];
    const k =
      key === "scale"
        ? [v[0], v[1], prev[2] ?? 100]
        : [v[0], v[1], prev[2] ?? 0];
    ks[propKey] = { ...(prop ?? {}), a: 0, k };
  }
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface ColorRef {
  id: string;
  /** Path (relative to the doc) of the numeric color container. */
  path: Path;
  kind: "fill" | "stroke" | "gradient" | "solid";
  /** For gradients: index of the stop inside the flat stop array. */
  stopOffset?: number;
  name: string;
  rgb: RGB;
  hex: string;
  animated: boolean;
  /** For animated colors: path to the animatable prop and the keyframe
   *  index under the sampled frame (-1 = between keys → auto-key). */
  propPath?: Path;
  keyIndex?: number;
}

interface Shape {
  ty?: string;
  nm?: string;
  hd?: boolean;
  it?: Shape[];
  c?: AnimatableProp;
  w?: AnimatableProp;
  g?: { p?: number; k?: AnimatableProp };
  [key: string]: unknown;
}

function pushColorRef(
  out: ColorRef[],
  partial: Omit<ColorRef, "id" | "hex">,
): void {
  out.push({
    ...partial,
    hex: rgbToHex(partial.rgb),
    id: `${partial.path.join(".")}:${partial.stopOffset ?? ""}`,
  });
}

function collectShapeColors(
  shapes: Shape[] | undefined,
  basePath: Path,
  prefix: string,
  out: ColorRef[],
  frame: number,
): void {
  if (!Array.isArray(shapes)) return;
  shapes.forEach((shape, i) => {
    if (!shape || typeof shape !== "object") return;
    const path = [...basePath, i];
    const name = shape.nm?.trim() || shape.ty || "shape";
    const label = prefix ? `${prefix} › ${name}` : name;

    if (shape.ty === "gr") {
      collectShapeColors(shape.it, [...path, "it"], label, out, frame);
      return;
    }

    if (shape.ty === "fl" || shape.ty === "st") {
      const c = shape.c;
      const animated = isAnimated(c);
      if (animated) {
        // Animated colors sample at the playhead and edit keyframes.
        const k = (c?.k ?? []) as Keyframe[];
        const rounded = Math.round(frame);
        pushColorRef(out, {
          path: [...path, "c", "k"],
          propPath: [...path, "c"],
          keyIndex: k.findIndex((kf) => Math.round(kf.t) === rounded),
          kind: shape.ty === "fl" ? "fill" : "stroke",
          name: label,
          rgb: normalizeComponents(sampleKeyframes(k, frame)),
          animated: true,
        });
        return;
      }
      const raw = Array.isArray(c?.k) ? (c?.k as number[]) : [0, 0, 0];
      pushColorRef(out, {
        path: [...path, "c", "k"],
        kind: shape.ty === "fl" ? "fill" : "stroke",
        name: label,
        rgb: normalizeComponents(raw),
        animated: false,
      });
      return;
    }

    if (shape.ty === "gf" || shape.ty === "gs") {
      const stops = shape.g;
      const k = stops?.k;
      if (!stops || !k || isAnimated(k) || !Array.isArray(k.k)) return;
      const flat = k.k as number[];
      const count = stops.p ?? Math.floor(flat.length / 4);
      for (let s = 0; s < count; s++) {
        const offset = s * 4;
        if (offset + 3 >= flat.length) break;
        pushColorRef(out, {
          path: [...path, "g", "k", "k"],
          kind: "gradient",
          stopOffset: offset,
          name: `${label} · stop ${s + 1}`,
          rgb: normalizeComponents([
            flat[offset + 1],
            flat[offset + 2],
            flat[offset + 3],
          ]),
          animated: false,
        });
      }
    }
  });
}

function collectLayerColorRefs(
  doc: LottieDoc,
  layer: LottieLayer,
  layerPath: Path,
  layerLabel: string,
  out: ColorRef[],
  visitedAssets: Set<string>,
  frame: number,
): void {
  // Solid layers carry their color as a hex string.
  if (layer.ty === 1 && typeof layer.sc === "string") {
    const rgb = normalizeComponents([
      parseInt(layer.sc.slice(1, 3), 16) / 255,
      parseInt(layer.sc.slice(3, 5), 16) / 255,
      parseInt(layer.sc.slice(5, 7), 16) / 255,
    ]);
    pushColorRef(out, {
      path: [...layerPath, "sc"],
      kind: "solid",
      name: layerLabel,
      rgb,
      animated: false,
    });
  }

  collectShapeColors(
    layer.shapes as Shape[],
    [...layerPath, "shapes"],
    layerLabel,
    out,
    frame,
  );

  // Recurse into precomp assets so nested colors are editable too.
  if (
    layer.ty === 0 &&
    typeof layer.refId === "string" &&
    !visitedAssets.has(layer.refId)
  ) {
    visitedAssets.add(layer.refId);
    const assetIndex = (doc.assets ?? []).findIndex(
      (a) => a.id === layer.refId,
    );
    const asset = doc.assets?.[assetIndex];
    if (asset?.layers) {
      asset.layers.forEach((sub, si) => {
        collectLayerColorRefs(
          doc,
          sub,
          ["assets", assetIndex, "layers", si],
          `${layerLabel} › ${layerName(sub, si)}`,
          out,
          visitedAssets,
          frame,
        );
      });
    }
  }
}

export function collectLayerColors(
  doc: LottieDoc,
  layerIndex: number,
  frame = 0,
): ColorRef[] {
  const layer = doc.layers[layerIndex];
  if (!layer) return [];
  const out: ColorRef[] = [];
  collectLayerColorRefs(
    doc,
    layer,
    ["layers", layerIndex],
    layerName(layer, layerIndex),
    out,
    new Set(),
    frame,
  );
  return out;
}

export function collectDocColors(doc: LottieDoc, frame = 0): ColorRef[] {
  const out: ColorRef[] = [];
  const visited = new Set<string>();
  doc.layers.forEach((layer, i) => {
    collectLayerColorRefs(
      doc,
      layer,
      ["layers", i],
      layerName(layer, i),
      out,
      visited,
      frame,
    );
  });
  return out;
}

/** Apply a color (0..1 rgb) to a draft doc through a ColorRef.
 *  Animated colors write the keyframe under `frame`, inserting one at the
 *  sampled value first if none exists (auto-keying). */
export function applyColorRef(
  draft: LottieDoc,
  ref: ColorRef,
  rgb: RGB,
  frame = 0,
): void {
  if (ref.kind === "solid") {
    lset(draft, ref.path, rgbToHex(rgb));
    return;
  }
  if (ref.kind === "gradient") {
    const flat = lget(draft, ref.path) as number[] | undefined;
    if (!Array.isArray(flat) || ref.stopOffset === undefined) return;
    flat[ref.stopOffset + 1] = rgb[0];
    flat[ref.stopOffset + 2] = rgb[1];
    flat[ref.stopOffset + 3] = rgb[2];
    return;
  }
  if (ref.animated && ref.propPath) {
    let index = ref.keyIndex ?? -1;
    if (index === -1) index = addKeyframe(draft, ref.propPath, frame);
    if (index === -1) return;
    const k = lget(draft, [...ref.propPath, "k"]) as Keyframe[] | undefined;
    const kf = k?.[index];
    if (!kf || !Array.isArray(kf.s)) return;
    kf.s[0] = rgb[0];
    kf.s[1] = rgb[1];
    kf.s[2] = rgb[2];
    return;
  }
  const existing = lget(draft, ref.path) as number[] | undefined;
  const alpha =
    Array.isArray(existing) && existing.length > 3 ? [existing[3]] : [];
  lset(draft, ref.path, [...rgb, ...alpha]);
}

export interface PaletteGroup {
  hex: string;
  rgb: RGB;
  refs: ColorRef[];
}

/** Group editable color refs by hex value, for document-wide recoloring. */
export function paletteGroups(refs: ColorRef[]): PaletteGroup[] {
  const groups = new Map<string, PaletteGroup>();
  for (const ref of refs) {
    if (ref.animated) continue;
    const existing = groups.get(ref.hex);
    if (existing) {
      existing.refs.push(ref);
    } else {
      groups.set(ref.hex, { hex: ref.hex, rgb: ref.rgb, refs: [ref] });
    }
  }
  return Array.from(groups.values());
}

// ---------------------------------------------------------------------------
// Stroke widths
// ---------------------------------------------------------------------------

export interface StrokeWidthRef {
  id: string;
  path: Path;
  name: string;
  value: number;
  animated: boolean;
}

function collectShapeStrokeWidths(
  shapes: Shape[] | undefined,
  basePath: Path,
  prefix: string,
  out: StrokeWidthRef[],
): void {
  if (!Array.isArray(shapes)) return;
  shapes.forEach((shape, i) => {
    if (!shape || typeof shape !== "object") return;
    const path = [...basePath, i];
    const name = shape.nm?.trim() || shape.ty || "shape";
    const label = prefix ? `${prefix} › ${name}` : name;
    if (shape.ty === "gr") {
      collectShapeStrokeWidths(shape.it, [...path, "it"], label, out);
    } else if ((shape.ty === "st" || shape.ty === "gs") && shape.w) {
      out.push({
        id: [...path, "w"].join("."),
        path: [...path, "w", "k"],
        name: label,
        value: staticNumber(shape.w, 1),
        animated: isAnimated(shape.w),
      });
    }
  });
}

export function collectStrokeWidths(
  doc: LottieDoc,
  layerIndex: number,
): StrokeWidthRef[] {
  const layer = doc.layers[layerIndex];
  if (!layer) return [];
  const out: StrokeWidthRef[] = [];
  collectShapeStrokeWidths(
    layer.shapes as Shape[],
    ["layers", layerIndex, "shapes"],
    "",
    out,
  );
  return out;
}

export function setStrokeWidth(
  draft: LottieDoc,
  ref: StrokeWidthRef,
  value: number,
): void {
  lset(draft, ref.path, Math.max(0, value));
}

// ---------------------------------------------------------------------------
// Keyframes (for timeline markers)
// ---------------------------------------------------------------------------

/** Recursively collect keyframe times from any animated property in a layer. */
export function collectKeyframeTimes(layer: LottieLayer): number[] {
  const times = new Set<number>();
  const visit = (node: unknown, depth: number): void => {
    if (depth > 12 || node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1);
      return;
    }
    const obj = node as AnimatableProp;
    if (obj.a === 1 && Array.isArray(obj.k)) {
      for (const kf of obj.k as Array<{ t?: number }>) {
        if (typeof kf?.t === "number") times.add(kf.t);
      }
      return;
    }
    for (const value of Object.values(obj)) visit(value, depth + 1);
  };
  visit(layer.ks, 0);
  visit(layer.shapes, 0);
  return Array.from(times).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Layer operations (all mutate a draft doc)
// ---------------------------------------------------------------------------

export function toggleLayerVisibility(draft: LottieDoc, index: number): void {
  const layer = draft.layers[index];
  if (layer) layer.hd = !layer.hd;
}

export function renameLayer(
  draft: LottieDoc,
  index: number,
  name: string,
): void {
  const layer = draft.layers[index];
  if (layer) layer.nm = name;
}

export function deleteLayer(draft: LottieDoc, index: number): void {
  draft.layers.splice(index, 1);
}

export function duplicateLayer(draft: LottieDoc, index: number): void {
  const layer = draft.layers[index];
  if (!layer) return;
  const copy = structuredClone(layer) as LottieLayer;
  copy.nm = `${layerName(layer, index)} copy`;
  const maxInd = Math.max(0, ...draft.layers.map((l) => l.ind ?? 0));
  copy.ind = maxInd + 1;
  draft.layers.splice(index + 1, 0, copy);
}

export function moveLayer(draft: LottieDoc, from: number, to: number): void {
  if (from === to || from < 0 || from >= draft.layers.length) return;
  const clamped = Math.max(0, Math.min(draft.layers.length - 1, to));
  const [layer] = draft.layers.splice(from, 1);
  draft.layers.splice(clamped, 0, layer);
}

/** Trim or shift a layer's in/out points, clamped to the doc range. */
export function setLayerRange(
  draft: LottieDoc,
  index: number,
  ip: number,
  op: number,
  shiftStart = false,
): void {
  const layer = draft.layers[index];
  if (!layer) return;
  const prevIp = layer.ip;
  layer.ip = Math.min(ip, op - 1);
  layer.op = Math.max(op, ip + 1);
  if (shiftStart) {
    layer.st = (layer.st ?? 0) + (layer.ip - prevIp);
  }
}
