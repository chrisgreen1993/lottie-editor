import { useState } from "react";
import { Layers, Trash2, Eye, EyeOff } from "lucide-react";
import { LayerInfo } from "@/lib/animation";
import { ShapeItem } from "./ShapeItem";
import { SidebarItem } from "./SidebarItem";
import { Button } from "./ui/Button";
import { useAnimation } from "@/lib/hooks/useAnimation";

interface LayerListProps {
  layer: LayerInfo;
  depth?: number;
}

export const LayerItem = ({ layer, depth = 0 }: LayerListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { deleteLayer, toggleLayerHidden, hoveredShapePaths } = useAnimation();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only allow delete for top-level layers
    const topLevelIndexMatch = layer.path.match(/^layers\.(\d+)$/);
    if (topLevelIndexMatch) {
      deleteLayer(parseInt(topLevelIndexMatch[1], 10));
    }
  };

  const handleToggleHidden = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLayerHidden(layer.path);
  };

  return (
    <div className="flex flex-col gap-2" style={{ paddingLeft: `${depth}rem` }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SidebarItem
            text={layer.name}
            onClick={() => setIsExpanded(!isExpanded)}
            className={
              hoveredShapePaths.some((p) => p.startsWith(layer.path + "."))
                ? "ring-2 ring-primary"
                : undefined
            }
          >
            <Layers className="h-4 w-4" />
          </SidebarItem>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleHidden}
            className="h-8 w-8"
            title={layer.hidden ? "Unhide" : "Hide"}
          >
            {layer.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          {/* Allow delete only for top-level layers */}
          {/^layers\.[0-9]+$/.test(layer.path) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
              title={`Delete ${layer.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {isExpanded && (
        <>
          {Array.isArray(layer.childrenLayers) && layer.childrenLayers.length > 0
            ? layer.childrenLayers.map((child, i) => (
                <LayerItem key={i} layer={child} depth={depth + 1} />
              ))
            : layer.shapes.map((shape, i) => <ShapeItem key={i} shape={shape} />)}
        </>
      )}
    </div>
  );
};
