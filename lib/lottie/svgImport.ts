import type { LottieDoc, LottieLayer } from "./model";
import type { BezierPathData } from "./pathEdit";

type Pt = [number, number];

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  lime: "#00ff00",
  navy: "#000080",
  teal: "#008080",
  maroon: "#800000",
  olive: "#808000",
  transparent: "none",
};

/** Parse a CSS color into 0..1 rgb plus an alpha, or null for none. */
function parseColor(
  raw: string | null | undefined,
): { rgb: [number, number, number]; alpha: number } | null {
  if (!raw) return null;
  let value = raw.trim().toLowerCase();
  if (value === "none") return null;
  if (value === "currentcolor") value = "#000000";
  if (NAMED_COLORS[value]) value = NAMED_COLORS[value];
  if (value === "none") return null;

  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    let r = 0,
      g = 0,
      b = 0,
      a = 1;
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      if (hex.length === 4) a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      return null;
    }
    return { rgb: [r / 255, g / 255, b / 255], alpha: a };
  }

  const fn = value.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(parseFloat);
    if (parts.length >= 3) {
      const [r, g, b, a = 1] = parts;
      return { rgb: [r / 255, g / 255, b / 255], alpha: a };
    }
  }

  // Gradients (url(#...)) and anything unparsable degrade to gray so the
  // shape still shows up and stays recolorable.
  if (value.startsWith("url(")) {
    return { rgb: [0.6, 0.6, 0.6], alpha: 1 };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Path data                                                           */
/* ------------------------------------------------------------------ */

interface PathBuilder {
  data: BezierPathData;
}

function newPath(x: number, y: number): PathBuilder {
  return { data: { v: [[x, y]], i: [[0, 0]], o: [[0, 0]], c: false } };
}

function lineTo(p: PathBuilder, x: number, y: number): void {
  p.data.v.push([x, y]);
  p.data.i.push([0, 0]);
  p.data.o.push([0, 0]);
}

function cubicTo(
  p: PathBuilder,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x: number,
  y: number,
): void {
  const last = p.data.v.length - 1;
  const lv = p.data.v[last];
  p.data.o[last] = [c1x - lv[0], c1y - lv[1]];
  p.data.v.push([x, y]);
  p.data.i.push([c2x - x, c2y - y]);
  p.data.o.push([0, 0]);
}

/** Convert one elliptical-arc segment into cubic beziers. */
function arcToCubics(
  p: PathBuilder,
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  rotDeg: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number,
): void {
  if (rx === 0 || ry === 0) {
    lineTo(p, x2, y2);
    return;
  }
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (rotDeg * Math.PI) / 180;
  const cosp = Math.cos(phi),
    sinp = Math.sin(phi);
  const dx = (x1 - x2) / 2,
    dy = (y1 - y2) / 2;
  const x1p = cosp * dx + sinp * dy;
  const y1p = -sinp * dx + cosp * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }
  const sign = largeArc !== sweep ? 1 : -1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cosp * cxp - sinp * cyp + (x1 + x2) / 2;
  const cy = sinp * cxp + cosp * cyp + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;
  if (sweep && dtheta < 0) dtheta += 2 * Math.PI;

  const segments = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const delta = dtheta / segments;
  const alpha = (4 / 3) * Math.tan(delta / 4);
  let t = theta1;
  for (let s = 0; s < segments; s++) {
    const cos1 = Math.cos(t),
      sin1 = Math.sin(t);
    const cos2 = Math.cos(t + delta),
      sin2 = Math.sin(t + delta);
    const point = (ct: number, st: number): Pt => [
      cx + rx * cosp * ct - ry * sinp * st,
      cy + rx * sinp * ct + ry * cosp * st,
    ];
    const deriv = (ct: number, st: number): Pt => [
      -rx * cosp * st - ry * sinp * ct,
      -rx * sinp * st + ry * cosp * ct,
    ];
    const p1 = point(cos1, sin1);
    const p2 = point(cos2, sin2);
    const d1 = deriv(cos1, sin1);
    const d2 = deriv(cos2, sin2);
    cubicTo(
      p,
      p1[0] + alpha * d1[0],
      p1[1] + alpha * d1[1],
      p2[0] - alpha * d2[0],
      p2[1] - alpha * d2[1],
      p2[0],
      p2[1],
    );
    t += delta;
  }
}

