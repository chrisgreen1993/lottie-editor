"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Thin draggable divider for resizing panels.
 *  Reports cumulative pointer deltas from the drag start; the caller
 *  combines them with the size captured in onStart. */
export function ResizeHandle({
  orientation,
  onStart,
  onDrag,
  className,
}: {
  orientation: "vertical" | "horizontal";
  onStart: () => void;
  onDrag: (dx: number, dy: number) => void;
  className?: string;
}) {
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    onStart();
    const startX = e.clientX;
    const startY = e.clientY;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can lack an active id.
    }
    const onMove = (ev: PointerEvent) =>
      onDrag(ev.clientX - startX, ev.clientY - startY);
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "z-20 shrink-0 bg-transparent transition-colors hover:bg-primary/50 active:bg-primary",
        orientation === "vertical"
          ? "w-1 cursor-col-resize"
          : "h-1 cursor-row-resize",
        className,
      )}
      onPointerDown={onPointerDown}
    />
  );
}
