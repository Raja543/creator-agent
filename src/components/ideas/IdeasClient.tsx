"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, AlertTriangle, Lightbulb, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState<string | null>(null);

  async function handleAdd(form: FormData) {
    setSubmitting(true);
    setError(null);
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
      const res = await fetch(`/api/ideas/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete idea");
      }
      setIdeas((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
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
      }
    } finally {
      setPipelineLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {ideas.length} ideas
          </span>
        </div>
        <Button size="sm" onClick={() => { setError(null); setShowAdd(true); }}>
          <Plus className="size-3.5" />
          Add Idea
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-3">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <Lightbulb className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No ideas yet</p>
          <p className="text-xs text-muted-foreground max-w-xs text-center">
            Content ideas are generated from detected events, or you can add them manually.
          </p>
          <Button size="sm" className="mt-1" onClick={() => setShowAdd(true)}>
            Add Idea
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-border/60 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {idea.format && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${FORMAT_COLORS[idea.format] ?? "bg-muted text-muted-foreground"}`}>
                      {idea.format}
                    </span>
                  )}
                  {idea.potential && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${POTENTIAL_STYLES[idea.potential] ?? POTENTIAL_STYLES.low}`}>
                      {idea.potential}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => { setError(null); setEditTarget(idea); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => { setError(null); setDeleteTarget(idea); }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
                  {idea.title ?? "Untitled Idea"}
                </h3>
                {idea.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                    {idea.description}
                  </p>
                )}
              </div>

              {idea.angle && (
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">Angle: </span>
                    {idea.angle}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[idea.status] ?? "bg-muted text-muted-foreground"}`}>
                    {idea.status}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {formatRelativeTime(idea.created_at)}
                  </div>
                </div>

                {idea.status === "idea" && (
                  <button
                    onClick={() => addToPipeline(idea)}
                    disabled={pipelineLoading === idea.id}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {pipelineLoading === idea.id ? "Moving…" : "Add to Pipeline"}
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
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
    </div>
  );
}
