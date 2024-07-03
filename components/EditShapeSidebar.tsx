"use client";

import { useRef } from "react";
import { useAnimation } from "@/lib/hooks/useAnimation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { RgbaStringColorPicker } from "react-colorful";
import { SidebarItem } from "./SidebarItem";
import { ColorIcon } from "./ui/ColorIcon";

export const EditShapeSidebar = () => {
  const { selectedShape } = useAnimation();
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
                <RgbaStringColorPicker
                  color={`rgba(${selectedShape.colorRgb.join(",")})`}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};