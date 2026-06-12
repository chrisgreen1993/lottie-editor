"use client";

import {
  Clapperboard,
  Copy,
  Download,
  FileJson,
  FolderOpen,
  Package,
  Redo2,
  Undo2,
  X,
} from "lucide-react";
import * as React from "react";

import { IconButton } from "@/components/editor/fields";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { copyJson, downloadDotLottie, downloadJson } from "@/lib/exporters";
import { useEditor, type EditorMode } from "@/lib/store";
import { cn } from "@/lib/utils";

function ModeSwitcher() {
  const mode = useEditor((s) => s.editorMode);
  const setEditorMode = useEditor((s) => s.setEditorMode);
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
      title="Switch between Design and Animate (Tab)"
    >
      {(["design", "animate"] as EditorMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setEditorMode(m)}
          className={cn(
            "rounded-md px-3.5 py-1 text-xs font-medium capitalize transition-colors",
            mode === m
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export function TopBar({ onOpenFile }: { onOpenFile: () => void }) {
  const doc = useEditor((s) => s.doc);
  const fileName = useEditor((s) => s.fileName);
  const setFileName = useEditor((s) => s.setFileName);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const closeDoc = useEditor((s) => s.closeDoc);
  const toast = useEditor((s) => s.toast);

  const [exportOpen, setExportOpen] = React.useState(false);

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      {doc && (
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <ModeSwitcher />
        </div>
      )}
      <div className="flex items-center gap-2 text-primary">
        <Clapperboard size={18} />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Lottie Editor
        </span>
      </div>

      {doc && (
        <>
          <div className="mx-2 h-5 w-px bg-border" />
          <input
            className="h-7 w-48 rounded border border-transparent bg-transparent px-2 text-xs text-foreground hover:border-input focus-visible:border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={fileName}
            title="File name"
            onChange={(e) => setFileName(e.target.value)}
          />

          <div className="ml-2 flex items-center gap-0.5">
            <IconButton label="Undo (⌘Z)" disabled={!canUndo} onClick={undo}>
              <Undo2 size={15} />
            </IconButton>
            <IconButton label="Redo (⇧⌘Z)" disabled={!canRedo} onClick={redo}>
              <Redo2 size={15} />
            </IconButton>
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenFile}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <FolderOpen size={14} />
          Open
        </button>

        {doc && (
          <>
            <Popover open={exportOpen} onOpenChange={setExportOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download size={14} />
                  Export
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1.5">
                <ExportItem
                  icon={<FileJson size={14} />}
                  label="Lottie JSON"
                  hint=".json"
                  onClick={() => {
                    downloadJson(doc, fileName, true);
                    setExportOpen(false);
                  }}
                />
                <ExportItem
                  icon={<FileJson size={14} />}
                  label="Minified JSON"
                  hint="smallest"
                  onClick={() => {
                    downloadJson(doc, fileName, false);
                    setExportOpen(false);
                  }}
                />
                <ExportItem
                  icon={<Package size={14} />}
                  label="dotLottie"
                  hint=".lottie"
                  onClick={() => {
                    downloadDotLottie(doc, fileName);
                    setExportOpen(false);
                  }}
                />
                <ExportItem
                  icon={<Copy size={14} />}
                  label="Copy JSON to clipboard"
                  onClick={async () => {
                    try {
                      await copyJson(doc);
                      toast("Animation JSON copied to clipboard");
                    } catch {
                      toast("Couldn't access the clipboard", "error");
                    }
                    setExportOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <IconButton
              label="Close file"
              onClick={() => {
                if (
                  window.confirm(
                    "Close this animation? Unsaved exports will be lost.",
                  )
                ) {
                  closeDoc();
                }
              }}
            >
              <X size={15} />
            </IconButton>
          </>
        )}
      </div>
    </header>
  );
}

function ExportItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      )}
    </button>
  );
}
