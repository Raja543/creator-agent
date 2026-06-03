"use client";

import { useState, useMemo } from "react";
import { Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Account } from "@/lib/database.types";
import { ecoColor } from "@/lib/ecosystem-colors";

// Pretty-print a free-form value (e.g. "official_game" → "Official Game")
function prettyLabel(v?: string | null): string {
  if (!v) return "";
  return v.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getPriorityColor(priority: number) {
  if (priority >= 8) return "bg-green-400";
  if (priority >= 5) return "bg-amber-400";
  return "bg-muted-foreground";
}

// Inline ecosystem badge — works for any user-defined ecosystem
function EcoChip({ name }: { name: string }) {
  const c = ecoColor(name);
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
      style={{ color: c.hex, background: c.dim }}>
      {prettyLabel(name)}
    </span>
  );
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
  ecoOptions: string[];
  catOptions: string[];
}

function SourceForm({ initial, onSubmit, onCancel, submitting, submitLabel, ecoOptions, catOptions }: SourceFormProps) {
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
          <input
            list="src-eco-suggestions"
            value={form.ecosystem}
            onChange={(e) => set("ecosystem", e.target.value)}
            placeholder="e.g. Solana, Base..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
          <datalist id="src-eco-suggestions">
            {ecoOptions.map((e) => <option key={e} value={e} />)}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
          <input
            list="src-cat-suggestions"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Game, Founder..."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
          <datalist id="src-cat-suggestions">
            {catOptions.map((c) => <option key={c} value={c} />)}
          </datalist>
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

export function SourcesClient({ initialSources }: Props) {
  const [sources, setSources] = useState<Account[]>(initialSources);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const displayed = useMemo(() => {
    if (!search.trim()) return sources;
    const q = search.toLowerCase();
    return sources.filter(
      (s) =>
        s.username.toLowerCase().includes(q) ||
        (s.display_name ?? "").toLowerCase().includes(q)
    );
  }, [sources, search]);

  const ecoOptions = useMemo(
    () => [...new Set(sources.map((s) => s.ecosystem).filter(Boolean) as string[])].sort(),
    [sources],
  );
  const catOptions = useMemo(
    () => [...new Set(sources.map((s) => s.category).filter(Boolean) as string[])].sort(),
    [sources],
  );

  async function handleAdd(form: FormData) {
    setSubmitting(true);
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
      toast.success(`@${newAccount.username} added`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add source");
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
        toast.success(updated.active ? "Source activated" : "Source paused");
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Sources</h1>
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {sources.length}
          </span>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5" />
          Add Source
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or display name…"
          className="w-full bg-input border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

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
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {displayed.map((source) => (
              <div key={source.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                    style={{ color: ecoColor(source.ecosystem).hex, background: ecoColor(source.ecosystem).dim }}>
                    {source.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">@{source.username}</p>
                    {source.display_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{source.display_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {source.ecosystem && <EcoChip name={source.ecosystem} />}
                  {source.category && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize bg-muted text-muted-foreground">
                      {prettyLabel(source.category)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getPriorityColor(source.priority)}`} style={{ width: `${source.priority * 10}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{source.priority}/10</span>
                  </div>
                  <button
                    onClick={() => toggleActive(source)}
                    disabled={togglingId === source.id}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${source.active ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform ${source.active ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Username</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Ecosystem</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayed.map((source) => (
                  <tr key={source.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                          style={{ color: ecoColor(source.ecosystem).hex, background: ecoColor(source.ecosystem).dim }}>
                          {source.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">@{source.username}</p>
                          {source.display_name && <p className="text-xs text-muted-foreground">{source.display_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {source.ecosystem ? (
                        <EcoChip name={source.ecosystem} />
                      ) : <span className="text-muted-foreground/40 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {source.category ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize bg-muted text-muted-foreground">
                          {prettyLabel(source.category)}
                        </span>
                      ) : <span className="text-muted-foreground/40 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getPriorityColor(source.priority)}`} style={{ width: `${source.priority * 10}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{source.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(source)}
                        disabled={togglingId === source.id}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${source.active ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform ${source.active ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAdd && (
        <Dialog title="Add Source" onClose={() => setShowAdd(false)}>
          <SourceForm
            initial={emptyForm}
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            submitting={submitting}
            submitLabel="Add Source"
            ecoOptions={ecoOptions}
            catOptions={catOptions}
          />
        </Dialog>
      )}

    </div>
  );
}
