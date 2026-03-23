import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettingsView } from "./SettingsView";
import { ThemeName } from "@/lib/theme";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTheme: ThemeName;
    onThemeChange: (theme: ThemeName) => void;
}

export function SettingsDialog({ open, onOpenChange, currentTheme, onThemeChange }: SettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto no-scrollbar flex flex-col gap-0">
                <DialogHeader className="mb-4">
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure application preferences.
                    </DialogDescription>
                </DialogHeader>
                <SettingsView currentTheme={currentTheme} onThemeChange={onThemeChange} />
            </DialogContent>
        </Dialog>
    )
}
