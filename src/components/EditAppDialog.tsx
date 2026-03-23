import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
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
import { App, UpdateAppPayload, Tab } from "@/types";
import { Terminal, Monitor, Shield, AppWindow, Folder, Trash2 } from "lucide-react";
import { IconColorPicker } from "./IconColorPicker";
import { TabIcon } from "./TabIcon";
import { CredentialPicker } from "./CredentialPicker";

interface EditAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: App | null;
  onSuccess: () => void;
}

export function EditAppDialog({ open, onOpenChange, app, onSuccess }: EditAppDialogProps) {
  const [name, setName] = useState("");
  const [exePath, setExePath] = useState("");
  const [workingDir, setWorkingDir] = useState("");
  const [args, setArgs] = useState("");
  const [runAsAdmin, setRunAsAdmin] = useState(false);
  const [typeLabel, setTypeLabel] = useState("App");

  const [allTabs, setAllTabs] = useState<Tab[]>([]);
  const [assignedTabIds, setAssignedTabIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [credentialId, setCredentialId] = useState<string | null>(null);

  useEffect(() => {
    if (app && open) {
        setName(app.name);
        setExePath(app.exe_path);
        setWorkingDir(app.working_dir || "");
        setArgs(app.args || "");
        setRunAsAdmin(app.run_as_admin);
        setCredentialId(app.credential_id || null);

        if (app.tags_json.includes("type:ssh")) setTypeLabel("SSH Session");
        else if (app.tags_json.includes("type:rdp-gateway")) setTypeLabel("RD Gateway");
        else if (app.tags_json.includes("type:rdp")) setTypeLabel("RDP Session");
        else setTypeLabel("Application");

        setIcon(app.icon || null);
        setColor(app.color || null);

        Promise.all([
            invoke<Tab[]>("get_tabs"),
            invoke<string[]>("get_resource_tab_assignments", { resourceId: app.id })
        ]).then(([tabs, assignments]) => {
            setAllTabs(tabs);
            setAssignedTabIds(assignments);
        }).catch(console.error);
    }
  }, [app, open]);

  const handleBrowse = async () => {
    try {
        const selected = await openDialog({
            multiple: false,
            filters: [{
                name: 'Executables',
                extensions: ['exe', 'bat', 'cmd', 'ps1', 'lnk', 'rdp']
            }]
        });
        if (selected && typeof selected === 'string') {
            setExePath(selected);
        }
    } catch (err) {
        console.error("Failed to open file picker:", err);
    }
  };

  const handleTabToggle = async (tabId: string, checked: boolean) => {
      if (!app) return;
      try {
          if (checked) {
              await invoke("assign_to_tab", { tabId, resourceId: app.id, resourceType: "app" });
              setAssignedTabIds(prev => [...prev, tabId]);
          } else {
              await invoke("remove_from_tab", { tabId, resourceId: app.id });
              setAssignedTabIds(prev => prev.filter(id => id !== tabId));
          }
      } catch (err) {
          console.error("Failed to toggle tab:", err);
          alert("Failed to update tab assignment");
      }
  };

  const handleDelete = async () => {
      if (!app) return;
      if (!confirm(`Are you sure you want to delete "${app.name}"? This cannot be undone.`)) return;

      setIsLoading(true);
      try {
          await invoke("delete_app", { id: app.id });
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
    if (!app) return;
    setIsLoading(true);

    const payload: UpdateAppPayload = {
      id: app.id,
      name,
      exe_path: exePath,
      working_dir: workingDir || null,
      args: args || null,
      run_as_admin: runAsAdmin,
      tags_json: app.tags_json,
      icon,
      color,
      credential_id: credentialId,
    };

    try {
      await invoke("update_app", { payload });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update app:", error);
      alert("Failed to update: " + error);
    } finally {
        setIsLoading(false);
    }
  };

  const TypeIcon = typeLabel === "SSH Session" ? Terminal
    : typeLabel === "RDP Session" ? Monitor
    : typeLabel === "RD Gateway" ? Shield
    : AppWindow;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Edit {typeLabel}</DialogTitle>
          <DialogDescription>
            Update configuration for {app?.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
            <TypeIcon className="h-4 w-4" />
            <span>{typeLabel}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exe_path">Target</Label>
            <div className="flex gap-2">
              <Input id="exe_path" value={exePath} onChange={(e) => setExePath(e.target.value)} className="flex-1" required />
              <Button type="button" variant="outline" size="icon" onClick={handleBrowse} title="Browse">
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="args">Arguments</Label>
            <Input id="args" value={args} onChange={(e) => setArgs(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="working_dir">Working Directory</Label>
            <Input id="working_dir" value={workingDir} onChange={(e) => setWorkingDir(e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
            <Label htmlFor="edit-admin" className="text-sm cursor-pointer">Run as Administrator</Label>
            <Switch id="edit-admin" checked={runAsAdmin} onCheckedChange={setRunAsAdmin} />
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
