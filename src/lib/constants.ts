import type { Ecosystem, AccountCategory } from "@/lib/database.types";

export const ACCOUNT_ECOSYSTEMS: { value: Ecosystem; label: string }[] = [
  { value: "ronin",     label: "Ronin" },
  { value: "immutable", label: "Immutable" },
  { value: "abstract",  label: "Abstract" },
  { value: "other",     label: "Other" },
];

export const ACCOUNT_CATEGORIES: { value: AccountCategory; label: string }[] = [
  { value: "official_game", label: "Official Game" },
  { value: "ecosystem",     label: "Ecosystem" },
  { value: "founder",       label: "Founder" },
  { value: "creator",       label: "Creator" },
  { value: "analytics",     label: "Analytics" },
  { value: "media",         label: "Media" },
  { value: "guild",         label: "Guild" },
  { value: "influencer",    label: "Influencer" },
];
