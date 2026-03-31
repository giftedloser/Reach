import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Terminal, Command, Folder } from "lucide-react";
import { useEffect } from "react";
import { ConnectionGatewayConfig, DesignatedGatewaySetting } from "@/types";
import { CredentialPicker } from "./CredentialPicker";

interface UnifiedAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UnifiedAddDialog({ open, onOpenChange, onSuccess }: UnifiedAddDialogProps) {
  const [type, setType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");

  const [port, setPort] = useState("22");
  const [exePath, setExePath] = useState("");
  const [args, setArgs] = useState("");
  const [workingDir, setWorkingDir] = useState("");
  const [runAsAdmin, setRunAsAdmin] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [useDesignatedGateway, setUseDesignatedGateway] = useState(false);
  const [designatedGatewayHost, setDesignatedGatewayHost] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setUseDesignatedGateway(false);
    invoke<string | null>("get_setting", { key: "rd_gateway" })
      .then((value) => {
        if (!value) {
          setDesignatedGatewayHost("");
          return;
        }

        try {
          const parsed = JSON.parse(value) as DesignatedGatewaySetting | string;
          if (typeof parsed === "string") {
            setDesignatedGatewayHost(parsed);
          } else {
            setDesignatedGatewayHost(parsed.hostname || "");
          }
        } catch {
          setDesignatedGatewayHost(value);
        }
      })
      .catch((error) => {
        console.error("Failed to load RD Gateway setting:", error);
        setDesignatedGatewayHost("");
      });
  }, [open]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === "rdp") {
        await invoke("save_connection", {
          payload: {
            name,
            host,
            username: username || null,
            tags_json: "[]",
            gateway_json: useDesignatedGateway && designatedGatewayHost.trim()
              ? JSON.stringify({ mode: "designated" } satisfies ConnectionGatewayConfig)
              : null,
            rdp_options_json: null,
            icon: null,
            color: null,
            credential_id: credentialId,
          }
        });
      } else if (type === "ssh") {
        await invoke("save_ssh_connection", {
          payload: {
            name,
            host,
            port: parseInt(port) || 22,
            username: username || null,
            tags_json: "[]",
            icon: null,
            color: null,
            credential_id: credentialId,
          }
        });
      } else if (type === "app") {
        await invoke("save_app", {
          payload: {
            name,
            exe_path: exePath,
            working_dir: workingDir || null,
            args: args || null,
            run_as_admin: runAsAdmin,
            tags_json: "[]",
            icon: null,
            color: null,
            credential_id: credentialId,
          }
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: unknown) {
      console.error("Failed to save:", error);
      alert(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setHost("");
    setUsername("");
    setPort("22");
    setExePath("");
    setArgs("");
    setWorkingDir("");
    setRunAsAdmin(false);
    setCredentialId(null);
    setUseDesignatedGateway(false);
  };

  const showCredentialPicker = type === "rdp" || type === "ssh" || type === "app";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
          <DialogDescription>
            Create a new connection or application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rdp">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" style={{ color: "var(--theme-resource-rdp)" }} />
                    <span>RDP Connection</span>
                  </div>
                </SelectItem>
                <SelectItem value="ssh">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" style={{ color: "var(--theme-resource-ssh)" }} />
                    <span>SSH Session</span>
                  </div>
                </SelectItem>
                <SelectItem value="app">
                  <div className="flex items-center gap-2">
                    <Command className="h-4 w-4" style={{ color: "var(--theme-resource-app)" }} />
                    <span>Application / Link / Script</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type !== "" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Resource"
                required
              />
            </div>
          )}

          {(type === "rdp" || type === "ssh") && (
            <div className="space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.10"
                required
              />
            </div>
          )}

          {type === "ssh" && (
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="22"
              />
            </div>
          )}

          {(type === "rdp" || type === "ssh") && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Optional"
              />
            </div>
          )}

          {type === "rdp" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                <div className="pr-4">
                  <Label htmlFor="designated-gateway" className="text-sm cursor-pointer">Use Designated RD Gateway</Label>
                  <p className="text-xs text-muted-foreground">
                    {designatedGatewayHost.trim()
                      ? `Gateway: ${designatedGatewayHost.trim()}`
                      : "Configure a designated gateway in Settings to enable this option."}
                  </p>
                </div>
                <Switch
                  id="designated-gateway"
                  checked={useDesignatedGateway}
                  onCheckedChange={setUseDesignatedGateway}
                  disabled={!designatedGatewayHost.trim()}
                />
              </div>
            </div>
          )}

          {type === "app" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="exePath">Target</Label>
                <div className="flex gap-2">
                  <Input
                    id="exePath"
                    value={exePath}
                    onChange={(e) => setExePath(e.target.value)}
                    placeholder="C:\App.exe, https://web.site, or script.ps1"
                    className="flex-1"
                    required
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleBrowse} title="Browse">
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="args">Arguments</Label>
                <Input
                  id="args"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="Optional arguments"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workingDir">Working Directory</Label>
                <Input
                  id="workingDir"
                  value={workingDir}
                  onChange={(e) => setWorkingDir(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                <Label htmlFor="admin" className="text-sm cursor-pointer">Run as Administrator</Label>
                <Switch id="admin" checked={runAsAdmin} onCheckedChange={setRunAsAdmin} />
              </div>
            </>
          )}

          {showCredentialPicker && (
            <CredentialPicker value={credentialId} onChange={setCredentialId} />
          )}

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !type}>
              {isLoading ? "Saving..." : "Create Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
