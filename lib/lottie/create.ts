import type { LottieDoc, LottieLayer } from "./model";

export type ShapeKind = "rect" | "ellipse" | "star";

const SHAPE_NAMES: Record<ShapeKind, string> = {
  rect: "Rectangle",
  ellipse: "Ellipse",
  star: "Star",
};

/** Pleasant default fills, cycled as shapes are added. */
const FILL_CYCLE: [number, number, number][] = [
  [0.22, 0.74, 0.97], // sky
  [0.96, 0.45, 0.71], // pink
  [0.98, 0.75, 0.14], // amber
  [0.55, 0.36, 0.96], // violet
  [0.2, 0.83, 0.6], // emerald
];

function staticVal(k: number | number[]): { a: 0; k: number | number[] } {
  return { a: 0, k };
}

interface ShapeRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

function shapeGeometry(
  kind: ShapeKind,
  rect: ShapeRect,
): Record<string, unknown> {
  if (kind === "rect") {
    return {
      ty: "rc",
      d: 1,
      nm: "Rectangle path",
      s: staticVal([rect.w, rect.h]),
      p: staticVal([0, 0]),
      r: staticVal(0),
    };
  }
  if (kind === "ellipse") {
    return {
      ty: "el",
      d: 1,
      nm: "Ellipse path",
      s: staticVal([rect.w, rect.h]),
      p: staticVal([0, 0]),
    };
  }
  const outer = Math.max(2, Math.min(rect.w, rect.h) / 2);
  return {
    ty: "sr",
    d: 1,
    nm: "Star path",
    sy: 1, // star (2 would be polygon)
    pt: staticVal(5),
    p: staticVal([0, 0]),
    r: staticVal(0),
    or: staticVal(outer),
    ir: staticVal(outer * 0.5),
    os: staticVal(0),
    is: staticVal(0),
  };
}

/** Insert a new shape layer at the top of the stack. */
export function addShapeLayer(
  draft: LottieDoc,
  kind: ShapeKind,
  rect: ShapeRect,
): void {
  const sameKind = draft.layers.filter((l) =>
    (l.nm ?? "").startsWith(SHAPE_NAMES[kind]),
  ).length;
  const name = `${SHAPE_NAMES[kind]} ${sameKind + 1}`;
  const fill =
    FILL_CYCLE[
      draft.layers.filter((l) => l.ty === 4).length % FILL_CYCLE.length
    ];
  const maxInd = Math.max(0, ...draft.layers.map((l) => l.ind ?? 0));

  const layer: LottieLayer = {
    ty: 4,
    nm: name,
    ind: maxInd + 1,
    ip: draft.ip,
    op: draft.op,
    st: 0,
    sr: 1,
    ao: 0,
    bm: 0,
    ks: {
      o: staticVal(100),
      r: staticVal(0),
      p: staticVal([rect.cx, rect.cy, 0]),
      a: staticVal([0, 0, 0]),
      s: staticVal([100, 100, 100]),
    },
    shapes: [
      {
        ty: "gr",
        nm: name,
        it: [
          shapeGeometry(kind, rect),
          {
            ty: "fl",
            nm: "Fill 1",
            c: staticVal([...fill]),
            o: staticVal(100),
            r: 1,
          },
          {
            ty: "tr",
            nm: "Transform",
            p: staticVal([0, 0]),
            a: staticVal([0, 0]),
            s: staticVal([100, 100]),
            r: staticVal(0),
            o: staticVal(100),
            sk: staticVal(0),
            sa: staticVal(0),
          },
        ],
      },
    ],
  };

  draft.layers.unshift(layer);
}

export interface PenVertex {
  /** Vertex position in composition coordinates. */
  v: [number, number];
  /** In/out bezier tangents, relative to the vertex. */
  i: [number, number];
  o: [number, number];
}

/** Insert a new shape layer containing a bezier path drawn with the pen
 *  tool. Path coordinates are composition coordinates (the layer transform
 *  is identity). Closed paths get a fill; open paths only a stroke. */
export function addPathLayer(
  draft: LottieDoc,
  vertices: PenVertex[],
  closed: boolean,
): void {
  if (vertices.length < 2) return;
  const count = draft.layers.filter((l) =>
    (l.nm ?? "").startsWith("Path"),
  ).length;
  const name = `Path ${count + 1}`;
  const fill =
    FILL_CYCLE[
      draft.layers.filter((l) => l.ty === 4).length % FILL_CYCLE.length
    ];
  const maxInd = Math.max(0, ...draft.layers.map((l) => l.ind ?? 0));

  const items: Record<string, unknown>[] = [
    {
      ty: "sh",
      nm: "Path",
      ks: {
        a: 0,
        k: {
          i: vertices.map((p) => p.i),
          o: vertices.map((p) => p.o),
          v: vertices.map((p) => p.v),
          c: closed,
        },
      },
    },
  ];
  if (closed) {
    items.push({
      ty: "fl",
      nm: "Fill 1",
      c: staticVal([...fill]),
      o: staticVal(100),
      r: 1,
    });
  }
  items.push(
    {
      ty: "st",
      nm: "Stroke 1",
      c: staticVal(closed ? [1, 1, 1] : [...fill]),
      o: staticVal(100),
      w: staticVal(4),
      lc: 2,
      lj: 2,
    },
    {
      ty: "tr",
      nm: "Transform",
      p: staticVal([0, 0]),
      a: staticVal([0, 0]),
      s: staticVal([100, 100]),
      r: staticVal(0),
      o: staticVal(100),
      sk: staticVal(0),
      sa: staticVal(0),
    },
  );

  const layer: LottieLayer = {
    ty: 4,
    nm: name,
    ind: maxInd + 1,
    ip: draft.ip,
    op: draft.op,
    st: 0,
    sr: 1,
    ao: 0,
    bm: 0,
    ks: {
      o: staticVal(100),
      r: staticVal(0),
      p: staticVal([0, 0, 0]),
      a: staticVal([0, 0, 0]),
      s: staticVal([100, 100, 100]),
    },
    shapes: [{ ty: "gr", nm: name, it: items }],
  };

  draft.layers.unshift(layer);
}

/** A fresh, empty composition for starting from scratch. */
export function blankDoc(): LottieDoc {
  return {
    v: "5.9.0",
    nm: "Untitled",
    fr: 30,
    ip: 0,
    op: 90,
    w: 1080,
    h: 1080,
    bg: "#ffffff",
    ddd: 0,
    assets: [],
    layers: [],
  };
}
