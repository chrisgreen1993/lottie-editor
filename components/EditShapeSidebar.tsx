"use client";

import { useAnimation } from "@/lib/hooks/useAnimation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { RgbaColorPicker } from "react-colorful";
import { SidebarItem } from "./SidebarItem";
import { ColorIcon } from "./ui/ColorIcon";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { getFramerate, getSelectedShape, RgbaColor } from "@/lib/animation";
import { Loading } from "./ui/Loading";

export const EditShapeSidebar = () => {
  const {
    animationJson,
    selectedShapePath,
    updateSelectedShapeColor,
    updateFramerate,
    isAnimationLoading,
  } = useAnimation();

  const selectedShape =
    animationJson &&
    selectedShapePath &&
    getSelectedShape(animationJson, selectedShapePath);

  const framerate = (animationJson && getFramerate(animationJson)) || 0;

  const handleColorChange = (color: RgbaColor) => {
    updateSelectedShapeColor(color);
  };

  const handleFramerateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFramerate = parseInt(e.target.value, 10);
    updateFramerate(newFramerate);
  };

  return (
    <div className="border-l bg-muted/40 p-4 min-w-52">
      <div className="flex flex-col justify-between h-full">
        {selectedShape && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Edit {selectedShape.name}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <Popover>
                <PopoverTrigger>
                  <SidebarItem text="Color">
                    <ColorIcon color={selectedShape.colorRgb} />
                  </SidebarItem>
                </PopoverTrigger>
                <PopoverContent>
                  <RgbaColorPicker
                    color={selectedShape.colorRgb}
                    onChange={handleColorChange}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 mt-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Global Settings</h3>
          </div>
          <Loading isLoading={isAnimationLoading} className="h-8">
            <div className="flex items-center gap-2">
              <Label htmlFor="framerate">Framerate:</Label>
              <Input
                id="framerate"
                type="number"
                onChange={handleFramerateChange}
                value={framerate}
                className="w-20"
              />
            </div>
          </Loading>
        </div>
      </div>
    </div>
  );
};
