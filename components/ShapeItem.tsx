import { useMemo, useState } from "react";
import { Group } from "lucide-react";
import { ShapeInfo } from "@/lib/animation";
import { useAnimation } from "@/lib/hooks/useAnimation";
import { SidebarItem } from "./SidebarItem";
import { ColorIcon } from "./ui/ColorIcon";

interface ShapeItemProps {
  shape: ShapeInfo;
  depth?: number;
}

export const ShapeItem = ({ shape, depth = 0 }: ShapeItemProps) => {
  const { setSelectedShapePath, hoveredShapePaths, setHoveredShapePaths } = useAnimation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isGroup = shape.children.length > 0;

  const handleClick = () => {
    isGroup ? setIsExpanded(!isExpanded) : setSelectedShapePath(shape.path);
  };

  const isHovered = useMemo(
    () => hoveredShapePaths.includes(shape.path),
    [hoveredShapePaths, shape.path],
  );

  return (
    <div
      className="flex flex-col gap-2"
      style={{ paddingLeft: `${depth + 1}rem` }}
    >
      <SidebarItem
        onClick={handleClick}
        onMouseEnter={() => !isGroup && setHoveredShapePaths([shape.path])}
        onMouseLeave={() => !isGroup && setHoveredShapePaths([])}
        className={isHovered ? "ring-2 ring-primary" : undefined}
        text={shape.name}
      >
        {isGroup ? (
          <Group className="h-4 w-4" />
        ) : (
          <ColorIcon color={shape.colorRgb} />
        )}
      </SidebarItem>
      {isExpanded &&
        shape.children.map((nestedShape, i) => (
          <ShapeItem key={i} shape={nestedShape} depth={depth + 1} />
        ))}
    </div>
  );
};