function finishPath(
  p: PathBuilder | null,
  closed: boolean,
): BezierPathData | null {
  if (!p || p.data.v.length < 2) return null;
  const d = p.data;
  if (closed) {
    // Merge a coincident trailing vertex into the start.
    const first = d.v[0];
    const last = d.v[d.v.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.01) {
      d.i[0] = d.i[d.v.length - 1];
      d.v.pop();
      d.i.pop();
      d.o.pop();
    }
    d.c = true;
  }
  return d.v.length >= 2 ? d : null;
}

/** Parse an SVG path `d` attribute into bezier subpaths. */
export function parsePathData(d: string): BezierPathData[] {
  const tokens =
    d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  const out: BezierPathData[] = [];
  let i = 0;
  let cur: PathBuilder | null = null;
  let cx = 0,
    cy = 0,
    sx = 0,
    sy = 0;
  let cmd = "";
  let prevCubic: Pt | null = null;
  let prevQuad: Pt | null = null;

  const num = () => parseFloat(tokens[i++]);
  const flag = () => {
    // Arc flags may be written without separators; tokens already split
    // numbers, so a "11" token would be wrong only in pathological input.
    const t = tokens[i++];
    return t === "1" || t === "1." ? 1 : Number(parseFloat(t) !== 0);
  };
  const flush = (closed: boolean) => {
    const data = finishPath(cur, closed);
    if (data) out.push(data);
    cur = null;
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[a-zA-Z]/.test(token)) {
      cmd = token;
      i++;
      if (cmd === "Z" || cmd === "z") {
        flush(true);
        cx = sx;
        cy = sy;
        prevCubic = prevQuad = null;
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    switch (C) {
      case "M": {
        flush(false);
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        cur = newPath(x, y);
        cx = sx = x;
        cy = sy = y;
        cmd = rel ? "l" : "L"; // additional pairs are implicit linetos
        prevCubic = prevQuad = null;
        break;
      }
      case "L": {
        const x = num() + (rel ? cx : 0);
        const y = num() + (rel ? cy : 0);
        if (cur) lineTo(cur, x, y);
        cx = x;
        cy = y;
        prevCubic = prevQuad = null;
        break;
      }
      case "H": {
        const x = num() + (rel ? cx : 0);
        if (cur) lineTo(cur, x, cy);
        cx = x;
        prevCubic = prevQuad = null;
        break;
      }
      case "V": {
        const y = num() + (rel ? cy : 0);
        if (cur) lineTo(cur, cx, y);
        cy = y;
        prevCubic = prevQuad = null;
        break;
      }
      case "C": {
        const c1x = num() + (rel ? cx : 0),
          c1y = num() + (rel ? cy : 0);
        const c2x = num() + (rel ? cx : 0),
          c2y = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0),
          y = num() + (rel ? cy : 0);
        if (cur) cubicTo(cur, c1x, c1y, c2x, c2y, x, y);
        prevCubic = [c2x, c2y];
        prevQuad = null;
        cx = x;
        cy = y;
        break;
      }
      case "S": {
        const c1x = prevCubic ? 2 * cx - prevCubic[0] : cx;
        const c1y = prevCubic ? 2 * cy - prevCubic[1] : cy;
        const c2x = num() + (rel ? cx : 0),
          c2y = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0),
          y = num() + (rel ? cy : 0);
        if (cur) cubicTo(cur, c1x, c1y, c2x, c2y, x, y);
        prevCubic = [c2x, c2y];
        prevQuad = null;
        cx = x;
        cy = y;
        break;
      }
      case "Q": {
        const qx = num() + (rel ? cx : 0),
          qy = num() + (rel ? cy : 0);
        const x = num() + (rel ? cx : 0),
          y = num() + (rel ? cy : 0);
        if (cur) {
          cubicTo(
            cur,
            cx + (2 / 3) * (qx - cx),
            cy + (2 / 3) * (qy - cy),
            x + (2 / 3) * (qx - x),
            y + (2 / 3) * (qy - y),
            x,
            y,
          );
        }
        prevQuad = [qx, qy];
        prevCubic = null;
        cx = x;
        cy = y;
        break;
      }
      case "T": {
        const qx: number = prevQuad ? 2 * cx - prevQuad[0] : cx;
        const qy: number = prevQuad ? 2 * cy - prevQuad[1] : cy;
        const x = num() + (rel ? cx : 0),
          y = num() + (rel ? cy : 0);
        if (cur) {
          cubicTo(
            cur,
            cx + (2 / 3) * (qx - cx),
            cy + (2 / 3) * (qy - cy),
            x + (2 / 3) * (qx - x),
            y + (2 / 3) * (qy - y),
            x,
            y,
          );
        }
        prevQuad = [qx, qy];
        prevCubic = null;
        cx = x;
        cy = y;
        break;
      }
      case "A": {
        const rx = num(),
          ry = num(),
          rot = num();
        const laf = flag(),
          swf = flag();
        const x = num() + (rel ? cx : 0),
          y = num() + (rel ? cy : 0);
        if (cur) arcToCubics(cur, cx, cy, rx, ry, rot, laf, swf, x, y);
        cx = x;
        cy = y;
        prevCubic = prevQuad = null;
        break;
      }
      default:
        i++; // unknown token — skip defensively
    }
  }
  flush(false);
  return out;
}

