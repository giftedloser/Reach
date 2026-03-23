import { useEffect, useRef, useState } from "react";
import {
  Search,
  List,
  LayoutGrid,
  Minimize2,
  Grid,
  Maximize2,
  Sun,
  Moon,
  Palette,
  Minus,
  Square,
  X,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUI } from "@/contexts/UIContext";
import { ThemeName } from "@/lib/theme";

interface TopbarProps {
  globalFilter: string;
  onFilterChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  theme: ThemeName;
  onCycleTheme: () => void;
}

export function Topbar({
  globalFilter,
  onFilterChange,
  searchInputRef,
  theme,
  onCycleTheme,
}: TopbarProps) {
  const { viewMode, setViewMode, density, setDensity } = useUI();
  const [isMaximized, setIsMaximized] = useState(false);
  const dragStateRef = useRef<{
    active: boolean;
    dragging: boolean;
    x: number;
    y: number;
  }>({
    active: false,
    dragging: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized().then(setIsMaximized);
    let unlisten: (() => void) | undefined;
    win.onResized(() => {
      win.isMaximized().then(setIsMaximized);
    }).then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.active || dragState.dragging) return;

      const movedEnough =
        Math.abs(event.clientX - dragState.x) > 4 ||
        Math.abs(event.clientY - dragState.y) > 4;

      if (!movedEnough) return;

      dragState.dragging = true;
      void getCurrentWindow().startDragging();
    };

    const handleMouseUp = () => {
      dragStateRef.current.active = false;
      dragStateRef.current.dragging = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const cycleDensity = () => {
    if (density === "compact") setDensity("standard");
    else if (density === "standard") setDensity("comfortable");
    else setDensity("compact");
  };

  const handleMinimize = async () => {
    await getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    await getCurrentWindow().toggleMaximize();
  };

  const handleClose = async () => {
    await getCurrentWindow().close();
  };

  return (
    <header className="topbar flex h-14 items-center justify-between gap-3 px-4 select-none">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="relative z-20 w-full max-w-sm"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search... (Ctrl+K)"
            className="h-9 rounded-lg border-border/50 bg-background/60 pl-9 text-sm"
            value={globalFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>

        <div
          className="h-9 min-w-8 flex-1 rounded-lg"
          title="Drag window"
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            dragStateRef.current.active = true;
            dragStateRef.current.dragging = false;
            dragStateRef.current.x = event.clientX;
            dragStateRef.current.y = event.clientY;
          }}
          onDoubleClick={() => {
            void handleMaximize();
          }}
        />
      </div>

      <div
        className="relative z-20 flex shrink-0 items-center gap-1.5"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center rounded-lg border border-border/50 bg-background/60 p-0.5">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setViewMode("list")}
            title="List View"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "icon" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setViewMode("icon")}
            title="Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg border border-border/50 bg-background/60"
          onClick={cycleDensity}
          title={`Density: ${density}`}
        >
          {density === "compact" ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : density === "standard" ? (
            <Grid className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg border border-border/50 bg-background/60"
          onClick={onCycleTheme}
          title={`Theme: ${theme}`}
        >
          {theme === "editorial-light" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : theme === "dark-gold" ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Palette className="h-3.5 w-3.5" />
          )}
        </Button>

        <div className="mx-1 h-4 w-px bg-border/50" aria-hidden />

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              void handleMinimize();
            }}
            title="Minimize"
            className="flex h-8 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleMaximize();
            }}
            title={isMaximized ? "Restore" : "Maximize"}
            className="flex h-8 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Square className="h-3 w-3" style={{ strokeWidth: isMaximized ? 1.5 : 2 }} />
          </button>
          <button
            type="button"
            onClick={() => {
              void handleClose();
            }}
            title="Close"
            className="flex h-8 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
