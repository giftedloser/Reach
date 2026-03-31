import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { App, connectionUsesGateway, Connection, SshConnection } from "@/types";
import { Command, Monitor, Terminal } from "lucide-react";
import { EditAppDialog } from "./EditAppDialog";
import { EditConnectionDialog } from "./EditConnectionDialog";
import { EditSSHDialog } from "./EditSSHDialog";
import { getIconComponent } from "./IconColorPicker";
import { ResourceGrid, type ResourceItem } from "./ResourceGrid";

interface AllViewProps {
  filter?: string;
}

type UnifiedResource =
  | { type: 'app'; original: App; name: string }
  | { type: 'rdp'; original: Connection; name: string }
  | { type: 'ssh'; original: SshConnection; name: string };

const TYPE_COLORS: Record<string, string> = {
  app: "#3b82f6",
  rdp: "#f97316",
  ssh: "#10b981",
};

function getSubtitle(res: UnifiedResource): string {
  if (res.type === "rdp") return (res.original as Connection).host;
  if (res.type === "ssh") {
    const s = res.original as SshConnection;
    return `${s.username ? s.username + "@" : ""}${s.host}:${s.port}`;
  }
  return (res.original as App).exe_path;
}

function getCustomColor(res: UnifiedResource): string | null {
  if (res.type === "app") return (res.original as App).color;
  if (res.type === "rdp") return (res.original as Connection).color;
  if (res.type === "ssh") return (res.original as SshConnection).color;
  return null;
}

function getCustomIconName(res: UnifiedResource): string | null {
  if (res.type === "app") return (res.original as App).icon;
  if (res.type === "rdp") return (res.original as Connection).icon;
  if (res.type === "ssh") return (res.original as SshConnection).icon;
  return null;
}

export function AllView({ filter = "" }: AllViewProps) {
  const [resources, setResources] = useState<UnifiedResource[]>([]);
  const [editApp, setEditApp] = useState<App | null>(null);
  const [editRdp, setEditRdp] = useState<Connection | null>(null);
  const [editSsh, setEditSsh] = useState<SshConnection | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [apps, connections, ssh] = await Promise.all([
        invoke<App[]>("get_apps", { search: null }),
        invoke<Connection[]>("get_connections", { search: null }),
        invoke<SshConnection[]>("get_ssh_connections"),
      ]);

      const unified: UnifiedResource[] = [
        ...apps.map(a => ({ type: 'app' as const, original: a, name: a.name })),
        ...connections.map(c => ({ type: 'rdp' as const, original: c, name: c.name })),
        ...ssh.map(s => ({ type: 'ssh' as const, original: s, name: s.name })),
      ];

      unified.sort((a, b) => a.name.localeCompare(b.name));
      setResources(unified);
    } catch (error) {
      console.error("Failed to fetch all resources:", error);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLaunch = async (res: UnifiedResource) => {
    try {
      if (res.type === "app") await invoke("launch_app", { id: res.original.id });
      else if (res.type === "rdp") await invoke("launch_rdp", { id: res.original.id });
      else if (res.type === "ssh") await invoke("launch_ssh", { id: res.original.id });
      fetchAll();
    } catch (err) {
      console.error("Failed to launch:", err);
    }
  };

  const handleEdit = (res: UnifiedResource, e: React.MouseEvent) => {
    e.stopPropagation();
    if (res.type === "app") setEditApp(res.original as App);
    if (res.type === "rdp") setEditRdp(res.original as Connection);
    if (res.type === "ssh") setEditSsh(res.original as SshConnection);
  };

  const getDefaultIcon = (res: UnifiedResource) => {
    if (res.type === "rdp") return Monitor;
    if (res.type === "ssh") return Terminal;
    return Command;
  };

  const resolveIcon = (res: UnifiedResource) => getIconComponent(getCustomIconName(res)) || getDefaultIcon(res);
  const resolveColor = (res: UnifiedResource) => getCustomColor(res) || TYPE_COLORS[res.type] || "#64748b";

  const normalizedFilter = filter.trim().toLowerCase();
  const filtered = resources.filter((res) => {
    if (!normalizedFilter) {
      return true;
    }

    const haystack = `${res.name} ${getSubtitle(res)}`.toLowerCase();
    return haystack.includes(normalizedFilter);
  });

  const items: ResourceItem[] = filtered.map((res) => ({
    id: `${res.type}-${res.original.id}`,
    name: res.name,
    subtitle: getSubtitle(res),
    icon: resolveIcon(res),
    accentColor: resolveColor(res),
    typeBadge: res.type.toUpperCase(),
    gatewayBadge: res.type === "rdp" && connectionUsesGateway(res.original as Connection),
    onLaunch: () => handleLaunch(res),
    onEdit: (e: React.MouseEvent) => handleEdit(res, e),
  }));

  return (
    <div className="min-h-full flex flex-col p-4">
      <div className="flex-1">
        <ResourceGrid items={items} filterActive={!!filter} />
      </div>
      <EditAppDialog open={!!editApp} onOpenChange={(open) => !open && setEditApp(null)} app={editApp} onSuccess={fetchAll} />
      <EditConnectionDialog open={!!editRdp} onOpenChange={(open) => !open && setEditRdp(null)} connection={editRdp} onSuccess={fetchAll} />
      <EditSSHDialog open={!!editSsh} onOpenChange={(open) => !open && setEditSsh(null)} connection={editSsh} onSuccess={fetchAll} />
    </div>
  );
}
