import { useState } from "react";
import { Layers, Sidebar } from "lucide-react";
import { LayerInfo } from "@/lib/animation";
import { ShapeItem } from "./ShapeItem";
import { SidebarItem } from "./SidebarItem";

interface LayerListProps {
  layer: LayerInfo;
}

export const LayerItem = ({ layer }: LayerListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <SidebarItem text={layer.name} onClick={() => setIsExpanded(!isExpanded)}>
        <Layers className="h-4 w-4" />
      </SidebarItem>
      {isExpanded &&
        layer.shapes.map((shape, i) => <ShapeItem key={i} shape={shape} />)}
    </div>
  );
};
