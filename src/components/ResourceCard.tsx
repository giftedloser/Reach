import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pencil, Play, Route, ShieldAlert } from "lucide-react";
import { useUI } from "@/contexts/UIContext";

interface ResourceCardProps {
  name: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: string;
  typeBadge: string;
  gatewayBadge?: boolean;
  onLaunch: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  adminBadge?: boolean;
}

export function ResourceCard({
  name,
  subtitle,
  icon: Icon,
  accentColor,
  typeBadge,
  gatewayBadge,
  onLaunch,
  onEdit,
  adminBadge,
}: ResourceCardProps) {
  const { density } = useUI();

  const iconOuter = {
    compact: "h-11 w-11 rounded-xl",
    standard: "h-14 w-14 rounded-2xl",
    comfortable: "h-16 w-16 rounded-2xl",
  };

  const iconInner = {
    compact: "h-5 w-5",
    standard: "h-7 w-7",
    comfortable: "h-8 w-8",
  };

  const textSize = {
    compact: "text-xs",
    standard: "text-sm",
    comfortable: "text-base",
  };

  const cardPad = {
    compact: "px-3 pt-4 pb-3",
    standard: "px-4 pt-6 pb-4",
    comfortable: "px-5 pt-7 pb-5",
  };

  return (
    <div
      className={`neo-card group relative flex h-full cursor-pointer flex-col items-center text-center ${cardPad[density]}`}
      onDoubleClick={onLaunch}
    >
      {/* Admin badge — top-left pill */}
      {adminBadge && (
        <div
          className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-warning) 12%, transparent)",
            color: "var(--theme-warning)",
          }}
        >
          <ShieldAlert className="h-2.5 w-2.5" />
          Admin
        </div>
      )}

      {/* Hover actions — top-right floating buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 z-10">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md bg-background/80 backdrop-blur-sm shadow-sm"
            onClick={onEdit}
            title="Edit"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
        <Button
          size="icon"
          className="h-6 w-6 rounded-md shadow-sm"
          onClick={onLaunch}
          title="Launch"
        >
          <Play className="h-3 w-3" />
        </Button>
      </div>

      {/* Icon with accent glow */}
      <div className="relative flex items-center justify-center mb-3">
        {/* Soft radial glow behind the icon */}
        <div
          className="absolute inset-0 scale-[1.35] rounded-full blur-xl opacity-[0.22] transition-opacity duration-300 group-hover:opacity-[0.3]"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className={`relative ${iconOuter[density]} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
          style={{
            backgroundColor: `${accentColor}20`,
            color: accentColor,
            boxShadow: `0 0 0 1px ${accentColor}18 inset, 0 0 24px ${accentColor}12`,
          }}
        >
          <Icon className={`${iconInner[density]} drop-shadow-sm`} />
          {gatewayBadge && (
            <div
              className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border"
              style={{
                backgroundColor: "var(--background)",
                borderColor: `${accentColor}33`,
                color: accentColor,
                boxShadow: `0 0 0 1px ${accentColor}18`,
              }}
              title="Uses RD Gateway"
            >
              <Route className="h-2.5 w-2.5" />
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full min-h-0 flex-1 flex-col items-center">
        {/* Name */}
        <div
          className={`neo-title font-semibold leading-snug line-clamp-2 ${textSize[density]}`}
          title={name}
        >
          {name}
        </div>

        {/* Subtitle */}
        <div
          className="mt-0.5 max-w-full truncate text-[10px] font-mono text-muted-foreground opacity-50"
          title={subtitle}
        >
          {subtitle}
        </div>

        {/* Type badge */}
        <div
          className="mt-auto pt-1.5 text-[9px] font-bold uppercase tracking-widest opacity-40"
          style={{ color: accentColor }}
        >
          {typeBadge}
        </div>
      </div>
    </div>
  );
}
