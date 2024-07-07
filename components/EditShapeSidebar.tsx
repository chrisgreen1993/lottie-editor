"use client";

import { useAnimation } from "@/lib/hooks/useAnimation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { RgbaColor, RgbaColorPicker } from "react-colorful";
import { SidebarItem } from "./SidebarItem";
import { ColorIcon } from "./ui/ColorIcon";
import { getSelectedShape } from "@/lib/animation";

const colorToObject = (color: number[]): RgbaColor => {
  const [r, g, b, a] = color;
  return { r, g, b, a };
};

const objectToColor = (color: RgbaColor): number[] => {
  const { r, g, b, a } = color;
  return [r, g, b, a];
};

export const EditShapeSidebar = () => {
  const { animationJson, selectedShapePath, updateSelectedShapeColor } =
    useAnimation();

  const selectedShape =
    animationJson &&
    selectedShapePath &&
    getSelectedShape(animationJson, selectedShapePath);

  const handleColorChange = (color: RgbaColor) => {
    updateSelectedShapeColor(objectToColor(color));
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
                  color={colorToObject(selectedShape.colorRgb)}
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
