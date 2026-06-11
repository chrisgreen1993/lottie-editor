import { get as lget, set as lset } from "lodash-es";

import {
  addKeyframe,
  isKeyframed,
  setKeyframeValue,
  type AnimProp,
  type Keyframe,
} from "./keyframes";
import type { LottieDoc } from "./model";
import type { Path } from "./ops";

function writeProp(
  draft: LottieDoc,
  path: Path,
  frame: number,
  value: number[],
  scalar: boolean,
): void {
  const prop = lget(draft, path) as AnimProp | undefined;
  if (!prop) {
    lset(draft, path, { a: 0, k: scalar ? value[0] : value });
    return;
  }
  if (!isKeyframed(prop)) {
    const existing = Array.isArray(prop.k) ? (prop.k as number[]) : [];
    const merged = [...existing];
    value.forEach((v, i) => (merged[i] = v));
    prop.a = 0;
    prop.k = scalar ? value[0] : merged;
    return;
  }
  // Animated: write the keyframe at the playhead, auto-inserting one if needed.
  const t = Math.round(frame);
  const k = prop.k as Keyframe[];
  let index = k.findIndex((kf) => Math.round(kf.t) === t);
  if (index === -1) index = addKeyframe(draft, path, t);
  if (index !== -1) setKeyframeValue(draft, path, index, value);
}

/** Write a transform value as seen at the playhead.
 *  Static properties are written in place; animated ones get the keyframe
 *  under the playhead updated, inserting a new key there first if necessary
 *  (After Effects-style auto-keying). */
export function setTransformAtPlayhead(
  draft: LottieDoc,
  layerIndex: number,
  key: "p" | "s" | "r",
  frame: number,
  value: number[],
): void {
  const layer = draft.layers[layerIndex];
  if (!layer) return;
  if (!layer.ks) layer.ks = {};
  const ks = layer.ks as Record<string, AnimProp & { s?: boolean }>;

  if (key === "p" && ks.p?.s === true) {
    writeProp(
      draft,
      ["layers", layerIndex, "ks", "p", "x"],
      frame,
      [value[0]],
      true,
    );
    writeProp(
      draft,
      ["layers", layerIndex, "ks", "p", "y"],
      frame,
      [value[1]],
      true,
    );
    return;
  }

  if (!ks[key]) {
    ks[key] =
      key === "r"
        ? { a: 0, k: 0 }
        : { a: 0, k: key === "s" ? [100, 100, 100] : [0, 0, 0] };
  }
  writeProp(
    draft,
    ["layers", layerIndex, "ks", key],
    frame,
    value,
    key === "r",
  );
}
