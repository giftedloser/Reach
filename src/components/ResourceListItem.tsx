import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pencil, Play, Route, ShieldAlert } from "lucide-react";
import { useUI } from "@/contexts/UIContext";

interface ResourceListItemProps {
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

export function ResourceListItem({
  name,
  subtitle,
  icon: Icon,
  accentColor,
  typeBadge,
  gatewayBadge,
  onLaunch,
  onEdit,
  adminBadge,
}: ResourceListItemProps) {
  const { density } = useUI();

  const textSize = {
    compact: "text-xs",
    standard: "text-sm",
    comfortable: "text-base",
  };

  const padding = density === "compact" ? "px-3 py-1.5" : "px-3.5 py-2.5";

  return (
    <div
      className={`neo-list-row group flex w-full items-center gap-3 cursor-pointer ${padding}`}
      style={{ borderLeft: `3px solid ${accentColor}` }}
      onDoubleClick={onLaunch}
    >
      {/* Icon */}
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 relative"
        style={{
          backgroundColor: `${accentColor}14`,
          color: accentColor,
        }}
      >
        <Icon className="h-4 w-4" />
        {adminBadge && (
          <ShieldAlert
            className="absolute -top-1 -right-1 h-3 w-3"
            style={{ color: "var(--theme-warning)" }}
          />
        )}
        {gatewayBadge && (
          <div
            className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border"
            style={{
              backgroundColor: "var(--background)",
              borderColor: `${accentColor}33`,
              color: accentColor,
            }}
            title="Uses RD Gateway"
          >
            <Route className="h-2 w-2" />
          </div>
        )}
      </div>

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0">
        <div className={`neo-title font-medium truncate ${textSize[density]}`}>
          {name}
        </div>
        <div className="text-[11px] text-muted-foreground truncate opacity-70 font-mono">
          {subtitle}
        </div>
      </div>

      {/* Type badge */}
      <span
        className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider opacity-50 shrink-0"
        style={{ color: accentColor }}
      >
        {typeBadge}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={onEdit}
            title="Edit"
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </Button>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 rounded-lg"
          onClick={onLaunch}
          title="Launch"
        >
          <Play className="h-3 w-3 text-primary" />
        </Button>
      </div>
    </div>
  );
}
