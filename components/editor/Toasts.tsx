"use client";

import { AlertCircle, Info, X } from "lucide-react";

import { useEditor } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Toasts() {
  const toasts = useEditor((s) => s.toasts);
  const dismiss = useEditor((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-panel border px-3 py-2 text-xs shadow-lg backdrop-blur",
            t.kind === "error"
              ? "border-destructive/50 bg-destructive/15 text-foreground"
              : "border-border bg-card/95 text-foreground",
          )}
        >
          {t.kind === "error" ? (
            <AlertCircle size={14} className="shrink-0 text-destructive" />
          ) : (
            <Info size={14} className="shrink-0 text-primary" />
          )}
          <span className="max-w-72">{t.message}</span>
          <button
            type="button"
            className="ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => dismiss(t.id)}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
