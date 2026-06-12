import { sampleProp, type AnimProp } from "./keyframes";
import type { LottieDoc } from "./model";
import type { Path } from "./ops";

export interface BezierPathData {
  v: [number, number][];
  i: [number, number][];
  o: [number, number][];
  c?: boolean;
}

export interface EditablePath {
  /** Path from the doc root to the shape's `ks.k` bezier object. */
  dataPath: Path;
  data: BezierPathData;
  /** Composed transform of the enclosing groups (path space → layer space). */
  groupMatrix: DOMMatrix;
  animated: boolean;
  name: string;
}

function groupTransformMatrix(
  tr: Record<string, AnimProp> | undefined,
  frame: number,
): DOMMatrix {
  if (!tr) return new DOMMatrix();
  const p = sampleProp(tr.p, [0, 0], frame).value;
  const a = sampleProp(tr.a, [0, 0], frame).value;
  const s = sampleProp(tr.s, [100, 100], frame).value;
  const r = sampleProp(tr.r, [0], frame).value[0] ?? 0;
  return new DOMMatrix()
    .translate(p[0] ?? 0, p[1] ?? 0)
    .rotate(r)
    .scale((s[0] ?? 100) / 100, (s[1] ?? 100) / 100)
    .translate(-(a[0] ?? 0), -(a[1] ?? 0));
}

/** All bezier paths ('sh' items) in a layer, with the transform of their
 *  enclosing groups composed so points map into layer space. Animated
 *  paths are reported (showing the first keyframe) but flagged locked. */
export function collectEditablePaths(
  doc: LottieDoc,
  layerIndex: number,
  frame: number,
): EditablePath[] {
  const layer = doc.layers[layerIndex];
  if (!layer || !Array.isArray(layer.shapes)) return [];
  const out: EditablePath[] = [];

  const visit = (items: unknown[], base: Path, matrix: DOMMatrix): void => {
    items.forEach((item, idx) => {
      const shape = item as Record<string, unknown> & {
        ty?: string;
        nm?: string;
        it?: unknown[];
        ks?: AnimProp;
      };
      if (!shape || typeof shape !== "object") return;
      if (shape.ty === "gr" && Array.isArray(shape.it)) {
        const tr = shape.it.find((x) => (x as { ty?: string })?.ty === "tr") as
          | Record<string, AnimProp>
          | undefined;
        visit(
          shape.it,
          [...base, idx, "it"],
          matrix.multiply(groupTransformMatrix(tr, frame)),
        );
        return;
      }
      if (shape.ty === "sh" && shape.ks) {
        const animated =
          shape.ks.a === 1 ||
          (Array.isArray(shape.ks.k) &&
            typeof (shape.ks.k as unknown[])[0] === "object" &&
            !(shape.ks.k as { v?: unknown }).v);
        const raw = animated
          ? (shape.ks.k as Array<{ s?: unknown[] }>)?.[0]?.s?.[0] ?? null
          : shape.ks.k;
        const data = raw as BezierPathData | null;
        if (!data || !Array.isArray(data.v)) return;
        out.push({
          dataPath: [...base, idx, "ks", "k"],
          data,
          groupMatrix: DOMMatrix.fromMatrix(matrix),
          animated,
          name: (shape.nm as string) || "Path",
        });
      }
    });
  };

  visit(layer.shapes, ["layers", layerIndex, "shapes"], new DOMMatrix());
  return out;
}

/** Does the layer contain any path that can be vertex-edited? */
export function hasEditablePath(doc: LottieDoc, layerIndex: number): boolean {
  return collectEditablePaths(doc, layerIndex, 0).length > 0;
}
