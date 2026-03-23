import { createContext, useContext, useState } from "react";

type ViewMode = "list" | "icon";
type Density = "compact" | "standard" | "comfortable";

interface UIState {
  viewMode: ViewMode;
  density: Density;
  sidebarCollapsed: boolean;
  setViewMode: (mode: ViewMode) => void;
  setDensity: (density: Density) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const UIContext = createContext<UIState | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage with defaults
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem("ui_view_mode") as ViewMode) || "list";
  });
  
  const [density, setDensityState] = useState<Density>(() => {
    return (localStorage.getItem("ui_density") as Density) || "standard";
  });

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    const stored = localStorage.getItem("ui_sidebar_collapsed");
    return stored !== null ? stored === "true" : false;
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem("ui_view_mode", mode);
  };

  const setDensity = (d: Density) => {
    setDensityState(d);
    localStorage.setItem("ui_density", d);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem("ui_sidebar_collapsed", String(collapsed));
  };

  return (
    <UIContext.Provider value={{
      viewMode,
      density,
      sidebarCollapsed,
      setViewMode,
      setDensity,
      setSidebarCollapsed,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
