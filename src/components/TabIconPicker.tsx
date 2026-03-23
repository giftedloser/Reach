import { useEffect, useMemo, useState } from "react";
import { Type, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ICON_REGISTRY,
  TAB_COLOR_PRESETS,
  createLetterTabIcon,
  getTabIconLetters,
  isLetterTabIcon,
  normalizeIconName,
  normalizeTabLetters,
} from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import { TabIcon } from "./TabIcon";

interface TabIconPickerProps {
  icon: string | null;
  color: string | null;
  onIconChange: (icon: string | null) => void;
  onColorChange: (color: string | null) => void;
}

type PickerMode = "icons" | "letters";

export function TabIconPicker({ icon, color, onIconChange, onColorChange }: TabIconPickerProps) {
  const [mode, setMode] = useState<PickerMode>(isLetterTabIcon(icon) ? "letters" : "icons");
  const [letterInput, setLetterInput] = useState(getTabIconLetters(icon));

  useEffect(() => {
    setMode(isLetterTabIcon(icon) ? "letters" : "icons");
    setLetterInput(getTabIconLetters(icon));
  }, [icon]);

  const iconEntries = useMemo(() => Object.entries(ICON_REGISTRY), []);

  const handleLetterChange = (value: string) => {
    const letters = normalizeTabLetters(value);
    setLetterInput(letters);
    onIconChange(createLetterTabIcon(letters));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Tab Icon</Label>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background/50 p-1">
          <Button
            type="button"
            variant={mode === "icons" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setMode("icons")}
          >
            <Shapes className="h-3.5 w-3.5" />
            Icons
          </Button>
          <Button
            type="button"
            variant={mode === "letters" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => {
              setMode("letters");
              if (!isLetterTabIcon(icon)) {
                handleLetterChange(letterInput);
              }
            }}
          >
            <Type className="h-3.5 w-3.5" />
            Letters
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3">
        <TabIcon icon={icon} color={color} size="lg" />
        <div className="space-y-1">
          <div className="text-sm font-medium">Live Preview</div>
          <div className="text-xs text-muted-foreground">
            {isLetterTabIcon(icon) ? "Custom letter badge" : normalizeIconName(icon) || "Default tab icon"}
          </div>
        </div>
      </div>

      {mode === "icons" ? (
        <div className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto rounded-xl border border-border/40 bg-muted/20 p-3">
          {iconEntries.map(([name, IconComp]) => (
            <button
              key={name}
              type="button"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                normalizeIconName(icon) === name && !isLetterTabIcon(icon)
                  ? "border-primary/60 bg-primary/12 text-primary"
                  : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/60 hover:text-foreground",
              )}
              onClick={() => onIconChange(name)}
              title={name}
            >
              <IconComp className="h-4 w-4" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Letters</Label>
            <Input
              value={letterInput}
              maxLength={2}
              placeholder="AB"
              className="h-9 uppercase"
              onChange={(event) => handleLetterChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Use 1-2 uppercase characters.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Badge Color</Label>
        <div className="flex flex-wrap gap-2">
          {TAB_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cn(
                "h-7 w-7 rounded-full border transition-transform hover:scale-105",
                color === preset ? "scale-105 border-white/70 ring-2 ring-primary/40" : "border-white/10",
              )}
              style={{ backgroundColor: preset }}
              onClick={() => onColorChange(preset)}
              title={preset}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => onColorChange(null)}
          >
            Auto
          </Button>
          {(icon || color) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => {
                onIconChange(null);
                onColorChange(null);
                setLetterInput("");
                setMode("icons");
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
