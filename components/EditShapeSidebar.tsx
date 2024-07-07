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
import { getSelectedShape, RgbaColor } from "@/lib/animation";

export const EditShapeSidebar = () => {
  const { animationJson, selectedShapePath, updateSelectedShapeColor } =
    useAnimation();

  const selectedShape =
    animationJson &&
    selectedShapePath &&
    getSelectedShape(animationJson, selectedShapePath);

  const handleColorChange = (color: RgbaColor) => {
    updateSelectedShapeColor(color);
  };

  return (
    <div className="border-l bg-muted/40 p-4 min-w-52">
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
    </div>
  );
};
