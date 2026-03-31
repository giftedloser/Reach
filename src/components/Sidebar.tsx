import {
  LayoutDashboard,
  Command,
  Monitor,
  Terminal,
  Plus,
  Settings,
  FolderPlus,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReachLogo } from "./ReachLogo";
import { useUI } from "@/contexts/UIContext";
import { Tab } from "@/types";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getTabIconLetters } from "@/lib/icon-registry";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
  onAddClick: () => void;
  onSettingsClick: () => void;
  onTabsManagerClick: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon?: typeof LayoutDashboard;
  iconNode?: ReactNode;
}

export function Sidebar({
  activeTab,
  onTabChange,
  tabs,
  onAddClick,
  onSettingsClick,
  onTabsManagerClick,
}: SidebarProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useUI();

  const builtInItems: NavItem[] = [
    { id: "all", label: "All", icon: LayoutDashboard },
    { id: "apps", label: "Apps", icon: Command },
    { id: "rdp", label: "RDP", icon: Monitor },
    { id: "ssh", label: "SSH", icon: Terminal },
  ];

  return (
    <aside
      className={`sidebar flex flex-col h-full shrink-0 transition-all duration-200 ${
        sidebarCollapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-3 py-4 ${sidebarCollapsed ? "justify-center" : ""}`}>
        <ReachLogo className="h-7 w-7 shrink-0" />
        {!sidebarCollapsed && (
          <span className="display-font text-[15px] font-semibold tracking-tight text-foreground/80">
            Reach
          </span>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 no-scrollbar">
        {builtInItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={activeTab === item.id}
            collapsed={sidebarCollapsed}
            onClick={() => onTabChange(item.id)}
          />
        ))}

        {/* Custom tabs section */}
        {tabs.length > 0 && (
          <>
            <div className="my-2 border-t border-accent/25" />
            {tabs.map((tab) => (
              <NavButton
                key={tab.id}
                item={{
                  id: tab.id,
                  label: tab.name,
                  iconNode: (
                    <SidebarTabLetter
                      name={tab.name}
                      icon={tab.icon}
                      active={activeTab === tab.id}
                    />
                  ),
                }}
                active={activeTab === tab.id}
                collapsed={sidebarCollapsed}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 pb-3 space-y-0.5">
        <div className="mb-1 border-t border-accent/25" />

        <SidebarAction
          icon={Plus}
          label="Add"
          collapsed={sidebarCollapsed}
          onClick={onAddClick}
        />
        <SidebarAction
          icon={FolderPlus}
          label="Manage Tabs"
          collapsed={sidebarCollapsed}
          onClick={onTabsManagerClick}
        />
        <SidebarAction
          icon={Settings}
          label="Settings"
          collapsed={sidebarCollapsed}
          onClick={onSettingsClick}
        />

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size={sidebarCollapsed ? "icon" : "sm"}
          className={`w-full rounded-lg text-muted-foreground hover:text-foreground ${
            sidebarCollapsed ? "h-9 w-full justify-center" : "h-9 justify-start gap-2.5 px-2.5"
          }`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`flex w-full items-center rounded-lg text-sm font-medium transition-colors ${
        collapsed ? "h-9 justify-center" : "h-9 gap-2.5 px-2.5"
      } ${
        active
          ? "bg-primary/10 text-primary border-l-[3px] border-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {item.iconNode ?? (Icon ? <Icon className="h-4 w-4 shrink-0" /> : null)}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

function SidebarTabLetter({
  name,
  icon,
  active,
}: {
  name: string;
  icon: string | null;
  active: boolean;
}) {
  const configuredLetters = getTabIconLetters(icon);
  const fallbackLetter = name.trim().charAt(0).toUpperCase();
  const letter = (configuredLetters || fallbackLetter || "T").slice(0, 1);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center text-base leading-none",
        active ? "font-bold text-primary" : "font-semibold text-muted-foreground/85",
      )}
    >
      {letter}
    </span>
  );
}

function SidebarAction({
  icon: Icon,
  label,
  collapsed,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "sm"}
      className={`w-full rounded-lg text-muted-foreground hover:text-foreground ${
        collapsed ? "h-9 w-full justify-center" : "h-9 justify-start gap-2.5 px-2.5"
      }`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="text-xs">{label}</span>}
    </Button>
  );
}
