import { create } from "zustand";

import type { LottieDoc } from "./lottie/model";
import type { Path } from "./lottie/ops";
import { clearSession, saveSession } from "./persistence";

const HISTORY_LIMIT = 60;
const COALESCE_WINDOW_MS = 900;

export type CanvasBackground = "checker" | "dark" | "light" | "doc";
export type Zoom = number | "fit";
export type CanvasTool = "select" | "rect" | "ellipse" | "star" | "pen";
export type EditorMode = "design" | "animate";

export interface PanelSizes {
  layerPanelW: number;
  inspectorW: number;
  timelineH: number;
}

const UI_KEY = "lottie-editor:ui";
const PANEL_LIMITS: Record<keyof PanelSizes, [number, number]> = {
  layerPanelW: [180, 420],
  inspectorW: [240, 460],
  timelineH: [160, 520],
};

function loadPanelSizes(): PanelSizes {
  const defaults: PanelSizes = {
    layerPanelW: 240,
    inspectorW: 288,
    timelineH: 256,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(UI_KEY) ?? "{}");
    for (const key of Object.keys(defaults) as (keyof PanelSizes)[]) {
      const [min, max] = PANEL_LIMITS[key];
      if (typeof saved[key] === "number") {
        defaults[key] = Math.max(min, Math.min(max, saved[key]));
      }
    }
  } catch {
    // corrupted UI state — fall back to defaults
  }
  return defaults;
}

export interface Toast {
  id: number;
  message: string;
  kind: "info" | "error";
}

interface UpdateOptions {
  /** Consecutive updates sharing a key within a short window collapse into
   *  one history entry (e.g. color-picker drags, timeline trims). */
  coalesceKey?: string;
}

export interface KeyframeSelection {
  /** Path from the doc root to the animated property object. */
  path: Path;
  index: number;
  layer: number;
  label: string;
}

export function keyframeSelectionId(sel: {
  path: Path;
  index: number;
}): string {
  return `${sel.path.join(".")}:${sel.index}`;
}

interface EditorState {
  doc: LottieDoc | null;
  fileName: string;
  selectedLayer: number | null;
  /** Multi-selection; the first entry is the "primary" keyframe. */
  selectedKeyframes: KeyframeSelection[];
  /** Frame highlighted while a shift-drag snap is engaged, else null. */
  snapGuide: number | null;
  /** Timeline rows show the value graph of the selected track. */
  graphMode: boolean;
  /** Layer whose path vertices are being edited on canvas, or null. */
  pathEdit: number | null;
  /** Design: canvas-first, no timeline. Animate: timeline + keyframes. */
  editorMode: EditorMode;

  past: LottieDoc[];
  future: LottieDoc[];
  lastCoalesceKey: string | null;
  lastCommitAt: number;

  isPlaying: boolean;
  currentFrame: number;
  loop: boolean;
  speed: number;

  zoom: Zoom;
  canvasBg: CanvasBackground;
  tool: CanvasTool;
  panels: PanelSizes;

  toasts: Toast[];

  loadDoc: (doc: LottieDoc, fileName: string) => void;
  closeDoc: () => void;
  setFileName: (name: string) => void;
  update: (mutator: (draft: LottieDoc) => void, opts?: UpdateOptions) => void;
  undo: () => void;
  redo: () => void;
  selectLayer: (index: number | null) => void;
  selectKeyframe: (selection: KeyframeSelection | null) => void;
  toggleKeyframe: (selection: KeyframeSelection) => void;
  setSnapGuide: (frame: number | null) => void;
  setGraphMode: (on: boolean) => void;
  setPathEdit: (layer: number | null) => void;
  setEditorMode: (mode: EditorMode) => void;

  setPlaying: (playing: boolean) => void;
  setCurrentFrame: (frame: number) => void;
  setLoop: (loop: boolean) => void;
  setSpeed: (speed: number) => void;

  setZoom: (zoom: Zoom) => void;
  setCanvasBg: (bg: CanvasBackground) => void;
  setTool: (tool: CanvasTool) => void;
  setPanelSize: (key: keyof PanelSizes, px: number) => void;

  toast: (message: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(doc: LottieDoc, fileName: string): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveSession(doc, fileName), 800);
}

