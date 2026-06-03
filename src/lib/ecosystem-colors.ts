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

const TAG_PALETTE = [
  "#f97316", "#22c55e", "#8b5cf6", "#3b82f6", "#eab308",
  "#06b6d4", "#ec4899", "#10b981", "#14b8a6", "#f59e0b",
  "#a855f7", "#64748b", "#f43f5e", "#0ea5e9",
];

/** Stable color for any free-form tag/category label (no brand mapping). */
export function tagColor(name?: string | null): EcoColor {
  const key = (name ?? "").toLowerCase().trim();
  if (!key) return { hex: "#8a8a9a", dim: "#8a8a9a1f", border: "#8a8a9a40" };
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const hex = TAG_PALETTE[h % TAG_PALETTE.length];
  return { hex, dim: `${hex}1f`, border: `${hex}40` };
}
