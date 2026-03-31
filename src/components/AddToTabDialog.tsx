import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tab, TabAssignment } from "@/types";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabIcon } from "./TabIcon";

interface AddToTabDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceId: string;
    resourceType: string;
}

export function AddToTabDialog({ open, onOpenChange, resourceId, resourceType }: AddToTabDialogProps) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [assignments, setAssignments] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const tabsData = await invoke<Tab[]>("get_tabs");
            setTabs(tabsData);

            // Check assignments for each tab
            // This is n+1 but scale is small. Better: get_tab_assignments for each? 
            // Or get all assignments? We don't have a "get_resource_assignments" command.
            // For now, let's just show available tabs and when clicking, toggle.
            // To show 'checked' state correctly, we need to know if it's assigned.
            // I'll add `is_assigned_to_tab` command or just fetch all assignments for a tab and check.
            
            // Optimization: Fetch all assignments for all tabs is too much.
            // Let's just trust the user action: Click to add. If already added, ignore.
            // Or ideally, show if it is added.
            
            // Let's fetch assignments for each tab in parallel.
            const status = new Set<string>();
            await Promise.all(tabsData.map(async (t) => {
                const assigns = await invoke<TabAssignment[]>("get_tab_assignments", { tabId: t.id });
                if (assigns.some(a => a.resource_id === resourceId && a.resource_type === resourceType)) {
                    status.add(t.id);
                }
            }));
            setAssignments(status);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchData();
        }
    }, [open]);

    const toggleAssignment = async (tabId: string, current: boolean) => {
        try {
            if (current) {
                await invoke("remove_from_tab", { tabId, resourceId, resourceType });
                assignments.delete(tabId);
            } else {
                await invoke("assign_to_tab", { tabId, resourceId, resourceType });
                assignments.add(tabId);
            }
            setAssignments(new Set(assignments)); // Force re-render
        } catch (e) {
            alert("Error: " + e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add to Tab</DialogTitle>
                    <DialogDescription>Select tabs to assign this resource to.</DialogDescription>
                </DialogHeader>
                
                <div className="py-2 space-y-2 max-h-[300px] overflow-y-auto">
                    {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                    {!loading && tabs.length === 0 && <div className="text-center text-sm text-muted-foreground">No tabs created. Create one in the main view first.</div>}
                    {!loading && tabs.map(tab => {
                        const isAssigned = assignments.has(tab.id);
                        return (
                            <div 
                                key={tab.id} 
                                className={cn(
                                    "flex items-center justify-between gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                                    isAssigned ? "bg-primary/10 border-primary/50" : "hover:bg-muted"
                                )}
                                onClick={() => toggleAssignment(tab.id, isAssigned)}
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <TabIcon icon={tab.icon} color={tab.color} />
                                    <span className="truncate text-sm font-medium">{tab.name}</span>
                                </div>
                                {isAssigned && <Check className="h-4 w-4 text-primary" />}
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
