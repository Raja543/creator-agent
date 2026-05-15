// Single source of truth for ecosystem brand colors
// Ronin = sky/blue-cyan | Immutable = purple | Abstract = emerald/green

export const ECO_TEXT: Record<string, string> = {
  ronin:     "text-sky-400",
  immutable: "text-purple-400",
  abstract:  "text-emerald-400",
  other:     "text-muted-foreground",
};

export const ECO_BADGE: Record<string, string> = {
  ronin:     "bg-sky-400/15 text-sky-400",
  immutable: "bg-purple-400/15 text-purple-400",
  abstract:  "bg-emerald-400/15 text-emerald-400",
  other:     "bg-muted text-muted-foreground",
};

export const ECO_BADGE_BORDER: Record<string, string> = {
  ronin:     "bg-sky-400/15 text-sky-400 border-sky-400/20",
  immutable: "bg-purple-400/15 text-purple-400 border-purple-400/20",
  abstract:  "bg-emerald-400/15 text-emerald-400 border-emerald-400/20",
  other:     "bg-muted text-muted-foreground border-border",
};

export const ECO_ICON_BG: Record<string, string> = {
  ronin:     "bg-sky-400/10",
  immutable: "bg-purple-400/10",
  abstract:  "bg-emerald-400/10",
  other:     "bg-muted",
};

// For summary report section headings (uppercase keys)
export const ECO_HEADING: Record<string, string> = {
  RONIN:     "text-sky-400",
  IMMUTABLE: "text-purple-400",
  ABSTRACT:  "text-emerald-400",
  OVERALL:   "text-amber-400",
};

// Admin stats strip colors (text + bg combined)
export const ECO_STAT: Record<string, string> = {
  ronin:     "text-sky-400 bg-sky-400/10",
  immutable: "text-purple-400 bg-purple-400/10",
  abstract:  "text-emerald-400 bg-emerald-400/10",
  other:     "text-muted-foreground bg-muted",
};
