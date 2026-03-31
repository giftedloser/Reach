import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tab } from "@/types";
import { useUI } from "@/contexts/UIContext";

import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { RDPView } from "@/components/RDPView";
import { AppsView } from "@/components/AppsView";
import { SSHView } from "@/components/SSHView";
import { AllView } from "@/components/AllView";
import { SettingsDialog } from "@/components/SettingsDialog";
import { UnifiedAddDialog } from "@/components/UnifiedAddDialog";
import { TabsManagerDialog } from "@/components/TabsManagerDialog";
import { CustomTabView } from "@/components/CustomTabView";
import { ThemeName, THEME_ORDER, getNextTheme, normalizeTheme } from "@/lib/theme";

const BUILT_IN_TABS = ["all", "apps", "rdp", "ssh"];

function App() {
  const [activeTab, setActiveTab] = useState("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTabsManagerOpen, setIsTabsManagerOpen] = useState(false);
  const { density } = useUI();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const fetchTabs = useCallback(async () => {
    try {
      const data = await invoke<Tab[]>("get_tabs");
      setTabs(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    if (BUILT_IN_TABS.includes(activeTab)) {
      return;
    }

    const tabStillExists = tabs.some((tab) => tab.id === activeTab);
    if (!tabStillExists) {
      setActiveTab("all");
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    setGlobalFilter("");
  }, [activeTab]);

  const [theme, setTheme] = useState<ThemeName>(() => normalizeTheme(localStorage.getItem("theme")));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...THEME_ORDER);
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === "0") setActiveTab("all");
        if (e.key === "1") setActiveTab("apps");
        if (e.key === "2") setActiveTab("rdp");
        if (e.key === "3") setActiveTab("ssh");
        if (e.key === ",") {
          e.preventDefault();
          setIsSettingsOpen(true);
        }
        if (e.key === "k") {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const cycleTheme = () => setTheme(getNextTheme(theme));

  return (
    <div className={`h-screen w-screen overflow-hidden bg-background text-foreground antialiased density-${density}`}>
      <div className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(circle_at_top_left,hsl(var(--primary)/0.06),transparent_44%),radial-gradient(circle_at_bottom_right,hsl(var(--foreground)/0.03),transparent_48%)]" />

      <div className="relative flex h-full w-full">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
          onAddClick={() => setIsAddDialogOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onTabsManagerClick={() => setIsTabsManagerOpen(true)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            globalFilter={globalFilter}
            onFilterChange={setGlobalFilter}
            searchInputRef={searchInputRef}
            theme={theme}
            onCycleTheme={cycleTheme}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background/30">
            {activeTab === "all" && (
              <AllView filter={globalFilter} key={`all-${refreshTrigger}`} />
            )}
            {activeTab === "apps" && (
              <AppsView filter={globalFilter} key={`apps-${refreshTrigger}`} />
            )}
            {activeTab === "rdp" && (
              <RDPView filter={globalFilter} key={`rdp-${refreshTrigger}`} />
            )}
            {activeTab === "ssh" && (
              <SSHView filter={globalFilter} key={`ssh-${refreshTrigger}`} />
            )}
            {tabs.map((tab) =>
              activeTab === tab.id ? (
                <CustomTabView
                  key={tab.id}
                  tabId={tab.id}
                  filter={globalFilter}
                />
              ) : null
            )}
          </main>
        </div>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        currentTheme={theme}
        onThemeChange={(value) => setTheme(value as ThemeName)}
      />

      <UnifiedAddDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSuccess={triggerRefresh} />

      <TabsManagerDialog open={isTabsManagerOpen} onOpenChange={setIsTabsManagerOpen} onSuccess={fetchTabs} />
    </div>
  );
}

export default App;
