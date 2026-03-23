export const THEME_ORDER = [
  "editorial-light",
  "dark-gold",
  "riddim-synth",
] as const;

export type ThemeName = (typeof THEME_ORDER)[number];

export interface ThemeOption {
  id: ThemeName;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "editorial-light",
    label: "Light / Editorial",
    description: "Warm paper tones with a restrained print-inspired accent.",
  },
  {
    id: "dark-gold",
    label: "Dark / Gold",
    description: "Layered charcoal surfaces with a muted premium gold accent.",
  },
  {
    id: "riddim-synth",
    label: "Riddim / Synth",
    description: "Dark club-toned surfaces with ember orange, electric cyan, and restrained low-light contrast.",
  },
];

const LEGACY_THEME_MAP: Record<string, ThemeName> = {
  light: "editorial-light",
  dark: "dark-gold",
  catppuccin: "riddim-synth",
  "medieval-instrumentalis": "riddim-synth",
};

export const DEFAULT_THEME: ThemeName = "editorial-light";

export function normalizeTheme(value: string | null | undefined): ThemeName {
  if (!value) {
    return DEFAULT_THEME;
  }

  const mapped = LEGACY_THEME_MAP[value];
  if (mapped) {
    return mapped;
  }

  return THEME_ORDER.includes(value as ThemeName) ? (value as ThemeName) : DEFAULT_THEME;
}

export function getNextTheme(theme: ThemeName): ThemeName {
  const index = THEME_ORDER.indexOf(theme);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length];
}
