import { RgbaColor } from "@/lib/animation";

interface ColorIconProps {
  color: RgbaColor;
  size?: number; // pixels
  withBorder?: boolean;
}

export const ColorIcon = ({ color, size = 16, withBorder = false }: ColorIconProps) => {
  const { r, g, b, a } = color;
  const style: React.CSSProperties = {
    backgroundColor: `rgba(${r},${g},${b},${a})`,
    width: size,
    height: size,
  };
  return (
    <div
      className={`rounded-full ${withBorder ? "ring-1 ring-border" : ""}`}
      style={style}
    />
  );
};
