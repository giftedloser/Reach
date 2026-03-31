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
import { Connection, ConnectionGatewayConfig, DesignatedGatewaySetting, UpdateConnectionPayload, Tab } from "@/types";
import { Trash2 } from "lucide-react";
import { IconColorPicker } from "./IconColorPicker";
import { TabIcon } from "./TabIcon";
import { CredentialPicker } from "./CredentialPicker";

interface EditConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: Connection | null;
  onSuccess: () => void;
}

export function EditConnectionDialog({ open, onOpenChange, connection, onSuccess }: EditConnectionDialogProps) {
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [useDesignatedGateway, setUseDesignatedGateway] = useState(false);
  const [designatedGatewayHost, setDesignatedGatewayHost] = useState("");
  const [preservedGatewayJson, setPreservedGatewayJson] = useState<string | null>(null);

  const [allTabs, setAllTabs] = useState<Tab[]>([]);
  const [assignedTabIds, setAssignedTabIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [credentialId, setCredentialId] = useState<string | null>(null);

  const parseDesignatedGatewayState = (gatewayJson: string | null) => {
    if (!gatewayJson) {
      return { useDesignatedGateway: false, preservedGatewayJson: null };
    }

    try {
      const parsed = JSON.parse(gatewayJson) as ConnectionGatewayConfig;
      if (parsed.mode === "designated" || parsed.use_designated_gateway) {
        return { useDesignatedGateway: true, preservedGatewayJson: null };
      }
    } catch {
      // Preserve unparseable data rather than dropping it during edit.
    }

    return { useDesignatedGateway: false, preservedGatewayJson: gatewayJson };
  };

  useEffect(() => {
    if (connection && open) {
        setName(connection.name);
        setHost(connection.host);
        setUsername(connection.username || "");
        setIcon(connection.icon || null);
        setColor(connection.color || null);
        setCredentialId(connection.credential_id || null);
        const gatewayState = parseDesignatedGatewayState(connection.gateway_json);
        setUseDesignatedGateway(gatewayState.useDesignatedGateway);
        setPreservedGatewayJson(gatewayState.preservedGatewayJson);

        Promise.all([
            invoke<Tab[]>("get_tabs"),
            invoke<string[]>("get_resource_tab_assignments", { resourceId: connection.id }),
            invoke<string | null>("get_setting", { key: "rd_gateway" })
        ]).then(([tabs, assignments, gatewaySetting]) => {
            setAllTabs(tabs);
            setAssignedTabIds(assignments);

            if (!gatewaySetting) {
              setDesignatedGatewayHost("");
              return;
            }

            try {
              const parsed = JSON.parse(gatewaySetting) as DesignatedGatewaySetting | string;
              if (typeof parsed === "string") {
                setDesignatedGatewayHost(parsed);
              } else {
                setDesignatedGatewayHost(parsed.hostname || "");
              }
            } catch {
              setDesignatedGatewayHost(gatewaySetting);
            }
        }).catch(console.error);
    }
  }, [connection, open]);

  const handleTabToggle = async (tabId: string, checked: boolean) => {
      if (!connection) return;
      try {
          if (checked) {
              await invoke("assign_to_tab", { tabId, resourceId: connection.id, resourceType: "rdp" });
              setAssignedTabIds(prev => [...prev, tabId]);
          } else {
              await invoke("remove_from_tab", { tabId, resourceId: connection.id, resourceType: "rdp" });
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
        await invoke("delete_connection", { id: connection.id });
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

    const payload: UpdateConnectionPayload = {
      id: connection.id,
      name,
      host,
      username: username || null,
      tags_json: connection.tags_json,
      gateway_json: useDesignatedGateway
        ? (designatedGatewayHost.trim()
            ? JSON.stringify({ mode: "designated" } satisfies ConnectionGatewayConfig)
            : connection.gateway_json)
        : preservedGatewayJson,
      rdp_options_json: connection.rdp_options_json,
      icon,
      color,
      credential_id: credentialId,
    };

    try {
      await invoke("update_connection", { payload });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update connection:", error);
      alert("Failed to update: " + error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit RDP Connection</DialogTitle>
          <DialogDescription>
            Update details for {connection?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-host">Host</Label>
            <Input id="edit-host" value={host} onChange={(e) => setHost(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-user">Username</Label>
            <Input id="edit-user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
              <div className="pr-4">
                <Label htmlFor="edit-designated-gateway" className="text-sm cursor-pointer">Use Designated RD Gateway</Label>
                <p className="text-xs text-muted-foreground">
                  {designatedGatewayHost.trim()
                    ? `Gateway: ${designatedGatewayHost.trim()}`
                    : "Configure a designated gateway in Settings to enable this option."}
                </p>
                {!useDesignatedGateway && preservedGatewayJson && (
                  <p className="text-xs text-muted-foreground">
                    Existing custom gateway settings will be preserved.
                  </p>
                )}
              </div>
              <Switch
                id="edit-designated-gateway"
                checked={useDesignatedGateway}
                onCheckedChange={setUseDesignatedGateway}
                disabled={!designatedGatewayHost.trim() && !useDesignatedGateway}
              />
            </div>
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
