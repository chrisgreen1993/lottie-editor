interface ColorIconProps {
  color: number[];
}

export const ColorIcon = ({ color }: ColorIconProps) => (
  <div
    className="h-4 w-4 rounded-full bg-accent"
    style={{ backgroundColor: `rgba(${color.join(",")})` }}
  />
);
