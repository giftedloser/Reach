import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Connection } from "@/types";
import { Monitor } from "lucide-react";
import { EditConnectionDialog } from "./EditConnectionDialog";
import { getIconComponent } from "./IconColorPicker";
import { ResourceGrid, type ResourceItem } from "./ResourceGrid";

interface RDPViewProps {
  filter?: string;
}

export function RDPView({ filter = "" }: RDPViewProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await invoke<Connection[]>("get_connections", { search: null });
      setConnections(data);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleLaunch = async (id: string) => {
    try {
      await invoke("launch_rdp", { id });
      fetchConnections();
    } catch (err) {
      console.error("Failed to launch:", err);
      alert("Failed to launch: " + err);
    }
  };

  const handleEdit = (conn: Connection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConnection(conn);
    setIsEditDialogOpen(true);
  };

  const resolveIcon = (conn: Connection) => getIconComponent(conn.icon) || Monitor;
  const resolveColor = (conn: Connection) => conn.color || "#f97316";

  const filteredConnections = connections.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.host.toLowerCase().includes(filter.toLowerCase())
  );

  const items: ResourceItem[] = filteredConnections.map((conn) => ({
    id: conn.id,
    name: conn.name,
    subtitle: conn.host,
    icon: resolveIcon(conn),
    accentColor: resolveColor(conn),
    typeBadge: "RDP",
    onLaunch: () => handleLaunch(conn.id),
    onEdit: (e: React.MouseEvent) => handleEdit(conn, e),
  }));

  return (
    <div className="min-h-full flex flex-col p-4">
      <div className="flex-1">
        <ResourceGrid
          items={items}
          emptyMessage="No RDP connections found."
          filterActive={!!filter}
        />
      </div>
      <EditConnectionDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} connection={editingConnection} onSuccess={fetchConnections} />
    </div>
  );
}
