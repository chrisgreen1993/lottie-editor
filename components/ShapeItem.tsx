import { useState } from "react";
import { Group } from "lucide-react";
import { ShapeInfo } from "@/lib/animation";

interface ShapeItemProps {
  shape: ShapeInfo;
  depth?: number;
}

export const ShapeItem = ({ shape, depth = 0 }: ShapeItemProps) => {
  const isGroup = shape.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div style={{ paddingLeft: `${depth + 1}rem` }}>
      <div
        className={`flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted ${isGroup ? "cursor-pointer" : ""}`}
        onClick={() => isGroup && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isGroup ? (
            <Group className="h-4 w-4" />
          ) : (
            <div
              className="h-4 w-4 rounded-full bg-accent"
              style={{ backgroundColor: `rgba(${shape.colorRgb.join(",")})` }}
            />
          )}
          <span className="text-sm font-medium">{shape.name}</span>
        </div>
      </div>
      {isExpanded &&
        shape.children.map((nestedShape, i) => (
          <ShapeItem key={i} shape={nestedShape} depth={depth + 1} />
        ))}
    </div>
  );
};
