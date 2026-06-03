// Single source of truth for ecosystem brand colors
// Ronin = sky/blue-cyan | Immutable = purple | Abstract = emerald/green

// ── Dynamic ecosystem colors (works for ANY user-defined ecosystem) ──────────
// Known brands keep their signature color; anything else gets a stable color
// derived from its name, so the same ecosystem always looks the same.

export interface EcoColor { hex: string; dim: string; border: string }

const KNOWN_ECO: Record<string, string> = {
  ronin:     "#3b82f6",
  immutable: "#a855f7",
  abstract:  "#10b981",
};

const ECO_PALETTE = [
  "#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ec4899",
  "#06b6d4", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316",
];

/** Returns a stable hex + translucent variants for any ecosystem name. */
export function ecoColor(name?: string | null): EcoColor {
  const key = (name ?? "").toLowerCase().trim();
  let hex = KNOWN_ECO[key];
  if (!hex) {
    if (!key) {
      hex = "#8a8a9a"; // neutral for empty/unknown
    } else {
      let h = 0;
      for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
      hex = ECO_PALETTE[h % ECO_PALETTE.length];
    }
  }
  return {
    hex,
    dim: `${hex}1f`,     // ~12% alpha
    border: `${hex}40`,  // ~25% alpha
  };
}

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
