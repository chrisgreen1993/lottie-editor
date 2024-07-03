import { useState } from "react";
import { Group } from "lucide-react";
import { ShapeInfo } from "@/lib/animation";
import { useAnimation } from "@/lib/hooks/useAnimation";
import { SidebarItem } from "./SidebarItem";

interface ShapeItemProps {
  shape: ShapeInfo;
  depth?: number;
}

export const ShapeItem = ({ shape, depth = 0 }: ShapeItemProps) => {
  const { setSelectedShape } = useAnimation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isGroup = shape.children.length > 0;

  const handleClick = () => {
    isGroup ? setIsExpanded(!isExpanded) : setSelectedShape(shape);
  };

  return (
    <div
      className="flex flex-col gap-2"
      style={{ paddingLeft: `${depth + 1}rem` }}
    >
      <SidebarItem onClick={handleClick} text={shape.name}>
        {isGroup ? (
          <Group className="h-4 w-4" />
        ) : (
          <div
            className="h-4 w-4 rounded-full bg-accent"
            style={{ backgroundColor: `rgba(${shape.colorRgb.join(",")})` }}
          />
        )}
      </SidebarItem>
      {isExpanded &&
        shape.children.map((nestedShape, i) => (
          <ShapeItem key={i} shape={nestedShape} depth={depth + 1} />
        ))}
    </div>
  );
};
