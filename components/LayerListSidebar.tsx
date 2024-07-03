"use client";

import { getAnimationLayers } from "@/lib/animation";
import { useAnimation } from "@/lib/hooks/useAnimation";
import { LayerItem } from "./LayerItem";

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
