export function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

// "Just now" / "1m ago" / "1h ago" / "1d ago"
export function formatRelativeTime(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// "just now" / "1m ago" / "1h ago" / "1d ago"
export function timeAgo(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// "just now" / "1m" / "1h" / "1d" (no unit suffix)
export function formatRelativeShort(iso: string) {
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// "HH:MM" in UTC
export function formatTime(iso: string) {
  return parseUTC(iso).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

// "May 18, 12:30 UTC"
export function formatTimestamp(iso: string) {
  return parseUTC(iso).toLocaleString([], {
    timeZone: "UTC", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }) + " UTC";
}

// "Mon, May 18, 2026, 12:30" for event detail views
export function formatEventDate(iso: string) {
  return parseUTC(iso).toLocaleDateString([], {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

// "Today" / "Yesterday" / "Monday, May 18" for activity log grouping
export function formatActivityDate(iso: string) {
  const date = parseUTC(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}
