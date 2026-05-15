"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, AlertTriangle, Lightbulb, ArrowRight, Clock, Search, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ContentIdea, ContentFormat, ContentPotential, PipelineStatus } from "@/lib/database.types";

const FORMATS: { value: ContentFormat; label: string }[] = [
  { value: "thread", label: "Thread" },
  { value: "infographic", label: "Infographic" },
  { value: "guide", label: "Guide" },
  { value: "comparison", label: "Comparison" },
  { value: "analysis", label: "Analysis" },
  { value: "narrative", label: "Narrative" },
  { value: "breakdown", label: "Breakdown" },
];

const FORMAT_COLORS: Record<string, string> = {
  thread: "bg-blue-400/15 text-blue-400",
  infographic: "bg-violet-400/15 text-violet-400",
  guide: "bg-green-400/15 text-green-400",
  comparison: "bg-cyan-400/15 text-cyan-400",
  analysis: "bg-amber-400/15 text-amber-400",
  narrative: "bg-pink-400/15 text-pink-400",
  breakdown: "bg-orange-400/15 text-orange-400",
};

const POTENTIAL_STYLES: Record<string, string> = {
  high: "bg-green-400/15 text-green-400 border border-green-400/20",
  medium: "bg-amber-400/15 text-amber-400 border border-amber-400/20",
  low: "bg-muted text-muted-foreground border border-border",
};

const STATUS_STYLES: Record<string, string> = {
  idea: "bg-blue-400/10 text-blue-400",
  draft: "bg-amber-400/10 text-amber-400",
  preparing: "bg-violet-400/10 text-violet-400",
  review: "bg-cyan-400/10 text-cyan-400",
  published: "bg-green-400/10 text-green-400",
};

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatRelativeTime(iso: string) {
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
  title: string;
  description: string;
  format: string;
  potential: string;
  angle: string;
  notes: string;
  priority: number;
};

const emptyForm: FormData = {
  title: "",
  description: "",
  format: "",
  potential: "medium",
  angle: "",
  notes: "",
  priority: 5,
};