/* ------------------------------------------------------------------ */
/* Element geometry                                                    */
/* ------------------------------------------------------------------ */

const KAPPA = 0.5522847498;

function ellipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): BezierPathData {
  return {
    v: [
      [cx + rx, cy],
      [cx, cy + ry],
      [cx - rx, cy],
      [cx, cy - ry],
    ],
    i: [
      [0, -ry * KAPPA],
      [rx * KAPPA, 0],
      [0, ry * KAPPA],
      [-rx * KAPPA, 0],
    ],
    o: [
      [0, ry * KAPPA],
      [-rx * KAPPA, 0],
      [0, -ry * KAPPA],
      [rx * KAPPA, 0],
    ],
    c: true,
  };
}

function rectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number,
): BezierPathData {
  rx = Math.min(rx, w / 2);
  ry = Math.min(ry, h / 2);
  if (rx <= 0 || ry <= 0) {
    return {
      v: [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ],
      i: [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      o: [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      c: true,
    };
  }
  const kx = rx * KAPPA,
    ky = ry * KAPPA;
  return {
    v: [
      [x + rx, y],
      [x + w - rx, y],
      [x + w, y + ry],
      [x + w, y + h - ry],
      [x + w - rx, y + h],
      [x + rx, y + h],
      [x, y + h - ry],
      [x, y + ry],
    ],
    i: [
      [0, 0],
      [0, 0],
      [0, -ky],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, ky],
      [0, 0],
    ],
    o: [
      [0, 0],
      [kx, 0],
      [0, 0],
      [0, ky],
      [-kx, 0],
      [0, 0],
      [0, -ky],
      [0, 0],
    ],
    c: true,
  };
}

function pointsPath(
  pointsAttr: string,
  closed: boolean,
): BezierPathData | null {
  const nums = pointsAttr.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  if (!nums || nums.length < 4) return null;
  const data: BezierPathData = { v: [], i: [], o: [], c: closed };
  for (let k = 0; k + 1 < nums.length; k += 2) {
    data.v.push([parseFloat(nums[k]), parseFloat(nums[k + 1])]);
    data.i.push([0, 0]);
    data.o.push([0, 0]);
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Transforms & styles                                                 */
/* ------------------------------------------------------------------ */

function parseTransformAttr(str: string | null): DOMMatrix {
  let m = new DOMMatrix();
  if (!str) return m;
  for (const match of Array.from(str.matchAll(/(\w+)\s*\(([^)]*)\)/g))) {
    const fn = match[1];
    const args = (
      match[2].match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? []
    ).map(parseFloat);
    switch (fn) {
      case "translate":
        m = m.translate(args[0] ?? 0, args[1] ?? 0);
        break;
      case "scale":
        m = m.scale(args[0] ?? 1, args[1] ?? args[0] ?? 1);
        break;
      case "rotate":
        if (args.length >= 3) {
          m = m
            .translate(args[1], args[2])
            .rotate(args[0])
            .translate(-args[1], -args[2]);
        } else {
          m = m.rotate(args[0] ?? 0);
        }
        break;
      case "matrix":
        if (args.length === 6) {
          m = m.multiply(new DOMMatrix(`matrix(${args.join(",")})`));
        }
        break;
      case "skewX":
        m = m.skewX(args[0] ?? 0);
        break;
      case "skewY":
        m = m.skewY(args[0] ?? 0);
        break;
    }
  }
  return m;
}

function transformPathData(data: BezierPathData, m: DOMMatrix): BezierPathData {
  const point = (p: Pt): Pt => {
    const t = m.transformPoint(new DOMPoint(p[0], p[1]));
    return [t.x, t.y];
  };
  const vector = (p: Pt): Pt => [
    m.a * p[0] + m.c * p[1],
    m.b * p[0] + m.d * p[1],
  ];
  return {
    v: data.v.map(point),
    i: data.i.map(vector),
    o: data.o.map(vector),
    c: data.c,
  };
}

interface SvgStyle {
  fill: string | null;
  fillOpacity: number;
  fillRule: string;
  stroke: string | null;
  strokeOpacity: number;
  strokeWidth: number;
  linecap: string;
  linejoin: string;
  opacity: number;
}

function readStyle(el: Element, parent: SvgStyle): SvgStyle {
  const styleAttr = new Map<string, string>();
  for (const part of (el.getAttribute("style") ?? "").split(";")) {
    const [k, v] = part.split(":");
    if (k && v) styleAttr.set(k.trim(), v.trim());
  }
  const get = (name: string): string | null =>
    styleAttr.get(name) ?? el.getAttribute(name);

  const next = { ...parent };
  const fill = get("fill");
  if (fill !== null) next.fill = fill;
  const stroke = get("stroke");
  if (stroke !== null) next.stroke = stroke;
  const fo = get("fill-opacity");
  if (fo !== null) next.fillOpacity = parent.fillOpacity * parseFloat(fo);
  const so = get("stroke-opacity");
  if (so !== null) next.strokeOpacity = parent.strokeOpacity * parseFloat(so);
  const sw = get("stroke-width");
  if (sw !== null) next.strokeWidth = parseFloat(sw);
  const fr = get("fill-rule");
  if (fr !== null) next.fillRule = fr;
  const lc = get("stroke-linecap");
  if (lc !== null) next.linecap = lc;
  const lj = get("stroke-linejoin");
  if (lj !== null) next.linejoin = lj;
  const op = get("opacity");
  if (op !== null) next.opacity = parent.opacity * parseFloat(op);
  return next;
}

/* ------------------------------------------------------------------ */
/* SVG → Lottie shape groups                                           */
/* ------------------------------------------------------------------ */

const staticVal = (k: number | number[] | number[][]) => ({ a: 0, k });

function buildGroup(
  name: string,
  paths: BezierPathData[],
  style: SvgStyle,
  scaleFactor: number,
): Record<string, unknown> | null {
  if (paths.length === 0) return null;
  const items: Record<string, unknown>[] = paths.map((data, idx) => ({
    ty: "sh",
    nm: paths.length > 1 ? `Path ${idx + 1}` : "Path",
    ks: { a: 0, k: data },
  }));

  const fill = parseColor(style.fill ?? "#000000");
  if (fill) {
    items.push({
      ty: "fl",
      nm: "Fill",
      c: staticVal(fill.rgb),
      o: staticVal(
        Math.round(fill.alpha * style.fillOpacity * style.opacity * 100),
      ),
      r: style.fillRule === "evenodd" ? 2 : 1,
    });
  }
  const stroke = style.stroke ? parseColor(style.stroke) : null;
  if (stroke) {
    items.push({
      ty: "st",
      nm: "Stroke",
      c: staticVal(stroke.rgb),
      o: staticVal(
        Math.round(stroke.alpha * style.strokeOpacity * style.opacity * 100),
      ),
      w: staticVal(style.strokeWidth * scaleFactor),
      lc: style.linecap === "round" ? 2 : style.linecap === "square" ? 3 : 1,
      lj: style.linejoin === "round" ? 2 : style.linejoin === "bevel" ? 3 : 1,
    });
  }
  if (!fill && !stroke) return null;

  items.push({
    ty: "tr",
    nm: "Transform",
    p: staticVal([0, 0]),
    a: staticVal([0, 0]),
    s: staticVal([100, 100]),
    r: staticVal(0),
    o: staticVal(100),
    sk: staticVal(0),
    sa: staticVal(0),
  });

  return { ty: "gr", nm: name, it: items };
}

/** Convert SVG markup into a Lottie shape layer, scaled to fit and
 *  centered in a composition of the given size. Returns null when the
 *  markup contains no drawable geometry. */
export function svgToLayer(
  svgText: string,
  name: string,
  compW: number,
  compH: number,
): LottieLayer | null {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = parsed.querySelector("svg");
  if (!svg || parsed.querySelector("parsererror")) return null;

  const groups: Record<string, unknown>[] = [];

  const rootStyle: SvgStyle = {
    fill: null,
    fillOpacity: 1,
    fillRule: "nonzero",
    stroke: null,
    strokeOpacity: 1,
    strokeWidth: 1,
    linecap: "butt",
    linejoin: "miter",
    opacity: 1,
  };

  const walk = (el: Element, matrix: DOMMatrix, style: SvgStyle): void => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase();
      if (
        [
          "defs",
          "clippath",
          "mask",
          "symbol",
          "metadata",
          "title",
          "desc",
          "style",
        ].includes(tag)
      ) {
        continue;
      }
      const childMatrix = matrix.multiply(
        parseTransformAttr(child.getAttribute("transform")),
      );
      const childStyle = readStyle(child, style);
      if (tag === "g" || tag === "svg" || tag === "a") {
        walk(child, childMatrix, childStyle);
        continue;
      }

      let paths: BezierPathData[] = [];
      switch (tag) {
        case "path":
          paths = parsePathData(child.getAttribute("d") ?? "");
          break;
        case "rect": {
          const x = parseFloat(child.getAttribute("x") ?? "0");
          const y = parseFloat(child.getAttribute("y") ?? "0");
          const w = parseFloat(child.getAttribute("width") ?? "0");
          const h = parseFloat(child.getAttribute("height") ?? "0");
          let rx = parseFloat(child.getAttribute("rx") ?? "NaN");
          let ry = parseFloat(child.getAttribute("ry") ?? "NaN");
          if (Number.isNaN(rx)) rx = Number.isNaN(ry) ? 0 : ry;
          if (Number.isNaN(ry)) ry = rx;
          if (w > 0 && h > 0) paths = [rectPath(x, y, w, h, rx, ry)];
          break;
        }
        case "circle": {
          const r = parseFloat(child.getAttribute("r") ?? "0");
          if (r > 0) {
            paths = [
              ellipsePath(
                parseFloat(child.getAttribute("cx") ?? "0"),
                parseFloat(child.getAttribute("cy") ?? "0"),
                r,
                r,
              ),
            ];
          }
          break;
        }
        case "ellipse": {
          const rx = parseFloat(child.getAttribute("rx") ?? "0");
          const ry = parseFloat(child.getAttribute("ry") ?? "0");
          if (rx > 0 && ry > 0) {
            paths = [
              ellipsePath(
                parseFloat(child.getAttribute("cx") ?? "0"),
                parseFloat(child.getAttribute("cy") ?? "0"),
                rx,
                ry,
              ),
            ];
          }
          break;
        }
        case "polygon": {
          const data = pointsPath(child.getAttribute("points") ?? "", true);
          if (data) paths = [data];
          break;
        }
        case "polyline": {
          const data = pointsPath(child.getAttribute("points") ?? "", false);
          if (data) paths = [data];
          break;
        }
        case "line": {
          paths = [
            {
              v: [
                [
                  parseFloat(child.getAttribute("x1") ?? "0"),
                  parseFloat(child.getAttribute("y1") ?? "0"),
                ],
                [
                  parseFloat(child.getAttribute("x2") ?? "0"),
                  parseFloat(child.getAttribute("y2") ?? "0"),
                ],
              ],
              i: [
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
              ],
              c: false,
            },
          ];
          break;
        }
        default:
          continue;
      }

      if (paths.length === 0) continue;
      const baked = paths.map((data) => transformPathData(data, childMatrix));
      const scaleFactor =
        Math.sqrt(
          Math.abs(
            childMatrix.a * childMatrix.d - childMatrix.b * childMatrix.c,
          ),
        ) || 1;
      // Lines/polylines have no fill per spec.
      const effStyle =
        tag === "line" || tag === "polyline"
          ? { ...childStyle, fill: childStyle.fill ?? "none" }
          : childStyle;
      const group = buildGroup(
        child.getAttribute("id") || tag,
        baked,
        effStyle,
        scaleFactor,
      );
      if (group) groups.push(group);
    }
  };

  walk(svg, new DOMMatrix(), rootStyle);
  if (groups.length === 0) return null;

  // Bounds from the baked geometry (control points are a safe over-bound).
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const g of groups) {
    for (const item of (
      g as { it: Array<{ ty: string; ks?: { k: BezierPathData } }> }
    ).it) {
      if (item.ty !== "sh" || !item.ks) continue;
      const data = item.ks.k;
      data.v.forEach((pt, idx) => {
        for (const cand of [
          pt,
          [pt[0] + data.o[idx][0], pt[1] + data.o[idx][1]],
          [pt[0] + data.i[idx][0], pt[1] + data.i[idx][1]],
        ]) {
          minX = Math.min(minX, cand[0]);
          maxX = Math.max(maxX, cand[0]);
          minY = Math.min(minY, cand[1]);
          maxY = Math.max(maxY, cand[1]);
        }
      });
    }
  }
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  // Vectors scale losslessly — always normalize to ~60% of the comp so a
  // 24px Figma icon and a 2000px illustration both land at a useful size.
  const fit = (Math.min(compW, compH) * 0.6) / Math.max(bw, bh);

  return {
    ty: 4,
    nm: name,
    ip: 0,
    op: 0, // caller stretches to the doc range
    st: 0,
    sr: 1,
    ao: 0,
    bm: 0,
    ks: {
      o: staticVal(100),
      r: staticVal(0),
      p: staticVal([compW / 2, compH / 2, 0]),
      a: staticVal([minX + bw / 2, minY + bh / 2, 0]),
      s: staticVal([fit * 100, fit * 100, 100]),
    },
    shapes: groups,
  } as LottieLayer;
}

/** Insert an SVG as a new shape layer at the top of the stack. */
export function addSvgLayer(
  draft: LottieDoc,
  svgText: string,
  name: string,
): boolean {
  const layer = svgToLayer(svgText, name, draft.w, draft.h);
  if (!layer) return false;
  layer.ip = draft.ip;
  layer.op = draft.op;
  layer.ind = Math.max(0, ...draft.layers.map((l) => l.ind ?? 0)) + 1;
  draft.layers.unshift(layer);
  return true;
}
