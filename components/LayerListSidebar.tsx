"use client";

import { getAnimationLayers } from "@/lib/animation";
import { useAnimation } from "@/lib/hooks/useAnimation";
import { LayerItem } from "./LayerItem";
import { Loading } from "./ui/Loading";
import { Skeleton } from "./ui/Skeleton";

export const LayerListSidebar = () => {
  const { animationJson, isAnimationLoading } = useAnimation();
  const layers = animationJson ? getAnimationLayers(animationJson) : [];

  return (
    <div className="border-r bg-muted/40 p-4 min-w-52">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Layers</h3>
        </div>
        <div
          className="flex flex-col gap-2 h-[calc(100vh-9rem)] overflow-x-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          <Loading
            isLoading={isAnimationLoading}
            skeleton={<LayerListSkeleton />}
          >
            {layers.map((layer, i) => (
              <LayerItem key={i} layer={layer} />
            ))}
          </Loading>
        </div>
      </div>
    </div>
  );
};

const LayerListSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8" />
      ))}
    </>
  );
};
