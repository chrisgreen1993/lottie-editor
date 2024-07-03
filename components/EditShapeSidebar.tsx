"use client";

import { useRef } from "react";
import { useAnimation } from "@/lib/hooks/useAnimation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HexColorInput, RgbaStringColorPicker } from "react-colorful";

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
                <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{
                        backgroundColor: `rgba(${selectedShape.colorRgb.join(",")})`,
                      }}
                    />
                    <span className="text-sm font-medium">Color</span>
                  </div>
                </div>
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
