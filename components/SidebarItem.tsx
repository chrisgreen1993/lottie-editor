import { cn } from "@/lib/utils";

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  children: React.ReactNode;
}

export const SidebarItem = ({
  text,
  children,
  className,
  ...props
}: SidebarItemProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md bg-background px-3 py-2 hover:bg-muted cursor-pointer border",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        <span className="text-sm font-medium">{text}</span>
      </div>
    </div>
  );
};
