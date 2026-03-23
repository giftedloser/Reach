import type { LucideIcon } from "lucide-react";
import { useUI } from "@/contexts/UIContext";
import { ResourceCard } from "./ResourceCard";
import { ResourceListItem } from "./ResourceListItem";

export interface ResourceItem {
  id: string;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  accentColor: string;
  typeBadge: string;
  onLaunch: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  adminBadge?: boolean;
}

interface ResourceGridProps {
  items: ResourceItem[];
  emptyMessage?: string;
  filterActive?: boolean;
}

const gridConfig = {
  compact: "grid-cols-[repeat(auto-fill,minmax(130px,1fr))]",
  standard: "grid-cols-[repeat(auto-fill,minmax(155px,1fr))]",
  comfortable: "grid-cols-[repeat(auto-fill,minmax(190px,1fr))]",
};

export function ResourceGrid({
  items,
  emptyMessage = "No resources found.",
  filterActive = false,
}: ResourceGridProps) {
  const { viewMode, density } = useUI();

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-16">
        {filterActive ? "No resources match your search." : emptyMessage}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2">
        {items.map((item) => (
          <ResourceListItem key={item.id} {...item} />
        ))}
      </div>
    );
  }

  return (
    <div className={`stagger-grid grid ${gridConfig[density]} gap-3 p-1`}>
      {items.map((item) => (
        <ResourceCard key={item.id} {...item} />
      ))}
    </div>
  );
}
