"use client";

import {
  Clapperboard,
  FilePlus2,
  FolderOpen,
  Globe,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import * as React from "react";

import { blankDoc } from "@/lib/lottie/create";
import { parseLottie } from "@/lib/lottie/model";
import { useEditor } from "@/lib/store";
import { cn } from "@/lib/utils";

export function EmptyState({
  onOpenFile,
  dragActive,
}: {
  onOpenFile: () => void;
  dragActive: boolean;
}) {
  const loadDoc = useEditor((s) => s.loadDoc);
  const toast = useEditor((s) => s.toast);
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState<"example" | "url" | null>(null);

  const loadFromText = (text: string, name: string) => {
    const result = parseLottie(text);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    loadDoc(result.doc, name);
  };

  const loadExample = async () => {
    setLoading("example");
    try {
      const res = await fetch("/example-animation.json");
      loadFromText(await res.text(), "example-animation");
    } catch {
      toast("Couldn't load the example animation", "error");
    } finally {
      setLoading(null);
    }
  };

  const loadFromUrl = async () => {
    const target = url.trim();
    if (!target) return;
    setLoading("url");
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error();
      const name =
        new URL(target).pathname
          .split("/")
          .pop()
          ?.replace(/\.json$/i, "") || "animation";
      loadFromText(await res.text(), name);
    } catch {
      toast("Couldn't fetch that URL (check CORS and the address)", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Clapperboard size={28} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lottie Editor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect, restyle, retime and export Lottie animations — right in
            your browser.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenFile}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-card",
            dragActive && "border-primary bg-primary/10",
          )}
        >
          <UploadCloud size={28} className="text-muted-foreground" />
          <span className="text-sm font-medium">
            {dragActive
              ? "Drop to open"
              : "Drop a Lottie .json or .svg anywhere"}
          </span>
          <span className="text-xs text-muted-foreground">
            click to browse — or paste an SVG straight from Figma (⌘V)
          </span>
        </button>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={loadExample}
            disabled={loading !== null}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {loading === "example" ? "Loading…" : "Try the example"}
          </button>
          <button
            type="button"
            onClick={onOpenFile}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <FolderOpen size={14} />
            Browse files
          </button>
          <button
            type="button"
            onClick={() => loadDoc(blankDoc(), "untitled")}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <FilePlus2 size={14} />
            Start blank
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Globe
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-9 w-full rounded-lg bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="https://… link to a Lottie JSON"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadFromUrl();
              }}
            />
          </div>
          <button
            type="button"
            onClick={loadFromUrl}
            disabled={!url.trim() || loading !== null}
            className="h-9 rounded-md bg-secondary px-4 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          >
            {loading === "url" ? "Loading…" : "Load"}
          </button>
        </div>
      </div>
    </div>
  );
}
