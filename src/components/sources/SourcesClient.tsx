"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Account, Ecosystem, AccountCategory } from "@/lib/database.types";

const ECOSYSTEMS: { value: Ecosystem; label: string }[] = [
  { value: "ronin", label: "Ronin" },
  { value: "immutable", label: "Immutable" },
  { value: "abstract", label: "Abstract" },
  { value: "other", label: "Other" },
];

const CATEGORIES: { value: AccountCategory; label: string }[] = [
  { value: "official_game", label: "Official Game" },
  { value: "ecosystem", label: "Ecosystem" },
  { value: "founder", label: "Founder" },
  { value: "creator", label: "Creator" },
  { value: "analytics", label: "Analytics" },
  { value: "media", label: "Media" },
  { value: "guild", label: "Guild" },
  { value: "influencer", label: "Influencer" },
];

const ECOSYSTEM_COLORS: Record<string, string> = {
  ronin: "bg-blue-400/15 text-blue-400",
  immutable: "bg-cyan-400/15 text-cyan-400",
  abstract: "bg-violet-400/15 text-violet-400",
  other: "bg-muted text-muted-foreground",
};

const CATEGORY_COLORS: Record<string, string> = {
  official_game: "bg-green-400/15 text-green-400",
  ecosystem: "bg-blue-400/15 text-blue-400",
  founder: "bg-amber-400/15 text-amber-400",
  creator: "bg-pink-400/15 text-pink-400",
  analytics: "bg-cyan-400/15 text-cyan-400",
  media: "bg-orange-400/15 text-orange-400",
  guild: "bg-violet-400/15 text-violet-400",
  influencer: "bg-rose-400/15 text-rose-400",
};

function getPriorityColor(priority: number) {
  if (priority >= 8) return "bg-green-400";
  if (priority >= 5) return "bg-amber-400";
  return "bg-muted-foreground";
}

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - parseUTC(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type FormData = {
  username: string;
  display_name: string;
  ecosystem: string;
  category: string;
  priority: number;
  active: boolean;
  notes: string;
};

const emptyForm: FormData = {
  username: "",
  display_name: "",
  ecosystem: "",
  category: "",
  priority: 5,
  active: true,
  notes: "",
};

function accountToForm(a: Account): FormData {
  return {
    username: a.username,
    display_name: a.display_name ?? "",
    ecosystem: a.ecosystem ?? "",
    category: a.category ?? "",
    priority: a.priority,
    active: a.active,
    notes: a.notes ?? "",
  };
}

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Dialog({ title, onClose, children }: DialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

interface SourceFormProps {
  initial: FormData;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}

function SourceForm({ initial, onSubmit, onCancel, submitting, submitLabel }: SourceFormProps) {
  const [form, setForm] = useState<FormData>(initial);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Username *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <input
            required
            value={form.username}
            onChange={(e) => set("username", e.target.value.replace(/^@/, ""))}
            placeholder="username"
            className="w-full bg-input border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display Name</label>
        <input
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
          placeholder="Display Name"
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ecosystem</label>
          <select
            value={form.ecosystem}
            onChange={(e) => set("ecosystem", e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            <option value="">None</option>
            {ECOSYSTEMS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            <option value="">None</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Priority: <span className="text-foreground font-semibold">{form.priority}</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">1</span>
          <input
            type="range"
            min={1}
            max={10}
            value={form.priority}
            onChange={(e) => set("priority", parseInt(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground">10</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set("active", !form.active)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 ${form.active ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-4" : "translate-x-0"}`} />
        </button>
        <span className="text-sm text-foreground">Active</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional notes..."
          rows={3}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface Props {
  initialSources: Account[];
  activeFilter: string;
}

export function SourcesClient({ initialSources, activeFilter }: Props) {
  const [sources, setSources] = useState<Account[]>(initialSources);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeFilter && activeFilter !== "all") params.set("ecosystem", activeFilter);
    const res = await fetch(`/api/sources?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSources(data);
    }
  }, [activeFilter]);

  async function handleAdd(form: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          display_name: form.display_name || null,
          ecosystem: form.ecosystem || null,
          category: form.category || null,
          priority: form.priority,
          active: form.active,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add source");
      }
      const newAccount: Account = await res.json();
      setSources((prev) => [newAccount, ...prev]);
      setShowAdd(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(form: FormData) {
    if (!editTarget) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sources/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          display_name: form.display_name || null,
          ecosystem: form.ecosystem || null,
          category: form.category || null,
          priority: form.priority,
          active: form.active,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to update source");
      }
      const updated: Account = await res.json();
      setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sources/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete source");
      }
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(source: Account) {
    setTogglingId(source.id);
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !source.active }),
      });
      if (res.ok) {
        const updated: Account = await res.json();
        setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Sources</h1>
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {sources.length}
          </span>
        </div>
        <Button size="sm" onClick={() => { setError(null); setShowAdd(true); }}>
          <Plus className="size-3.5" />
          Add Source
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {sources.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 flex flex-col items-center gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <Plus className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No sources found</p>
          <p className="text-xs text-muted-foreground">Add your first source to start tracking accounts</p>
          <Button size="sm" className="mt-1" onClick={() => setShowAdd(true)}>
            Add Source
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Username</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Display Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Ecosystem</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Last Checked</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">@</span>
                      <span className="font-medium text-foreground">{source.username}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {source.display_name ?? <span className="text-muted-foreground/40 italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {source.ecosystem ? (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${ECOSYSTEM_COLORS[source.ecosystem] ?? ECOSYSTEM_COLORS.other}`}>
                          {source.ecosystem}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {source.category ? (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[source.category] ?? "bg-muted text-muted-foreground"}`}>
                          {source.category.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getPriorityColor(source.priority)}`}
                            style={{ width: `${source.priority * 10}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{source.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(source)}
                        disabled={togglingId === source.id}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${source.active ? "bg-primary" : "bg-muted"}`}
                        title={source.active ? "Click to deactivate" : "Click to activate"}
                      >
                        <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform ${source.active ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatRelativeTime(source.last_checked)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setError(null); setEditTarget(source); }}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => { setError(null); setDeleteTarget(source); }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <Dialog title="Add Source" onClose={() => setShowAdd(false)}>
          <SourceForm
            initial={emptyForm}
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            submitting={submitting}
            submitLabel="Add Source"
          />
        </Dialog>
      )}

      {editTarget && (
        <Dialog title={`Edit @${editTarget.username}`} onClose={() => setEditTarget(null)}>
          <SourceForm
            initial={accountToForm(editTarget)}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitting={submitting}
            submitLabel="Save Changes"
          />
        </Dialog>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete Source</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to remove <span className="text-foreground font-medium">@{deleteTarget.username}</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>
                {submitting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
