import {
  Monitor,
  Terminal,
  Server,
  Database,
  Globe,
  Cloud,
  Shield,
  Lock,
  Key,
  Wifi,
  HardDrive,
  Cpu,
  Network,
  Layers,
  Box,
  Briefcase,
  Folder,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Video,
  Music,
  Image,
  Camera,
  Zap,
  Star,
  Heart,
  Home,
  Settings,
  Command,
  Rss,
  AppWindow,
  Bug,
  Code,
  Gamepad2,
  Headphones,
  Printer,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Monitor,
  Terminal,
  Server,
  Database,
  Globe,
  Cloud,
  Shield,
  Lock,
  Key,
  Wifi,
  HardDrive,
  Cpu,
  Network,
  Layers,
  Box,
  Briefcase,
  Folder,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Video,
  Music,
  Image,
  Camera,
  Zap,
  Star,
  Heart,
  Home,
  Settings,
  Command,
  Rss,
  AppWindow,
  Bug,
  Code,
  Gamepad2,
  Headphones,
  Printer,
  Tag,
};

const LEGACY_ICON_ALIASES: Record<string, string> = {
  monitor: "Monitor",
  desktop: "Monitor",
  terminal: "Terminal",
  app: "AppWindow",
  rss: "Rss",
  folder: "Folder",
  globe: "Globe",
  server: "Server",
  database: "Database",
  cloud: "Cloud",
  shield: "Shield",
  lock: "Lock",
  key: "Key",
  wifi: "Wifi",
  cpu: "Cpu",
  code: "Code",
  print: "Printer",
  "\uD83D\uDDA5": "Monitor",
  "\uD83D\uDDA5\uFE0F": "Monitor",
  "\uD83D\uDCBB": "Monitor",
  "\uD83D\uDD8A": "Terminal",
  "\uD83D\uDDA5\uFE0F\u200D\uD83D\uDDB1\uFE0F": "Monitor",
  "\uD83D\uDCC1": "Folder",
  "\uD83C\uDF10": "Globe",
  "\u2699": "Settings",
  "\u2699\uFE0F": "Settings",
  "\u26A1": "Zap",
  "\u26A1\uFE0F": "Zap",
  "\uD83D\uDE80": "Command",
  "\uD83D\uDCF1": "AppWindow",
  "\uD83D\uDD12": "Lock",
  "\uD83D\uDEE1": "Shield",
  "\uD83D\uDEE1\uFE0F": "Shield",
  "\u2B50": "Star",
  "\u2B50\uFE0F": "Star",
};

export const COLOR_PRESETS = [
  { name: "slate", value: "#64748b" },
  { name: "red", value: "#ef4444" },
  { name: "orange", value: "#f97316" },
  { name: "amber", value: "#f59e0b" },
  { name: "emerald", value: "#10b981" },
  { name: "teal", value: "#14b8a6" },
  { name: "cyan", value: "#06b6d4" },
  { name: "blue", value: "#3b82f6" },
  { name: "indigo", value: "#6366f1" },
  { name: "violet", value: "#8b5cf6" },
  { name: "purple", value: "#a855f7" },
  { name: "pink", value: "#ec4899" },
] as const;

export const TAB_COLOR_PRESETS = [
  "#5f8f78",
  "#6f7fb0",
  "#c07e63",
  "#6b98a3",
  "#9484b8",
  "#8f9666",
  "#bf6f84",
  "#8e6f5f",
] as const;

export const DEFAULT_TAB_ICON = "Tag";
export const TAB_LETTER_PREFIX = "letters:";

export function normalizeIconName(name: string | null): string | null {
  if (!name) return null;
  return LEGACY_ICON_ALIASES[name] ?? name;
}

export function getIconComponent(name: string | null): LucideIcon | null {
  const normalized = normalizeIconName(name);
  if (!normalized) return null;
  return ICON_REGISTRY[normalized] ?? null;
}

export function normalizeTabLetters(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2);
}

export function createLetterTabIcon(value: string): string | null {
  const letters = normalizeTabLetters(value);
  return letters ? `${TAB_LETTER_PREFIX}${letters}` : null;
}

export function isLetterTabIcon(icon: string | null): boolean {
  return !!icon?.startsWith(TAB_LETTER_PREFIX);
}

export function getTabIconLetters(icon: string | null): string {
  if (!isLetterTabIcon(icon)) return "";
  return normalizeTabLetters(icon!.slice(TAB_LETTER_PREFIX.length));
}

export function getTabIconColor(icon: string | null, color: string | null): string | null {
  if (color) return color;
  const letters = getTabIconLetters(icon);
  if (!letters) return null;

  const hash = letters.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAB_COLOR_PRESETS[hash % TAB_COLOR_PRESETS.length];
}

export function getTabIconComponent(icon: string | null): LucideIcon | null {
  if (isLetterTabIcon(icon)) return null;
  return getIconComponent(icon) ?? ICON_REGISTRY[DEFAULT_TAB_ICON];
}
