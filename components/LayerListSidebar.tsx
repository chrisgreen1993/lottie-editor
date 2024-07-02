"use client";

import { LayerInfo, ShapeInfo, getAnimationLayers } from "@/lib/animation";
import { useAnimation } from "@/lib/hooks/useAnimation";

export const LayerListSidebar = () => {
  const { animationJson } = useAnimation();
  const layers = animationJson ? getAnimationLayers(animationJson) : [];
  return (
    <div className="border-r bg-muted/40 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Layers</h3>
        </div>
        <div
          className="flex flex-col gap-2 h-[calc(100vh-9rem)] overflow-x-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {layers.map((layer) => (
            <LayerItem layer={layer} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface LayerListProps {
  layer: LayerInfo;
}

const LayerItem = ({ layer }: LayerListProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-primary" />
          <span className="text-sm font-medium">{layer.name}</span>
        </div>
      </div>
      {layer.shapes.map((shape) => (
        <ShapeItem shape={shape} />
      ))}
    </div>
  );
};

interface ShapeItemProps {
  shape: ShapeInfo;
  depth?: number;
}

const ShapeItem = ({ shape, depth = 0 }: ShapeItemProps) => {
  return (
    <div style={{ paddingLeft: `${depth + 1}rem` }}>
      <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full bg-accent"
            style={{ backgroundColor: `rgba(${shape.colorRgb.join(",")})` }}
          />
          <span className="text-sm font-medium">{shape.name}</span>
        </div>
      </div>
      {shape.children.map((nestedShape, i) => (
        <ShapeItem key={i} shape={nestedShape} depth={depth + 1} />
      ))}
    </div>
  );
};
