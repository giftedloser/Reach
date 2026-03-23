import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTabIconColor, getTabIconComponent, getTabIconLetters } from "@/lib/icon-registry";

type TabIconSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<TabIconSize, { container: string; icon: string; letters: string }> = {
  sm: {
    container: "h-4 w-4 rounded-[4px]",
    icon: "h-2.5 w-2.5",
    letters: "text-[8px]",
  },
  md: {
    container: "h-7 w-7 rounded-md",
    icon: "h-3.5 w-3.5",
    letters: "text-[10px]",
  },
  lg: {
    container: "h-9 w-9 rounded-lg",
    icon: "h-4.5 w-4.5",
    letters: "text-xs",
  },
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface TabIconProps {
  icon: string | null;
  color: string | null;
  size?: TabIconSize;
  className?: string;
}

export function TabIcon({ icon, color, size = "md", className }: TabIconProps) {
  const styles = SIZE_STYLES[size];
  const letters = getTabIconLetters(icon);
  const Icon = getTabIconComponent(icon) ?? Tag;
  const resolvedColor = getTabIconColor(icon, color);

  const customStyle = resolvedColor
    ? {
        backgroundColor: hexToRgba(resolvedColor, 0.18),
        color: resolvedColor,
        borderColor: hexToRgba(resolvedColor, 0.34),
      }
    : undefined;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border font-bold uppercase leading-none",
        styles.container,
        resolvedColor ? "" : "border-primary/25 bg-primary/10 text-primary",
        className,
      )}
      style={customStyle}
      aria-hidden="true"
    >
      {letters ? (
        <span className={cn("font-bold tracking-[0.08em]", styles.letters)}>{letters}</span>
      ) : (
        <Icon className={styles.icon} />
      )}
    </span>
  );
}
