import { RgbaColor } from "@/lib/animation";

interface ColorIconProps {
  color: RgbaColor;
}

export const ColorIcon = ({ color }: ColorIconProps) => {
  const { r, g, b, a } = color;
  return (
    <div
      className="h-4 w-4 rounded-full bg-accent"
      style={{ backgroundColor: `rgba(${r},${g},${b},${a})` }}
    />
  );
};
