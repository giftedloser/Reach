import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tab } from "@/types";
import { Check, Pencil, Plus, Trash, X } from "lucide-react";
import { TabIcon } from "./TabIcon";
import { TabIconPicker } from "./TabIconPicker";

interface TabDraft {
    name: string;
    icon: string | null;
    color: string | null;
}

interface TabsManagerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function TabsManagerDialog({ open, onOpenChange, onSuccess }: TabsManagerDialogProps) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [createDraft, setCreateDraft] = useState<TabDraft>({ name: "", icon: null, color: null });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<TabDraft>({ name: "", icon: null, color: null });
    const [loading, setLoading] = useState(false);

    const fetchTabs = async () => {
        try {
            const data = await invoke<Tab[]>("get_tabs");
            setTabs(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (open) {
            fetchTabs();
        }
    }, [open]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createDraft.name.trim()) return;
        setLoading(true);
        try {
            await invoke("create_tab", {
                name: createDraft.name.trim(),
                icon: createDraft.icon,
                color: createDraft.color,
            });
            setCreateDraft({ name: "", icon: null, color: null });
            fetchTabs();
            onSuccess();
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (tab: Tab) => {
        setEditingId(tab.id);
        setEditDraft({
            name: tab.name,
            icon: tab.icon,
            color: tab.color,
        });
    };

    const handleUpdate = async () => {
        if (!editingId || !editDraft.name.trim()) return;
        setLoading(true);
        try {
            await invoke("update_tab", {
                id: editingId,
                name: editDraft.name.trim(),
                icon: editDraft.icon,
                color: editDraft.color,
            });
            setEditingId(null);
            setEditDraft({ name: "", icon: null, color: null });
            fetchTabs();
            onSuccess();
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this tab? Assignments will be removed.")) return;
        try {
            await invoke("delete_tab", { id });
            fetchTabs();
            onSuccess();
        } catch (e) {
            alert("Error: " + e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Manage Tabs</DialogTitle>
                    <DialogDescription>Create custom tabs to organize your resources.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-border/40 bg-muted/15 p-3">
                        <div className="flex items-center gap-3">
                            <TabIcon icon={createDraft.icon} color={createDraft.color} size="lg" />
                            <Input
                                value={createDraft.name}
                                onChange={(e) => setCreateDraft((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="New tab name..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={loading} size="icon" title="Create Tab">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <TabIconPicker
                            icon={createDraft.icon}
                            color={createDraft.color}
                            onIconChange={(icon) => setCreateDraft((prev) => ({ ...prev, icon }))}
                            onColorChange={(color) => setCreateDraft((prev) => ({ ...prev, color }))}
                        />
                    </form>

                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                        {tabs.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-6 italic">
                                No custom tabs yet.
                            </div>
                        )}
                        {tabs.map(tab => (
                            <div key={tab.id} className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                                {editingId === tab.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <TabIcon icon={editDraft.icon} color={editDraft.color} size="lg" />
                                            <Input
                                                value={editDraft.name}
                                                onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                                                className="flex-1"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleUpdate}
                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                                                title="Save"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingId(null)}
                                                className="h-8 w-8 shrink-0 text-muted-foreground"
                                                title="Cancel"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <TabIconPicker
                                            icon={editDraft.icon}
                                            color={editDraft.color}
                                            onIconChange={(icon) => setEditDraft((prev) => ({ ...prev, icon }))}
                                            onColorChange={(color) => setEditDraft((prev) => ({ ...prev, color }))}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <TabIcon icon={tab.icon} color={tab.color} />
                                        <span className="text-sm flex-1 truncate">{tab.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => startEditing(tab)}
                                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                            title="Edit Tab"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tab.id)}
                                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
