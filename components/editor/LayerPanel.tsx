"use client";

import {
  ArrowDown,
  ArrowUp,
  Box,
  Copy,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Layers,
  Music,
  Shapes,
  Square,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import * as React from "react";

import { layerName, type LottieLayer } from "@/lib/lottie/model";
import {
  deleteLayer,
  duplicateLayer,
  moveLayer,
  renameLayer,
  toggleLayerVisibility,
} from "@/lib/lottie/ops";
import { useEditor } from "@/lib/store";
import { cn } from "@/lib/utils";

function LayerIcon({ ty }: { ty: number }) {
  const size = 13;
  switch (ty) {
    case 0:
      return <Film size={size} />;
    case 1:
      return <Square size={size} />;
    case 2:
      return <ImageIcon size={size} />;
    case 3:
      return <Box size={size} />;
    case 4:
      return <Shapes size={size} />;
    case 5:
      return <Type size={size} />;
    case 6:
      return <Music size={size} />;
    case 13:
      return <Video size={size} />;
    default:
      return <Layers size={size} />;
  }
}

function LayerRow({
  layer,
  index,
  total,
}: {
  layer: LottieLayer;
  index: number;
  total: number;
}) {
  const selected = useEditor((s) => s.selectedLayer) === index;
  const selectLayer = useEditor((s) => s.selectLayer);
  const update = useEditor((s) => s.update);
  const [editing, setEditing] = React.useState(false);
  const [nameText, setNameText] = React.useState("");
  const [dropEdge, setDropEdge] = React.useState<"above" | "below" | null>(
    null,
  );

  const name = layerName(layer, index);
  const hidden = layer.hd === true;

  const commitRename = () => {
    setEditing(false);
    const trimmed = nameText.trim();
    if (trimmed && trimmed !== name) {
      update((draft) => renameLayer(draft, index, trimmed));
    }
  };

  return (
    <div
      className={cn(
        "group relative flex h-8 cursor-pointer select-none items-center gap-1.5 border-b border-border/50 px-2 text-xs transition-colors",
        selected ? "bg-primary text-on-fill" : "hover:bg-accent/60",
        hidden && "opacity-50",
        dropEdge === "above" && "shadow-[inset_0_2px_0_hsl(var(--primary))]",
        dropEdge === "below" && "shadow-[inset_0_-2px_0_hsl(var(--primary))]",
      )}
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-layer-index", String(index));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("application/x-layer-index")) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setDropEdge(e.clientY < rect.top + rect.height / 2 ? "above" : "below");
      }}
      onDragLeave={() => setDropEdge(null)}
      onDrop={(e) => {
        e.preventDefault();
        const from = Number(
          e.dataTransfer.getData("application/x-layer-index"),
        );
        const edge = dropEdge;
        setDropEdge(null);
        if (!Number.isInteger(from) || from === index) return;
        let to = edge === "below" ? index + 1 : index;
        if (from < to) to -= 1; // account for the removal shifting indices
        update((draft) => moveLayer(draft, from, to));
        selectLayer(to);
      }}
      onClick={() => selectLayer(selected ? null : index)}
      onDoubleClick={() => {
        setNameText(name);
        setEditing(true);
      }}
    >
      <button
        type="button"
        title={hidden ? "Show layer" : "Hide layer"}
        className={cn(
          "shrink-0",
          selected
            ? "text-on-fill/80 hover:text-on-fill"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={(e) => {
          e.stopPropagation();
          update((draft) => toggleLayerVisibility(draft, index));
        }}
      >
        {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <span
        className={cn(
          "shrink-0",
          selected ? "text-on-fill" : "text-muted-foreground",
        )}
      >
        <LayerIcon ty={layer.ty} />
      </span>

      {editing ? (
        <input
          autoFocus
          className="h-5 min-w-0 flex-1 rounded-md bg-background px-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={nameText}
          onChange={(e) => setNameText(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <span
          className="min-w-0 flex-1 truncate"
          title={`${name} — double-click to rename`}
        >
          {name}
        </span>
      )}

      <div
        className={cn(
          "hidden shrink-0 items-center gap-0.5 group-hover:flex",
          selected && "flex",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title="Move up"
          disabled={index === 0}
          className={cn(
            "rounded p-0.5 disabled:opacity-30",
            selected
              ? "text-on-fill/80 hover:text-on-fill"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => update((draft) => moveLayer(draft, index, index - 1))}
        >
          <ArrowUp size={12} />
        </button>
        <button
          type="button"
          title="Move down"
          disabled={index === total - 1}
          className={cn(
            "rounded p-0.5 disabled:opacity-30",
            selected
              ? "text-on-fill/80 hover:text-on-fill"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => update((draft) => moveLayer(draft, index, index + 1))}
        >
          <ArrowDown size={12} />
        </button>
        <button
          type="button"
          title="Duplicate layer"
          className={cn(
            "rounded p-0.5",
            selected
              ? "text-on-fill/80 hover:text-on-fill"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => update((draft) => duplicateLayer(draft, index))}
        >
          <Copy size={12} />
        </button>
        <button
          type="button"
          title="Delete layer"
          className={cn(
            "rounded p-0.5",
            selected
              ? "text-on-fill/80 hover:text-on-fill"
              : "text-muted-foreground hover:text-destructive",
          )}
          onClick={() => update((draft) => deleteLayer(draft, index))}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function LayerPanel() {
  const doc = useEditor((s) => s.doc);
  const width = useEditor((s) => s.panels.layerPanelW);
  if (!doc) return null;

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-card"
      style={{ width }}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <Layers size={13} className="text-muted-foreground" />
        <span className="text-xs font-semibold">Layers</span>
        <span className="ml-auto text-meta tabular-nums text-muted-foreground">
          {doc.layers.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {doc.layers.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No layers yet — draw something with the shape tools on the canvas.
          </p>
        ) : (
          doc.layers.map((layer, i) => (
            <LayerRow
              key={`${layer.ind ?? "x"}-${i}`}
              layer={layer}
              index={i}
              total={doc.layers.length}
            />
          ))
        )}
      </div>
    </aside>
  );
}
