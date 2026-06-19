#!/usr/bin/env node
/* eslint-disable */
/**
 * token-audit.js — flag hardcoded visual values in CSS that should be tokens.
 *
 * Scans every .css file under app/ and components/ EXCEPT the token
 * definition layer (tokens.css), where raw values are allowed to live.
 *
 *   node scripts/token-audit.js            # audit the project
 *   node scripts/token-audit.js path.css   # audit specific files
 *
 * Exit code 1 if any ERROR-level violations are found (CI-ready).
 * Errors:   hardcoded hex/rgb colors, raw px/rem spacing & radii.
 * Warnings: raw motion durations and values with no clear token match.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TOKEN_FILE = "tokens.css"; // the definition layer — exempt

// --- Suggestion map: raw value -> recommended token --------------------------
const SUGGEST = {
  // colors
  "#2a2a2e": "var(--color-checker-base)",
  "#3a3a40": "var(--color-checker-tile)",
  "#18181b": "var(--color-canvas-dark)",
  "#fafafa": "var(--color-canvas-light)",
  "#ffffff": "var(--color-on-fill)",
  "#fbbf24": "var(--color-keyframe)",
  // spacing (px)
  "0px": "var(--space-none)",
  "2px": "var(--space-3xs) / var(--size-scrollbar-border)",
  "4px": "var(--space-2xs)",
  "8px": "var(--space-xs)",
  "12px": "var(--space-sm)",
  "16px": "var(--space-md)",
  "24px": "var(--space-lg)",
  "32px": "var(--space-xl)",
  "48px": "var(--space-2xl)",
  // component sizes
  "10px": "var(--size-scrollbar)",
  "5px": "var(--size-scrollbar-radius)",
  "14px": "var(--size-colorpicker-pointer)",
  "176px": "var(--size-track-label)",
  "196px": "var(--size-colorpicker-w)",
  "160px": "var(--size-colorpicker-h)",
  // radius (rem)
  "0.5rem": "var(--radius)",
};

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /\brgba?\([^)]*\)/g;
const LEN_RE = /(?<![\w.#-])-?\d*\.?\d+(px|rem)\b/g;
const DUR_RE = /(?<![\w.#-])\d*\.?\d+m?s\b/g;

function collectCssFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectCssFiles(full, out);
    else if (entry.name.endsWith(".css") && entry.name !== TOKEN_FILE) {
      out.push(full);
    }
  }
}

function lineIsExempt(line) {
  const trimmed = line.trim();
  // comments and the @import of the token layer
  return (
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("@import")
  );
}

function suggestionFor(raw) {
  return SUGGEST[raw.toLowerCase()] || SUGGEST[raw] || null;
}

const violations = [];
function record(level, file, lineNo, raw, message) {
  violations.push({
    level,
    file: path.relative(ROOT, file),
    lineNo,
    raw,
    suggestion: suggestionFor(raw),
    message,
  });
}

function auditFile(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (lineIsExempt(line)) return;
    const lineNo = i + 1;
    const code = line.replace(/\/\*.*?\*\//g, ""); // strip inline comments

    for (const m of code.matchAll(HEX_RE)) {
      record("error", file, lineNo, m[0], "hardcoded hex color");
    }
    for (const m of code.matchAll(RGB_RE)) {
      // rgb()/rgba() that wrap a var() (e.g. shadow tokens) are fine; flag literals
      if (!m[0].includes("var(")) {
        record("error", file, lineNo, m[0], "hardcoded rgb/rgba color");
      }
    }
    for (const m of code.matchAll(LEN_RE)) {
      // Allow values that are part of a var() fallback or calc on a token.
      const idx = m.index ?? 0;
      const ctx = code.slice(Math.max(0, idx - 20), idx);
      if (ctx.includes("var(--") || ctx.includes("calc(")) continue;
      record(
        "error",
        file,
        lineNo,
        m[0],
        `raw ${m[1]} length (spacing/size/radius)`,
      );
    }
    for (const m of code.matchAll(DUR_RE)) {
      const idx = m.index ?? 0;
      const ctx = code.slice(Math.max(0, idx - 20), idx);
      if (ctx.includes("var(--")) continue;
      record("warn", file, lineNo, m[0], "raw motion duration");
    }
  });
}

// --- main --------------------------------------------------------------------
const argFiles = process.argv.slice(2);
const files = argFiles.length
  ? argFiles.map((f) => path.resolve(f))
  : (() => {
      const out = [];
      for (const d of ["app", "components"]) {
        const dir = path.join(ROOT, d);
        if (fs.existsSync(dir)) collectCssFiles(dir, out);
      }
      return out;
    })();

files.forEach(auditFile);

const errors = violations.filter((v) => v.level === "error");
const warnings = violations.filter((v) => v.level === "warn");

const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

console.log(C.bold(`\nToken audit — scanned ${files.length} CSS file(s)\n`));

if (violations.length === 0) {
  console.log(C.green("✓ Zero violations. Every value references a token.\n"));
  process.exit(0);
}

for (const v of violations) {
  const tag = v.level === "error" ? C.red("ERROR") : C.yellow("WARN ");
  const loc = C.dim(`${v.file}:${v.lineNo}`);
  const fix = v.suggestion
    ? `→ use ${C.green(v.suggestion)}`
    : C.dim("→ add a token in tokens.css");
  console.log(`${tag} ${loc}  ${C.bold(v.raw)}  (${v.message})  ${fix}`);
}

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).\n`);
process.exit(errors.length > 0 ? 1 : 0);