function ideaToForm(idea: ContentIdea): FormData {
  return {
    title: idea.title ?? "",
    description: idea.description ?? "",
    format: idea.format ?? "",
    potential: idea.potential ?? "medium",
    angle: idea.angle ?? "",
    notes: idea.notes ?? "",
    priority: idea.priority,
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

interface IdeaFormProps {
  initial: FormData;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}

function IdeaForm({ initial, onSubmit, onCancel, submitting, submitLabel }: IdeaFormProps) {
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
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title *</label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Content idea title"
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Brief description of the content..."
          rows={3}
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Format</label>
          <select
            value={form.format}
            onChange={(e) => set("format", e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            <option value="">None</option>
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Potential</label>
          <select
            value={form.potential}
            onChange={(e) => set("potential", e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Angle</label>
        <input
          value={form.angle}
          onChange={(e) => set("angle", e.target.value)}
          placeholder="Unique angle or hook..."
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
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

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Additional notes..."
          rows={2}
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
  initialIdeas: ContentIdea[];
}

export function IdeasClient({ initialIdeas }: Props) {
  const [ideas, setIdeas] = useState<ContentIdea[]>(initialIdeas);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<ContentIdea | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentIdea | null>(null);
  const [viewTarget, setViewTarget] = useState<ContentIdea | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");

  // Bulk select
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const displayed = useMemo(() => {
    if (!search.trim()) return ideas;
    const q = search.toLowerCase();
    return ideas.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.angle?.toLowerCase().includes(q)
    );
  }, [ideas, search]);

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(displayed.map((i) => i.id)));
  }

  async function handleAdd(form: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          format: form.format || null,
          potential: form.potential || "medium",
          angle: form.angle || null,
          notes: form.notes || null,
          priority: form.priority,
          status: "idea",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add idea");
      }
      const newIdea: ContentIdea = await res.json();
      setIdeas((prev) => [newIdea, ...prev]);
      setShowAdd(false);
      toast.success("Idea added");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add idea");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(form: FormData) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          format: form.format || null,
          potential: form.potential || "medium",
          angle: form.angle || null,
          notes: form.notes || null,
          priority: form.priority,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to update idea");
      }
      const updated: ContentIdea = await res.json();
      setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditTarget(null);
      toast.success("Idea updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update idea");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete idea");
      }
      setIdeas((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Idea deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete idea");
    } finally {
      setSubmitting(false);
    }
  }

  async function addToPipeline(idea: ContentIdea) {
    setPipelineLoading(idea.id);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" as PipelineStatus }),
      });
      if (res.ok) {
        const updated: ContentIdea = await res.json();
        setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success("Moved to pipeline");
      }
    } finally {
      setPipelineLoading(null);
    }
  }

  async function bulkMoveToPipeline() {
    if (selected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/ideas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "draft" as PipelineStatus }),
          })
        )
      );
      const updatedIds = new Set(ids);
      setIdeas((prev) =>
        prev.map((i) => (updatedIds.has(i.id) ? { ...i, status: "draft" as PipelineStatus } : i))
      );
      toast.success(`${ids.length} idea${ids.length > 1 ? "s" : ""} moved to pipeline`);
      exitSelectMode();
    } catch {
      toast.error("Failed to move some ideas");
    } finally {
      setBulkSubmitting(false);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map((id) => fetch(`/api/ideas/${id}`, { method: "DELETE" })));
      const deletedIds = new Set(ids);
      setIdeas((prev) => prev.filter((i) => !deletedIds.has(i.id)));
      toast.success(`${ids.length} idea${ids.length > 1 ? "s" : ""} deleted`);
      setShowBulkDeleteConfirm(false);
      exitSelectMode();
    } catch {
      toast.error("Failed to delete some ideas");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => {
              if (selectMode) exitSelectMode();
              else setSelectMode(true);
            }}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              selectMode
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {selectMode ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
            {selectMode ? "Done" : "Select"}
          </button>
          {selectMode && (
            <button
              onClick={selectAll}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Select all
            </button>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5" />
          Add Idea
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas by title, description, or angle…"
          className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
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

      {displayed.length === 0 && ideas.length > 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 flex flex-col items-center gap-3">
          <Search className="size-8 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">No results</p>
            <p className="text-xs text-muted-foreground mt-1">No ideas match &quot;{search}&quot;</p>
          </div>
          <button onClick={() => setSearch("")} className="text-xs text-primary hover:underline">Clear search</button>
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-400/5 flex items-center justify-center">
            <Lightbulb className="size-7 text-amber-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">No ideas yet</p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              Content ideas are generated from detected events, or you can add them manually.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            Add Your First Idea
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((idea) => {
            const isSelected = selected.has(idea.id);
            return (
              <div
                key={idea.id}
                className={`relative bg-card rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 transition-all duration-200 group overflow-hidden cursor-pointer border ${
                  isSelected ? "border-primary shadow-sm shadow-primary/20" : "border-border"
                }`}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(idea.id);
                  } else {
                    setViewTarget(idea);
                  }
                }}
              >
                {idea.potential === "high" && (
                  <div className="absolute -top-4 -right-4 size-16 rounded-full blur-2xl opacity-20 bg-green-400" />
                )}

                {/* Selection indicator */}
                {selectMode && (
                  <div className={`absolute top-3 left-3 size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "bg-primary border-primary" : "border-border bg-card"
                  }`}>
                    {isSelected && <X className="size-3 text-primary-foreground rotate-45 scale-0" />}
                    {isSelected && (
                      <svg className="size-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                )}

                <div className={`relative flex items-center justify-between gap-2 ${selectMode ? "pl-6" : ""}`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {idea.format && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${FORMAT_COLORS[idea.format] ?? "bg-muted text-muted-foreground"}`}>
                        {idea.format}
                      </span>
                    )}
                    {idea.potential && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${POTENTIAL_STYLES[idea.potential] ?? POTENTIAL_STYLES.low}`}>
                        {idea.potential}
                      </span>
                    )}
                  </div>
                  {!selectMode && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTarget(idea); }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(idea); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <h3 className="font-bold text-foreground leading-snug line-clamp-2">
                    {idea.title ?? "Untitled Idea"}
                  </h3>
                  {idea.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>
                  )}
                </div>

                {idea.angle && (
                  <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      <span className="text-primary font-semibold">Angle — </span>
                      {idea.angle}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50 gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatRelativeTime(idea.created_at)}
                  </div>

                  {idea.status === "idea" && !selectMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToPipeline(idea); }}
                      disabled={pipelineLoading === idea.id}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      {pipelineLoading === idea.id ? "Moving…" : "Pipeline"}
                      <ArrowRight className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 px-5 py-3">
          <span className="text-sm font-bold text-foreground">{selected.size} selected</span>
          <div className="w-px h-5 bg-border" />
          <button
            onClick={bulkMoveToPipeline}
            disabled={bulkSubmitting}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <ArrowRight className="size-4" />
            Move to Pipeline
          </button>
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            disabled={bulkSubmitting}
            className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </div>
      )}

      {showAdd && (
        <Dialog title="Add Content Idea" onClose={() => setShowAdd(false)}>
          <IdeaForm
            initial={emptyForm}
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            submitting={submitting}
            submitLabel="Add Idea"
          />
        </Dialog>
      )}

      {editTarget && (
        <Dialog title="Edit Idea" onClose={() => setEditTarget(null)}>
          <IdeaForm
            initial={ideaToForm(editTarget)}
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
                <h3 className="font-semibold text-foreground">Delete Idea</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to delete{" "}
                  <span className="text-foreground font-medium">&quot;{deleteTarget.title}&quot;</span>?
                  This action cannot be undone.
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

      {/* Bulk delete confirm */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkDeleteConfirm(false)} />
          <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete {selected.size} Ideas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently delete {selected.size} idea{selected.size > 1 ? "s" : ""}. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="ghost" size="sm" onClick={() => setShowBulkDeleteConfirm(false)} disabled={bulkSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={bulkSubmitting}>
                {bulkSubmitting ? "Deleting…" : `Delete ${selected.size}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Idea detail modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {viewTarget.format && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${FORMAT_COLORS[viewTarget.format] ?? "bg-muted text-muted-foreground"}`}>
                    {viewTarget.format}
                  </span>
                )}
                {viewTarget.potential && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${POTENTIAL_STYLES[viewTarget.potential] ?? POTENTIAL_STYLES.low}`}>
                    {viewTarget.potential}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setViewTarget(null); setEditTarget(viewTarget); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <h2 className="text-xl font-black text-foreground leading-snug">
                {viewTarget.title ?? "Untitled Idea"}
              </h2>

              {viewTarget.description ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{viewTarget.description}</p>
                </div>
              ) : null}

              {viewTarget.angle ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1.5">Angle</p>
                  <p className="text-sm text-foreground leading-relaxed">{viewTarget.angle}</p>
                </div>
              ) : null}

              {viewTarget.notes ? (
                <div className="bg-muted/50 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Notes</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{viewTarget.notes}</p>
                </div>
              ) : null}

              <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatRelativeTime(viewTarget.created_at)}
                </div>
                <span className={`px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[viewTarget.status] ?? "bg-muted text-muted-foreground"}`}>
                  {viewTarget.status}
                </span>
                <span>Priority {viewTarget.priority}/10</span>
              </div>
            </div>

            {viewTarget.status === "idea" && (
              <div className="px-6 py-4 border-t border-border shrink-0">
                <button
                  onClick={() => { addToPipeline(viewTarget); setViewTarget(null); }}
                  disabled={pipelineLoading === viewTarget.id}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {pipelineLoading === viewTarget.id ? "Moving…" : "Add to Pipeline"}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
