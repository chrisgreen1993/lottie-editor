"use client";

import * as React from "react";

import { CanvasStage } from "@/components/editor/CanvasStage";
import { EmptyState } from "@/components/editor/EmptyState";
import { Inspector } from "@/components/editor/Inspector";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { ResizeHandle } from "@/components/editor/ResizeHandle";
import { Timeline } from "@/components/editor/Timeline";
import { Toasts } from "@/components/editor/Toasts";
import { TopBar } from "@/components/editor/TopBar";
import { blankDoc } from "@/lib/lottie/create";
import { deleteKeyframes } from "@/lib/lottie/keyframes";
import { parseLottie } from "@/lib/lottie/model";
import { deleteLayer, duplicateLayer } from "@/lib/lottie/ops";
import { svgToLayer } from "@/lib/lottie/svgImport";
import { loadSession } from "@/lib/persistence";
import { playerBridge } from "@/lib/playerBridge";
import { useEditor } from "@/lib/store";

function PanelDivider({
  panel,
  grow,
}: {
  panel: "layerPanelW" | "inspectorW";
  grow: 1 | -1;
}) {
  const setPanelSize = useEditor((s) => s.setPanelSize);
  const startRef = React.useRef(0);
  return (
    <ResizeHandle
      orientation="vertical"
      onStart={() => {
        startRef.current = useEditor.getState().panels[panel];
      }}
      onDrag={(dx) => setPanelSize(panel, startRef.current + grow * dx)}
    />
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function Editor() {
  const doc = useEditor((s) => s.doc);
  const editorMode = useEditor((s) => s.editorMode);
  const loadDoc = useEditor((s) => s.loadDoc);
  const toast = useEditor((s) => s.toast);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const dragDepth = React.useRef(0);

  // Restore the previous session once on mount.
  React.useEffect(() => {
    if (useEditor.getState().doc) return;
    const saved = loadSession();
    if (saved) {
      loadDoc(saved.doc, saved.fileName);
      toast("Restored your previous session");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openText = React.useCallback(
    (text: string, name: string) => {
      const result = parseLottie(text);
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      loadDoc(result.doc, name);
    },
    [loadDoc, toast],
  );

  /** Import SVG markup as a new shape layer (creating a blank composition
   *  first when nothing is open). */
  const openSvgText = React.useCallback(
    (text: string, name: string) => {
      const cleanName = name.replace(/\.svg$/i, "") || "svg";
      const state = useEditor.getState();
      if (!state.doc) state.loadDoc(blankDoc(), cleanName);
      const doc = useEditor.getState().doc!;
      const layer = svgToLayer(text, cleanName, doc.w, doc.h);
      if (!layer) {
        toast("No drawable shapes found in that SVG", "error");
        return;
      }
      useEditor.getState().update((draft) => {
        layer.ip = draft.ip;
        layer.op = draft.op;
        layer.ind = Math.max(0, ...draft.layers.map((l) => l.ind ?? 0)) + 1;
        draft.layers.unshift(layer);
      });
      useEditor.getState().selectLayer(0);
      toast(`Imported “${cleanName}” as a shape layer`);
    },
    [toast],
  );

  const openFile = React.useCallback(
    (file: File) => {
      const isSvg = /\.svg$/i.test(file.name) || file.type === "image/svg+xml";
      file
        .text()
        .then((text) =>
          isSvg ? openSvgText(text, file.name) : openText(text, file.name),
        )
        .catch(() => toast("Couldn't read that file", "error"));
    },
    [openText, openSvgText, toast],
  );

  // Paste SVG markup (e.g. Figma's "Copy as SVG") or SVG files anywhere.
  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (/<svg[\s>]/i.test(text)) {
        e.preventDefault();
        openSvgText(text, "pasted-svg");
        return;
      }
      const file = Array.from(e.clipboardData?.files ?? []).find(
        (f) => /\.svg$/i.test(f.name) || f.type === "image/svg+xml",
      );
      if (file) {
        e.preventDefault();
        file
          .text()
          .then((t) => openSvgText(t, file.name))
          .catch(() => toast("Couldn't read the pasted SVG", "error"));
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openSvgText, toast]);

  // Keyboard shortcuts.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const state = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (!state.doc) return;

      if (e.key === "Tab") {
        // Rive-style: Tab flips between Design and Animate.
        e.preventDefault();
        state.setEditorMode(
          state.editorMode === "design" ? "animate" : "design",
        );
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        state.setPlaying(!state.isPlaying);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 10 : 1);
        const frame = Math.max(
          state.doc.ip,
          Math.min(state.doc.op, Math.round(state.currentFrame) + step),
        );
        state.setPlaying(false);
        state.setCurrentFrame(frame);
        playerBridge.seek(frame, false);
        return;
      }
      if (mod && e.key.toLowerCase() === "d" && state.selectedLayer !== null) {
        e.preventDefault();
        const index = state.selectedLayer;
        state.update((draft) => duplicateLayer(draft, index));
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        // Path editing owns Backspace (vertex deletion) while active.
        if (state.pathEdit !== null) return;
        // Selected keyframes take precedence over the selected layer.
        if (state.selectedKeyframes.length > 0) {
          e.preventDefault();
          const refs = state.selectedKeyframes;
          state.update((draft) => deleteKeyframes(draft, refs));
          state.selectKeyframe(null);
          return;
        }
        if (state.selectedLayer !== null) {
          e.preventDefault();
          const index = state.selectedLayer;
          state.update((draft) => deleteLayer(draft, index));
          state.selectLayer(null);
          return;
        }
      }
      if (e.key === "Escape") {
        if (state.pathEdit !== null) state.setPathEdit(null);
        else if (state.tool !== "select") state.setTool("select");
        else if (state.selectedKeyframes.length) state.selectKeyframe(null);
        else state.selectLayer(null);
        return;
      }
      // Tool shortcuts (no modifier). Picking a drawing tool from animate
      // mode hops over to design mode first.
      if (!mod && !e.altKey) {
        const tool = {
          v: "select",
          r: "rect",
          e: "ellipse",
          s: "star",
          p: "pen",
        }[e.key.toLowerCase()];
        if (tool) {
          if (tool !== "select" && state.editorMode === "animate") {
            state.setEditorMode("design");
          }
          state.setTool(tool as Parameters<typeof state.setTool>[0]);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // App-wide drag & drop.
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) openFile(file);
  };

  return (
    <div
      className="flex h-screen flex-col gap-1 overflow-hidden bg-background p-1 text-foreground"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragActive(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.svg,application/json,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openFile(file);
          e.target.value = "";
        }}
      />

      <TopBar onOpenFile={() => fileInputRef.current?.click()} />

      {doc ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <div className="flex min-h-0 flex-1">
            <LayerPanel />
            <PanelDivider panel="layerPanelW" grow={1} />
            <CanvasStage />
            <PanelDivider panel="inspectorW" grow={-1} />
            <Inspector />
          </div>
          {editorMode === "animate" && <Timeline />}
        </div>
      ) : (
        <EmptyState
          onOpenFile={() => fileInputRef.current?.click()}
          dragActive={dragActive}
        />
      )}

      {dragActive && doc && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="rounded-xl border-2 border-dashed border-primary bg-card px-8 py-6 text-sm font-medium">
            Drop a Lottie .json to replace · an .svg adds a layer
          </div>
        </div>
      )}

      <Toasts />
    </div>
  );
}
