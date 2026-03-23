import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SshConnection } from "@/types";
import { Terminal } from "lucide-react";
import { EditSSHDialog } from "./EditSSHDialog";
import { getIconComponent } from "./IconColorPicker";
import { ResourceGrid, type ResourceItem } from "./ResourceGrid";

interface SSHViewProps {
  filter?: string;
}

export function SSHView({ filter = "" }: SSHViewProps) {
  const [connections, setConnections] = useState<SshConnection[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SshConnection | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await invoke<SshConnection[]>("get_ssh_connections");
      setConnections(data);
    } catch (error) {
      console.error("Failed to fetch SSH connections:", error);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleLaunch = async (id: string) => {
    try {
      await invoke("launch_ssh", { id });
      fetchConnections();
    } catch (err) {
      console.error("Failed to launch:", err);
      alert("Failed to launch (Check PuTTY path in Settings): " + err);
    }
  };

  const handleEdit = (conn: SshConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConnection(conn);
    setIsEditDialogOpen(true);
  };

  const resolveIcon = (conn: SshConnection) => getIconComponent(conn.icon) || Terminal;
  const resolveColor = (conn: SshConnection) => conn.color || "#10b981";

  const filteredConnections = connections.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.host.toLowerCase().includes(filter.toLowerCase())
  );

  const items: ResourceItem[] = filteredConnections.map((conn) => ({
    id: conn.id,
    name: conn.name,
    subtitle: `${conn.username ? conn.username + "@" : ""}${conn.host}:${conn.port}`,
    icon: resolveIcon(conn),
    accentColor: resolveColor(conn),
    typeBadge: "SSH",
    onLaunch: () => handleLaunch(conn.id),
    onEdit: (e: React.MouseEvent) => handleEdit(conn, e),
  }));

  return (
    <div className="min-h-full flex flex-col p-4">
      <div className="flex-1">
        <ResourceGrid
          items={items}
          emptyMessage="No SSH connections found."
          filterActive={!!filter}
        />
      </div>
      <EditSSHDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} connection={editingConnection} onSuccess={fetchConnections} />
    </div>
  );
}