export const useEditor = create<EditorState>((set, get) => ({
  doc: null,
  fileName: "animation",
  selectedLayer: null,
  selectedKeyframes: [],
  snapGuide: null,
  graphMode: false,
  pathEdit: null,
  editorMode: "animate",

  past: [],
  future: [],
  lastCoalesceKey: null,
  lastCommitAt: 0,

  isPlaying: false,
  currentFrame: 0,
  loop: true,
  speed: 1,

  zoom: "fit",
  canvasBg: "checker",
  tool: "select",
  panels: loadPanelSizes(),

  toasts: [],

  loadDoc: (doc, fileName) => {
    set({
      doc,
      fileName: fileName.replace(/\.(json|lottie)$/i, "") || "animation",
      selectedLayer: null,
      selectedKeyframes: [],
      graphMode: false,
      pathEdit: null,
      // A blank composition starts in design mode; real animations open
      // ready to play.
      editorMode: doc.layers.length === 0 ? "design" : "animate",
      past: [],
      future: [],
      lastCoalesceKey: null,
      isPlaying: doc.layers.length > 0,
      currentFrame: doc.ip,
      zoom: "fit",
    });
    scheduleSave(doc, get().fileName);
  },

  closeDoc: () => {
    clearSession();
    set({
      doc: null,
      fileName: "animation",
      selectedLayer: null,
      selectedKeyframes: [],
      graphMode: false,
      pathEdit: null,
      past: [],
      future: [],
      lastCoalesceKey: null,
      isPlaying: false,
      currentFrame: 0,
    });
  },

  setFileName: (name) => {
    set({ fileName: name });
    const { doc } = get();
    if (doc) scheduleSave(doc, name);
  },

  update: (mutator, opts) => {
    const {
      doc,
      past,
      lastCoalesceKey,
      lastCommitAt,
      fileName,
      selectedLayer,
    } = get();
    if (!doc) return;
    const next = structuredClone(doc);
    mutator(next);

    const now = Date.now();
    const coalesce =
      !!opts?.coalesceKey &&
      opts.coalesceKey === lastCoalesceKey &&
      now - lastCommitAt < COALESCE_WINDOW_MS;

    set({
      doc: next,
      past: coalesce ? past : [...past.slice(-(HISTORY_LIMIT - 1)), doc],
      future: [],
      lastCoalesceKey: opts?.coalesceKey ?? null,
      lastCommitAt: now,
      selectedLayer:
        selectedLayer !== null && selectedLayer >= next.layers.length
          ? next.layers.length
            ? next.layers.length - 1
            : null
          : selectedLayer,
    });
    scheduleSave(next, fileName);
  },

  undo: () => {
    const { doc, past, future, fileName } = get();
    if (!doc || past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      doc: previous,
      past: past.slice(0, -1),
      future: [doc, ...future].slice(0, HISTORY_LIMIT),
      lastCoalesceKey: null,
      selectedLayer: null,
      selectedKeyframes: [],
      pathEdit: null,
    });
    scheduleSave(previous, fileName);
  },

  redo: () => {
    const { doc, past, future, fileName } = get();
    if (!doc || future.length === 0) return;
    const [next, ...rest] = future;
    set({
      doc: next,
      past: [...past.slice(-(HISTORY_LIMIT - 1)), doc],
      future: rest,
      lastCoalesceKey: null,
      selectedLayer: null,
      selectedKeyframes: [],
      pathEdit: null,
    });
    scheduleSave(next, fileName);
  },

  selectLayer: (index) => set({ selectedLayer: index, selectedKeyframes: [] }),
  selectKeyframe: (selection) =>
    set(
      selection
        ? { selectedKeyframes: [selection], selectedLayer: selection.layer }
        : { selectedKeyframes: [] },
    ),
  toggleKeyframe: (selection) => {
    const { selectedKeyframes } = get();
    const id = keyframeSelectionId(selection);
    const existing = selectedKeyframes.filter(
      (s) => keyframeSelectionId(s) !== id,
    );
    set(
      existing.length < selectedKeyframes.length
        ? { selectedKeyframes: existing }
        : {
            selectedKeyframes: [...selectedKeyframes, selection],
            selectedLayer: selection.layer,
          },
    );
  },
  setSnapGuide: (snapGuide) => set({ snapGuide }),
  setGraphMode: (graphMode) => set({ graphMode }),
  setPathEdit: (pathEdit) => set({ pathEdit }),

  setEditorMode: (editorMode) => {
    if (get().editorMode === editorMode) return;
    if (editorMode === "design") {
      // Design mode is canvas-first: park playback.
      set({ editorMode, isPlaying: false });
    } else {
      // Drawing happens in design mode; animate keeps the select tool.
      set({ editorMode, tool: "select" });
    }
  },

  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setLoop: (loop) => set({ loop }),
  setSpeed: (speed) => set({ speed }),

  setZoom: (zoom) => set({ zoom }),
  setCanvasBg: (canvasBg) => set({ canvasBg }),
  setTool: (tool) => set({ tool }),

  setPanelSize: (key, px) => {
    const [min, max] = PANEL_LIMITS[key];
    const panels = {
      ...get().panels,
      [key]: Math.round(Math.max(min, Math.min(max, px))),
    };
    set({ panels });
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(panels));
    } catch {
      // best-effort persistence
    }
  },

  toast: (message, kind = "info") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
