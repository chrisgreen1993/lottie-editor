import type { BezierPathData } from "./pathEdit";

type Pt = [number, number];

const lerp = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/** Control points of segment j (from vertex j toward the next vertex). */
function segmentPoints(data: BezierPathData, j: number): [Pt, Pt, Pt, Pt] {
  const n = data.v.length;
  const jn = (j + 1) % n;
  const p0 = data.v[j];
  const p3 = data.v[jn];
  const p1: Pt = [p0[0] + (data.o[j]?.[0] ?? 0), p0[1] + (data.o[j]?.[1] ?? 0)];
  const p2: Pt = [
    p3[0] + (data.i[jn]?.[0] ?? 0),
    p3[1] + (data.i[jn]?.[1] ?? 0),
  ];
  return [p0, p1, p2, p3];
}

export function segmentCount(data: BezierPathData): number {
  return Math.max(0, data.c ? data.v.length : data.v.length - 1);
}

export function bezierPoint(data: BezierPathData, j: number, t: number): Pt {
  const [p0, p1, p2, p3] = segmentPoints(data, j);
  const q0 = lerp(p0, p1, t);
  const q1 = lerp(p1, p2, t);
  const q2 = lerp(p2, p3, t);
  const r0 = lerp(q0, q1, t);
  const r1 = lerp(q1, q2, t);
  return lerp(r0, r1, t);
}

/** Nearest point on segment j to `pt` (by sampling). */
export function nearestOnSegment(
  data: BezierPathData,
  j: number,
  pt: Pt,
  samples = 32,
): { t: number; dist: number; point: Pt } {
  let best = { t: 0, dist: Infinity, point: data.v[j] as Pt };
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const p = bezierPoint(data, j, t);
    const dist = Math.hypot(p[0] - pt[0], p[1] - pt[1]);
    if (dist < best.dist) best = { t, dist, point: p };
  }
  return best;
}

/** Insert a vertex on segment j at parameter t (de Casteljau split).
 *  Returns a new path and the index of the inserted vertex. */
export function splitSegment(
  data: BezierPathData,
  j: number,
  t: number,
): { data: BezierPathData; index: number } {
  const [p0, p1, p2, p3] = segmentPoints(data, j);
  const q0 = lerp(p0, p1, t);
  const q1 = lerp(p1, p2, t);
  const q2 = lerp(p2, p3, t);
  const r0 = lerp(q0, q1, t);
  const r1 = lerp(q1, q2, t);
  const s = lerp(r0, r1, t);

  const n = data.v.length;
  const jn = (j + 1) % n;
  const next: BezierPathData = {
    v: data.v.map((p) => [...p] as Pt),
    i: data.i.map((p) => [...p] as Pt),
    o: data.o.map((p) => [...p] as Pt),
    c: data.c,
  };
  next.o[j] = [q0[0] - p0[0], q0[1] - p0[1]];
  next.i[jn] = [q2[0] - p3[0], q2[1] - p3[1]];
  const insertAt = j + 1;
  next.v.splice(insertAt, 0, s);
  next.i.splice(insertAt, 0, [r0[0] - s[0], r0[1] - s[1]]);
  next.o.splice(insertAt, 0, [r1[0] - s[0], r1[1] - s[1]]);
  return { data: next, index: insertAt };
}

export function removeVertex(
  data: BezierPathData,
  index: number,
): BezierPathData {
  const next: BezierPathData = {
    v: data.v.filter((_, k) => k !== index),
    i: data.i.filter((_, k) => k !== index),
    o: data.o.filter((_, k) => k !== index),
    c: data.c,
  };
  return next;
}

export function isCornerVertex(data: BezierPathData, index: number): boolean {
  const i = data.i[index] ?? [0, 0];
  const o = data.o[index] ?? [0, 0];
  return Math.hypot(i[0], i[1]) < 0.01 && Math.hypot(o[0], o[1]) < 0.01;
}

