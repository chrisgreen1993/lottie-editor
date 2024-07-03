import { useState } from "react";
import { Layers } from "lucide-react";
import { LayerInfo } from "@/lib/animation";
import { ShapeItem } from "./ShapeItem";

interface LayerListProps {
  layer: LayerInfo;
}

export const LayerItem = ({ layer }: LayerListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-medium">{layer.name}</span>
        </div>
      </div>
      {isExpanded && layer.shapes.map((shape) => <ShapeItem shape={shape} />)}
    </div>
  );
};
