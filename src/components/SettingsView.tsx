import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from '@tauri-apps/plugin-dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash, Key, Palette, Terminal, Database, Plus, KeyRound, Pencil, Monitor } from "lucide-react";
import { DesignatedGatewaySetting, StoredCredential } from "@/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeName, THEME_OPTIONS } from "@/lib/theme";

interface SettingsViewProps {
    currentTheme: ThemeName;
    onThemeChange: (theme: ThemeName) => void;
}

function SectionCard({ icon: Icon, title, children }: { icon: typeof Key; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold tracking-tight neo-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function SettingsView({ currentTheme, onThemeChange }: SettingsViewProps) {
  const [puttyPath, setPuttyPath] = useState("");
  const [rdGatewayHost, setRdGatewayHost] = useState("");

  useEffect(() => {
      invoke<string | null>("get_setting", { key: "putty_path" })
          .then(val => {
              if (val) {
                  try {
                      setPuttyPath(JSON.parse(val));
                  } catch {
                      setPuttyPath(val);
                  }
              }
          })
          .catch(console.error);

      invoke<string | null>("get_setting", { key: "rd_gateway" })
          .then(val => {
              if (!val) return;

              try {
                  const parsed = JSON.parse(val) as DesignatedGatewaySetting | string;
                  if (typeof parsed === "string") {
                      setRdGatewayHost(parsed);
                  } else {
                      setRdGatewayHost(parsed.hostname || "");
                  }
              } catch {
                  setRdGatewayHost(val);
              }
          })
          .catch(console.error);
  }, []);

  const handleExport = async () => {
    try {
        const path = await save({
            filters: [{
                name: 'JSON Backup',
                extensions: ['json']
            }],
            defaultPath: 'reach-backup.json'
        });
        if (path) {
            await invoke("export_data", { path });
            alert("Export successful!");
        }
    } catch (e) {
        alert("Export failed: " + e);
    }
  };

  const handleImport = async () => {
      try {
        const path = await open({
            filters: [{
                name: 'JSON Backup',
                extensions: ['json']
            }]
        });
        if (path) {
            await invoke("import_data", { path });
            alert("Import successful! Please restart the app or refresh views.");
        }
      } catch (e) {
          alert("Import failed: " + e);
      }
  };

  const savePuttyPath = async () => {
      try {
          await invoke("save_setting", { key: "putty_path", valueJson: JSON.stringify(puttyPath) });
          alert("PuTTY path saved!");
      } catch (e) {
          alert("Error: " + e);
      }
  };

  const saveRdGateway = async () => {
      try {
          await invoke("save_setting", {
              key: "rd_gateway",
              valueJson: JSON.stringify({ hostname: rdGatewayHost.trim() }),
          });
          alert(rdGatewayHost.trim() ? "RD Gateway saved!" : "RD Gateway cleared.");
      } catch (e) {
          alert("Error: " + e);
      }
  };

  return (
    <div className="space-y-4">
      <SectionCard icon={KeyRound} title="Saved Credentials">
        <p className="text-sm text-muted-foreground mb-4">
            Manage credentials for RDP, SSH, and app connections. Passwords are stored in Windows Credential Manager.
        </p>
        <CredentialManager />
      </SectionCard>

      <SectionCard icon={Terminal} title="General">
        <div className="space-y-2">
          <Label className="text-sm">PuTTY Executable Path</Label>
          <div className="flex gap-2">
            <Input
              value={puttyPath}
              onChange={e => setPuttyPath(e.target.value)}
              placeholder="C:\...\putty.exe"
              className="flex-1 h-9 text-sm"
            />
            <Button variant="secondary" onClick={savePuttyPath} className="h-9 px-4 text-sm shrink-0">Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">Required for launching SSH sessions.</p>
        </div>
      </SectionCard>

      <SectionCard icon={Monitor} title="RDP">
        <div className="space-y-2">
          <Label className="text-sm">Designated RD Gateway</Label>
          <div className="flex gap-2">
            <Input
              value={rdGatewayHost}
              onChange={e => setRdGatewayHost(e.target.value)}
              placeholder="gateway.example.com"
              className="flex-1 h-9 text-sm"
            />
            <Button variant="secondary" onClick={saveRdGateway} className="h-9 px-4 text-sm shrink-0">Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional. RDP connections can opt into using this gateway for multi-hop access.
          </p>
        </div>
      </SectionCard>

      <SectionCard icon={Palette} title="Appearance">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Theme</Label>
          <Select value={currentTheme} onValueChange={onThemeChange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((themeOption) => (
                <SelectItem key={themeOption.id} value={themeOption.id}>
                  {themeOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {THEME_OPTIONS.find((themeOption) => themeOption.id === currentTheme)?.description}
        </p>
      </SectionCard>

      <SectionCard icon={Database} title="Data Management">
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} className="flex-1 h-9">Export Config</Button>
          <Button variant="outline" onClick={handleImport} className="flex-1 h-9">Import Config</Button>
        </div>
      </SectionCard>
    </div>
  );
}

function CredentialManager() {
    const [creds, setCreds] = useState<StoredCredential[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCred, setEditingCred] = useState<StoredCredential | null>(null);

    const fetchCreds = useCallback(async () => {
        try {
            const list = await invoke<StoredCredential[]>("list_stored_credentials");
            setCreds(list);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchCreds();
    }, [fetchCreds]);

    const handleDelete = async (cred: StoredCredential) => {
        if (!confirm(`Delete credential "${cred.label}"? Any connections using it will revert to prompting for credentials.`)) return;
        try {
            await invoke("delete_stored_credential", { id: cred.id });
            fetchCreds();
        } catch (e) {
            alert("Failed: " + e);
        }
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {creds.length === 0 && <div className="text-sm text-muted-foreground italic py-2">No credentials saved. Add one to auto-login to connections.</div>}
                {creds.map(c => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Key className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{c.label}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.username}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingCred(c)} className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary" title="Edit / Update Password">
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" title="Delete">
                            <Trash className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} className="w-full h-9">
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Credential
            </Button>

            <AddCredDialog open={isAddOpen} onOpenChange={setIsAddOpen} onSuccess={fetchCreds} />
            <EditCredDialog credential={editingCred} onOpenChange={(v) => { if (!v) setEditingCred(null); }} onSuccess={fetchCreds} />
        </div>
    )
}

function AddCredDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (v: boolean) => void, onSuccess: () => void }) {
    const [label, setLabel] = useState("");
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await invoke("create_stored_credential", {
                payload: { label, username: user, password: pass }
            });
            onSuccess();
            onOpenChange(false);
            setLabel("");
            setUser("");
            setPass("");
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Credential</DialogTitle>
                    <DialogDescription>Save a credential for use with connections and apps. Password is stored securely in Windows Credential Manager.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="e.g. Domain Admin, Dev Server"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            placeholder="DOMAIN\username or user@domain.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Credential"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function EditCredDialog({ credential, onOpenChange, onSuccess }: { credential: StoredCredential | null, onOpenChange: (v: boolean) => void, onSuccess: () => void }) {
    const [label, setLabel] = useState("");
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (credential) {
            setLabel(credential.label);
            setUser(credential.username);
            setPass("");
        }
    }, [credential]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credential) return;
        setLoading(true);
        try {
            await invoke("update_stored_credential", {
                payload: {
                    id: credential.id,
                    label,
                    username: user,
                    password: pass || null,
                }
            });
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!credential} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Credential</DialogTitle>
                    <DialogDescription>Update the label, username, or password. Leave password blank to keep the existing one.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            placeholder="Leave blank to keep current"
                        />
                    </div>
                    <DialogFooter className="pt-2">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Update Credential"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