/** Catmull-Rom style smooth tangents from the neighboring vertices. */
export function autoSmoothVertex(
  data: BezierPathData,
  index: number,
): BezierPathData {
  const n = data.v.length;
  const prev = data.v[data.c ? (index - 1 + n) % n : Math.max(0, index - 1)];
  const next = data.v[data.c ? (index + 1) % n : Math.min(n - 1, index + 1)];
  const v = data.v[index];
  let dx = next[0] - prev[0];
  let dy = next[1] - prev[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return data;
  dx /= len;
  dy /= len;
  const reach =
    Math.min(
      Math.hypot(v[0] - prev[0], v[1] - prev[1]),
      Math.hypot(next[0] - v[0], next[1] - v[1]),
    ) / 3;
  const out: BezierPathData = {
    v: data.v.map((p) => [...p] as Pt),
    i: data.i.map((p) => [...p] as Pt),
    o: data.o.map((p) => [...p] as Pt),
    c: data.c,
  };
  out.o[index] = [dx * reach, dy * reach];
  out.i[index] = [-dx * reach, -dy * reach];
  return out;
}

function clonePath(data: BezierPathData): BezierPathData {
  return {
    v: data.v.map((p) => [...p] as Pt),
    i: data.i.map((p) => [...p] as Pt),
    o: data.o.map((p) => [...p] as Pt),
    c: data.c,
  };
}

/** Sever a path at a vertex.
 *  Closed paths open there: the loop is rotated to start at the vertex and
 *  the vertex is duplicated at the far end, so both adjacent segments
 *  survive. Open paths split into two paths sharing the cut vertex
 *  (interior vertices only — cutting an endpoint is a no-op). */
export function cutAtVertex(
  data: BezierPathData,
  index: number,
): BezierPathData[] {
  if (data.c) {
    const rotate = <T>(arr: T[]): T[] => [
      ...arr.slice(index),
      ...arr.slice(0, index),
    ];
    const out = clonePath(data);
    out.v = rotate(out.v);
    out.i = rotate(out.i);
    out.o = rotate(out.o);
    out.v.push([...out.v[0]] as Pt);
    out.i.push([...out.i[0]] as Pt);
    out.o.push([0, 0]);
    // The start copy keeps only the outgoing tangent, the end copy only
    // the incoming one.
    out.i[0] = [0, 0];
    out.c = false;
    return [out];
  }
  if (index <= 0 || index >= data.v.length - 1) return [clonePath(data)];
  const a: BezierPathData = {
    v: data.v.slice(0, index + 1).map((p) => [...p] as Pt),
    i: data.i.slice(0, index + 1).map((p) => [...p] as Pt),
    o: data.o.slice(0, index + 1).map((p) => [...p] as Pt),
    c: false,
  };
  a.o[a.o.length - 1] = [0, 0];
  const b: BezierPathData = {
    v: data.v.slice(index).map((p) => [...p] as Pt),
    i: data.i.slice(index).map((p) => [...p] as Pt),
    o: data.o.slice(index).map((p) => [...p] as Pt),
    c: false,
  };
  b.i[0] = [0, 0];
  return [a, b];
}

/** Join an open path's ends with a closing segment. */
export function closePath(data: BezierPathData): BezierPathData {
  const out = clonePath(data);
  out.c = true;
  return out;
}

/** Constrain `to` so the segment from `from` lies on a 45° increment. */
export function constrain45(from: Pt, to: Pt): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return to;
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  return [from[0] + Math.cos(angle) * len, from[1] + Math.sin(angle) * len];
}

/** SVG `d` string for the path, with points run through `map`. */
export function pathToD(
  data: BezierPathData,
  map: (pt: Pt) => Pt = (p) => p,
): string {
  const n = data.v.length;
  if (n === 0) return "";
  const m = map(data.v[0]);
  let d = `M ${m[0]} ${m[1]}`;
  const segs = segmentCount(data);
  for (let j = 0; j < segs; j++) {
    const [, p1, p2, p3] = segmentPoints(data, j);
    const c1 = map(p1);
    const c2 = map(p2);
    const end = map(p3);
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${end[0]} ${end[1]}`;
  }
  if (data.c) d += " Z";
  return d;
}
