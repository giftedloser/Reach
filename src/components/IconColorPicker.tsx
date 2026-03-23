import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { COLOR_PRESETS, ICON_REGISTRY, normalizeIconName } from "@/lib/icon-registry";

export { getIconComponent } from "@/lib/icon-registry";

// Combined picker
interface IconColorPickerProps {
  icon: string | null;
  color: string | null;
  onIconChange: (icon: string | null) => void;
  onColorChange: (color: string | null) => void;
}

export function IconColorPicker({ icon, color, onIconChange, onColorChange }: IconColorPickerProps) {
  const [showIcons, setShowIcons] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const normalizedIcon = normalizeIconName(icon);
  const SelectedIcon = normalizedIcon ? ICON_REGISTRY[normalizedIcon] : null;

  return (
    <div className="space-y-3">
      <Label className="text-sm">Appearance</Label>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all hover:border-primary/50 shrink-0"
          style={{ backgroundColor: color ? `${color}14` : undefined, borderColor: color || "hsl(var(--border))" }}
          onClick={() => { setShowIcons(!showIcons); setShowColors(false); }}
          title="Pick icon"
        >
          {SelectedIcon ? <SelectedIcon className="h-5 w-5" style={{ color: color || undefined }} /> : <span className="text-[10px] text-muted-foreground">Icon</span>}
        </button>
        <button
          type="button"
          className="h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-105 shrink-0"
          style={{ backgroundColor: color || "#94a3b8", borderColor: color || "#94a3b8" }}
          onClick={() => { setShowColors(!showColors); setShowIcons(false); }}
          title="Pick color"
        />
        {(icon || color) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => { onIconChange(null); onColorChange(null); }}
          >
            Reset
          </Button>
        )}
      </div>

      {showIcons && (
        <div className="grid grid-cols-8 gap-1.5 p-3 rounded-xl border border-border/40 bg-muted/20 max-h-40 overflow-y-auto">
          {Object.entries(ICON_REGISTRY).map(([name, IconComp]) => (
            <button
              key={name}
              type="button"
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:bg-primary/10 ${normalizedIcon === name ? "bg-primary/20 ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
              onClick={() => { onIconChange(name); setShowIcons(false); }}
              title={name}
            >
              <IconComp className="h-4 w-4" style={{ color: color || undefined }} />
            </button>
          ))}
        </div>
      )}

      {showColors && (
        <div className="flex flex-wrap gap-2.5 p-3 rounded-xl border border-border/40 bg-muted/20">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`h-8 w-8 rounded-full transition-all hover:scale-110 ${color === c.value ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : ""}`}
              style={{ backgroundColor: c.value }}
              onClick={() => { onColorChange(c.value); setShowColors(false); }}
              title={c.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
