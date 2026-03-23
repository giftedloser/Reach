import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { App } from "@/types";
import { Command, Terminal, Monitor, Shield } from "lucide-react";
import { EditAppDialog } from "./EditAppDialog";
import { getIconComponent } from "./IconColorPicker";
import { ResourceGrid, type ResourceItem } from "./ResourceGrid";

interface AppsViewProps {
  filter?: string;
}

export function AppsView({ filter = "" }: AppsViewProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const data = await invoke<App[]>("get_apps", { search: filter || null });
      setApps(data);
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    }
  }, [filter]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleLaunch = async (id: string) => {
    try {
      await invoke("launch_app", { id });
      fetchApps();
    } catch (err) {
      console.error("Failed to launch:", err);
      alert("Failed to launch: " + err);
    }
  };

  const handleEdit = (app: App, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingApp(app);
    setIsEditDialogOpen(true);
  };

  const getDefaultIcon = (tags: string | null | undefined) => {
    const tagStr = tags || "";
    if (tagStr.includes("type:ssh")) return Terminal;
    if (tagStr.includes("type:rdp-gateway")) return Shield;
    if (tagStr.includes("type:rdp")) return Monitor;
    return Command;
  };

  const resolveIcon = (app: App) => getIconComponent(app.icon) || getDefaultIcon(app.tags_json);
  const resolveColor = (app: App) => app.color || "#3b82f6";

  const items: ResourceItem[] = apps.map((app) => ({
    id: app.id,
    name: app.name,
    subtitle: `${app.exe_path}${app.args ? " " + app.args : ""}`,
    icon: resolveIcon(app),
    accentColor: resolveColor(app),
    typeBadge: "APP",
    onLaunch: () => handleLaunch(app.id),
    onEdit: (e: React.MouseEvent) => handleEdit(app, e),
    adminBadge: app.run_as_admin,
  }));

  return (
    <div className="min-h-full flex flex-col p-4">
      <div className="flex-1">
        <ResourceGrid
          items={items}
          emptyMessage="No apps found. Click + to add one."
          filterActive={!!filter}
        />
      </div>
      <EditAppDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} app={editingApp} onSuccess={fetchApps} />
    </div>
  );
}
