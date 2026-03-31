import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SshConnection, UpdateSshPayload, Tab } from "@/types";
import { Trash2 } from "lucide-react";
import { IconColorPicker } from "./IconColorPicker";
import { TabIcon } from "./TabIcon";
import { CredentialPicker } from "./CredentialPicker";

interface EditSSHDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: SshConnection | null;
  onSuccess: () => void;
}

export function EditSSHDialog({ open, onOpenChange, connection, onSuccess }: EditSSHDialogProps) {
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");

  const [allTabs, setAllTabs] = useState<Tab[]>([]);
  const [assignedTabIds, setAssignedTabIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [credentialId, setCredentialId] = useState<string | null>(null);

  useEffect(() => {
    if (connection && open) {
        setName(connection.name);
        setHost(connection.host);
        setPort(connection.port.toString());
        setUsername(connection.username || "");
        setIcon(connection.icon || null);
        setColor(connection.color || null);
        setCredentialId(connection.credential_id || null);

        Promise.all([
            invoke<Tab[]>("get_tabs"),
            invoke<string[]>("get_resource_tab_assignments", { resourceId: connection.id })
        ]).then(([tabs, assignments]) => {
            setAllTabs(tabs);
            setAssignedTabIds(assignments);
        }).catch(console.error);
    }
  }, [connection, open]);

  const handleTabToggle = async (tabId: string, checked: boolean) => {
      if (!connection) return;
      try {
          if (checked) {
              await invoke("assign_to_tab", { tabId, resourceId: connection.id, resourceType: "ssh" });
              setAssignedTabIds(prev => [...prev, tabId]);
          } else {
              await invoke("remove_from_tab", { tabId, resourceId: connection.id, resourceType: "ssh" });
              setAssignedTabIds(prev => prev.filter(id => id !== tabId));
          }
      } catch (err) {
          console.error("Failed to toggle tab:", err);
          alert("Failed to update tab assignment");
      }
  };

  const handleDelete = async () => {
    if (!connection) return;
    if (!confirm(`Are you sure you want to delete "${connection.name}"? This cannot be undone.`)) return;

    setIsLoading(true);
    try {
        await invoke("delete_ssh_connection", { id: connection.id });
        onSuccess();
        onOpenChange(false);
    } catch (err) {
        alert("Failed to delete: " + err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection) return;
    setIsLoading(true);

    const payload: UpdateSshPayload = {
      id: connection.id,
      name,
      host,
      port: parseInt(port) || 22,
      username: username || null,
      tags_json: connection.tags_json,
      icon,
      color,
      credential_id: credentialId,
    };

    try {
      await invoke("update_ssh_connection", { payload });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update SSH connection:", error);
      alert("Failed to update: " + error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit SSH Session</DialogTitle>
          <DialogDescription>
            Update details for {connection?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-ssh-name">Name</Label>
            <Input id="edit-ssh-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ssh-host">Host</Label>
            <Input id="edit-ssh-host" value={host} onChange={(e) => setHost(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ssh-port">Port</Label>
            <Input id="edit-ssh-port" value={port} onChange={(e) => setPort(e.target.value)} type="number" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ssh-user">Username</Label>
            <Input id="edit-ssh-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Optional" />
          </div>

          <CredentialPicker value={credentialId} onChange={setCredentialId} />

          <IconColorPicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />

          {allTabs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label className="text-sm">Tab Assignments</Label>
              <div className="space-y-1.5">
                {allTabs.map(tab => (
                  <div key={tab.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                    <label htmlFor={`tab-${tab.id}`} className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <TabIcon icon={tab.icon} color={tab.color} />
                      <span>{tab.name}</span>
                    </label>
                    <Switch
                      id={`tab-${tab.id}`}
                      checked={assignedTabIds.includes(tab.id)}
                      onCheckedChange={(checked) => handleTabToggle(tab.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex justify-between sm:justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
