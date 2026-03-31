import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { App, connectionUsesGateway, Connection, SshConnection, Tab } from "@/types";
import { Command, Monitor, Terminal } from "lucide-react";
import { EditAppDialog } from "./EditAppDialog";
import { EditConnectionDialog } from "./EditConnectionDialog";
import { EditSSHDialog } from "./EditSSHDialog";
import { getIconComponent } from "@/lib/icon-registry";
import { ResourceGrid, type ResourceItem } from "./ResourceGrid";

interface CustomTabViewProps {
  filter?: string;
  tabId: string;
}

type UnifiedResource =
  | { type: 'app'; original: App; name: string }
  | { type: 'rdp'; original: Connection; name: string }
  | { type: 'ssh'; original: SshConnection; name: string };

const TYPE_COLORS: Record<string, string> = { app: "#3b82f6", rdp: "#f97316", ssh: "#10b981" };

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

export function CustomTabView({ filter = "", tabId }: CustomTabViewProps) {
  const [resources, setResources] = useState<UnifiedResource[]>([]);

  const [editApp, setEditApp] = useState<App | null>(null);
  const [editRdp, setEditRdp] = useState<Connection | null>(null);
  const [editSsh, setEditSsh] = useState<SshConnection | null>(null);

  const fetchTabAndResources = useCallback(async () => {
    try {
      const tabs = await invoke<Tab[]>("get_tabs");
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;

      const assignments = await invoke<{ resource_id: string; resource_type: string }[]>("get_tab_assignments", { tabId });
      const resources: UnifiedResource[] = [];

      const [apps, connections, ssh] = await Promise.all([
        invoke<App[]>("get_apps", { search: null }),
        invoke<Connection[]>("get_connections", { search: null }),
        invoke<SshConnection[]>("get_ssh_connections"),
      ]);

      const appMap = new Map(apps.map(a => [a.id, a]));
      const connMap = new Map(connections.map(c => [c.id, c]));
      const sshMap = new Map(ssh.map(s => [s.id, s]));

      assignments.forEach(assign => {
        if (assign.resource_type === 'app') {
          const app = appMap.get(assign.resource_id);
          if (app) resources.push({ type: 'app', original: app, name: app.name });
        } else if (assign.resource_type === 'rdp') {
          const conn = connMap.get(assign.resource_id);
          if (conn) resources.push({ type: 'rdp', original: conn, name: conn.name });
        } else if (assign.resource_type === 'ssh') {
          const s = sshMap.get(assign.resource_id);
          if (s) resources.push({ type: 'ssh', original: s, name: s.name });
        }
      });

      resources.sort((a, b) => a.name.localeCompare(b.name));
      setResources(resources);
    } catch (error) {
      console.error("Failed to fetch tab resources:", error);
    }
  }, [tabId]);

  useEffect(() => {
    fetchTabAndResources();
  }, [fetchTabAndResources]);

  const handleLaunch = async (res: UnifiedResource) => {
    try {
      if (res.type === "app") await invoke("launch_app", { id: res.original.id });
      else if (res.type === "rdp") await invoke("launch_rdp", { id: res.original.id });
      else if (res.type === "ssh") await invoke("launch_ssh", { id: res.original.id });
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
    if (res.type === "app") return Command;
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
        <ResourceGrid
          items={items}
          emptyMessage="No resources in this tab."
          filterActive={!!filter}
        />
      </div>
      <EditAppDialog open={!!editApp} onOpenChange={(open) => !open && setEditApp(null)} app={editApp} onSuccess={fetchTabAndResources} />
      <EditConnectionDialog open={!!editRdp} onOpenChange={(open) => !open && setEditRdp(null)} connection={editRdp} onSuccess={fetchTabAndResources} />
      <EditSSHDialog open={!!editSsh} onOpenChange={(open) => !open && setEditSsh(null)} connection={editSsh} onSuccess={fetchTabAndResources} />
    </div>
  );
}
