"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, X, AlertTriangle, ArrowRight, Search, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ContentIdea, ContentFormat, PipelineStatus } from "@/lib/database.types";
import { formatRelativeTime } from "@/lib/dates";

const FORMATS: { value: ContentFormat; label: string }[] = [
  { value: "thread", label: "Thread" },
  { value: "infographic", label: "Infographic" },
  { value: "guide", label: "Guide" },
  { value: "comparison", label: "Comparison" },
  { value: "analysis", label: "Analysis" },
  { value: "narrative", label: "Narrative" },
  { value: "breakdown", label: "Breakdown" },
];

const FORMAT_COLOR: Record<string, string> = {
  thread:     "var(--ronin)",
  guide:      "var(--abstract)",
  analysis:   "var(--amber)",
  breakdown:  "var(--amber)",
  comparison: "var(--violet)",
  narrative:  "var(--rose)",
  infographic:"var(--violet)",
};

const POTENTIAL_CHIP: Record<string, { bg: string; color: string }> = {
  high:   { bg: "var(--signal-dim)",  color: "var(--signal)" },
  medium: { bg: "var(--amber-dim)",   color: "var(--amber)" },
  low:    { bg: "rgba(255,255,255,.06)", color: "var(--fg-4)" },
};


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
  title: "", description: "", format: "",
  potential: "medium", angle: "", notes: "", priority: 5,
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

function IdeaFormModal({
  title,
  initial,
  onSubmit,
  onClose,
  submitting,
  submitLabel,
}: {
  title: string;
  initial: FormData;
  onSubmit: (d: FormData) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormData>(initial);
  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--hairline)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{title}</h2>
          <button onClick={onClose} className="cos-row-action"><X style={{ width: 14, height: 14 }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Title *</label>
            <input
              required value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="Content idea title"
              className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
            />
          </div>
          <div className="space-y-1.5">
            <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Description</label>
            <textarea
              value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description..." rows={3}
              className="w-full rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Format</label>
              <select value={form.format} onChange={(e) => set("format", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}>
                <option value="">None</option>
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Potential</label>
              <select value={form.potential} onChange={(e) => set("potential", e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Angle</label>
            <input value={form.angle} onChange={(e) => set("angle", e.target.value)}
              placeholder="Unique angle or hook..."
              className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
            />
          </div>
          <div className="space-y-1.5">
            <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>
              Priority: <span style={{ color: "var(--fg)" }}>{form.priority}</span>
            </label>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 11, color: "var(--fg-4)" }}>1</span>
              <input type="range" min={1} max={10} value={form.priority}
                onChange={(e) => set("priority", parseInt(e.target.value))}
                className="flex-1 accent-primary" />
              <span style={{ fontSize: 11, color: "var(--fg-4)" }}>10</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="Additional notes..." rows={2}
              className="w-full rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--hairline)" }}>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : submitLabel}</Button>
          </div>
        </form>
      </div>
    </div>
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
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const displayed = useMemo(() => {
    if (!search.trim()) return ideas;
    const q = search.toLowerCase();
    return ideas.filter(
      (i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.angle?.toLowerCase().includes(q)
    );
  }, [ideas, search]);

  function exitSelectMode() { setSelectMode(false); setSelected(new Set()); }
  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  }
  function selectAll() { setSelected(new Set(displayed.map((i) => i.id))); }

  async function handleAdd(form: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description || null, format: form.format || null, potential: form.potential || "medium", angle: form.angle || null, notes: form.notes || null, priority: form.priority, status: "idea" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to add idea");
      const newIdea: ContentIdea = await res.json();
      setIdeas((prev) => [newIdea, ...prev]);
      setShowAdd(false);
      toast.success("Idea added");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(form: FormData) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${editTarget.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description || null, format: form.format || null, potential: form.potential || "medium", angle: form.angle || null, notes: form.notes || null, priority: form.priority }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update idea");
      const updated: ContentIdea = await res.json();
      setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditTarget(null);
      toast.success("Idea updated");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setIdeas((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Idea deleted");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function addToPipeline(idea: ContentIdea) {
    setPipelineLoading(idea.id);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" as PipelineStatus }),
      });
      if (res.ok) {
        const updated: ContentIdea = await res.json();
        setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success("Moved to pipeline");
      }
    } finally { setPipelineLoading(null); }
  }

  async function bulkMoveToPipeline() {
    if (selected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map((id) => fetch(`/api/ideas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "draft" as PipelineStatus }) })));
      setIdeas((prev) => prev.map((i) => (selected.has(i.id) ? { ...i, status: "draft" as PipelineStatus } : i)));
      toast.success(`${ids.length} idea${ids.length > 1 ? "s" : ""} moved to pipeline`);
      exitSelectMode();
    } catch { toast.error("Failed to move some ideas"); }
    finally { setBulkSubmitting(false); }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    setBulkSubmitting(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map((id) => fetch(`/api/ideas/${id}`, { method: "DELETE" })));
      setIdeas((prev) => prev.filter((i) => !selected.has(i.id)));
      toast.success(`${ids.length} deleted`);
      setShowBulkDeleteConfirm(false);
      exitSelectMode();
    } catch { toast.error("Failed"); }
    finally { setBulkSubmitting(false); }
  }

  return (
    <div>
      {/* Header controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--fg-4)", background: "rgba(255,255,255,.06)", padding: "3px 9px", borderRadius: 4 }}
          >
            {ideas.length} ideas
          </span>
          <button
            onClick={() => { if (selectMode) exitSelectMode(); else setSelectMode(true); }}
            className="cos-btn-ghost"
            style={selectMode ? { borderColor: "rgba(74,222,128,.3)", color: "var(--signal)" } : undefined}
          >
            {selectMode ? <CheckSquare style={{ width: 12, height: 12 }} /> : <Square style={{ width: 12, height: 12 }} />}
            {selectMode ? "Done" : "Select"}
          </button>
          {selectMode && (
            <button onClick={selectAll} className="cos-btn-ghost">Select all</button>
          )}
        </div>
        <button className="cos-btn-primary" onClick={() => setShowAdd(true)}>
          <Plus style={{ width: 12, height: 12 }} />
          Add Idea
        </button>
      </div>

      {/* Search */}
      <div className="cos-search-wrap mb-4">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas by title, description, or angle…"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, color: "var(--fg-4)" }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {displayed.length === 0 && ideas.length > 0 ? (
        <div className="cos-card py-16 flex flex-col items-center gap-3" style={{ textAlign: "center" }}>
          <Search style={{ width: 28, height: 28, color: "var(--fg-5)" }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>No results</p>
            <p style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4 }}>No ideas match &quot;{search}&quot;</p>
          </div>
          <button onClick={() => setSearch("")} className="cos-btn-ghost">Clear search</button>
        </div>
      ) : ideas.length === 0 ? (
        <div className="cos-card py-24 flex flex-col items-center gap-4" style={{ textAlign: "center" }}>
          <div className="size-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--amber-dim)", color: "var(--amber)" }}>
            <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18h6M10 22h4M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>No ideas yet</p>
            <p style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 6, maxWidth: 260 }}>
              Content ideas are generated from detected events, or you can add them manually.
            </p>
          </div>
          <button className="cos-btn-primary" onClick={() => setShowAdd(true)}>Add Your First Idea</button>
        </div>
      ) : (
        <div className="cos-ideas-grid">
          {displayed.map((idea) => {
            const isSelected = selected.has(idea.id);
            const fmt = idea.format ?? "";
            const potStyle = POTENTIAL_CHIP[idea.potential ?? "low"] ?? POTENTIAL_CHIP.low;

            return (
              <div
                key={idea.id}
                className={`cos-idea-card ${fmt}`}
                style={isSelected ? { borderColor: "rgba(74,222,128,.3)" } : undefined}
                onClick={() => { if (selectMode) toggleSelect(idea.id); else setViewTarget(idea); }}
              >
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 size-5 rounded flex items-center justify-center"
                    style={{ background: "var(--signal)", zIndex: 1 }}
                  >
                    <svg className="size-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#030b05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                {/* Head */}
                <div className="cos-idea-card-head">
                  <div className="flex items-center gap-1.5">
                    {fmt && (
                      <span
                        className="cos-chip"
                        style={{ background: `color-mix(in srgb, ${FORMAT_COLOR[fmt] ?? "var(--fg-5)"} 12%, transparent)`, color: FORMAT_COLOR[fmt] ?? "var(--fg-4)" }}
                      >
                        {fmt}
                      </span>
                    )}
                    {idea.potential && (
                      <span
                        className="cos-chip"
                        style={{ background: potStyle.bg, color: potStyle.color }}
                      >
                        {idea.potential}
                      </span>
                    )}
                  </div>
                  {!selectMode && (
                    <div className="cos-row-actions" style={{ opacity: 0.5 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTarget(idea); }}
                        className="cos-row-action" title="Edit"
                      >
                        <Pencil style={{ width: 11, height: 11 }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(idea); }}
                        className="cos-row-action" title="Delete"
                      >
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="cos-idea-title">{idea.title ?? "Untitled Idea"}</h3>

                {/* Description */}
                {idea.description && (
                  <p className="cos-idea-desc">{idea.description}</p>
                )}

                {/* Angle */}
                {idea.angle && (
                  <div className="cos-idea-angle">
                    <div className="cos-idea-angle-label">Angle</div>
                    <div className="cos-idea-angle-text">{idea.angle}</div>
                  </div>
                )}

                {/* Footer */}
                <div className="cos-idea-card-foot">
                  <span>{formatRelativeTime(idea.created_at)}</span>
                  {idea.status === "idea" && !selectMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToPipeline(idea); }}
                      disabled={pipelineLoading === idea.id}
                      className="flex items-center gap-1 transition-opacity disabled:opacity-50"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--signal)", fontWeight: 600 }}
                    >
                      {pipelineLoading === idea.id ? "Moving…" : "Pipeline"}
                      <ArrowRight style={{ width: 10, height: 10 }} />
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
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: "var(--surface-3)", border: "1px solid var(--hairline-2)", boxShadow: "0 12px 40px rgba(0,0,0,.5)" }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{selected.size} selected</span>
          <div style={{ width: 1, height: 18, background: "var(--hairline-2)" }} />
          <button onClick={bulkMoveToPipeline} disabled={bulkSubmitting}
            className="flex items-center gap-1.5 transition-opacity disabled:opacity-50"
            style={{ fontSize: 12.5, fontWeight: 500, color: "var(--signal)" }}>
            <ArrowRight style={{ width: 14, height: 14 }} /> Move to Pipeline
          </button>
          <button onClick={() => setShowBulkDeleteConfirm(true)} disabled={bulkSubmitting}
            className="flex items-center gap-1.5 transition-opacity disabled:opacity-50"
            style={{ fontSize: 12.5, fontWeight: 500, color: "var(--rose)" }}>
            <Trash2 style={{ width: 14, height: 14 }} /> Delete
          </button>
        </div>
      )}

      {/* Idea detail modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div
            className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}
          >
            {/* Left border in format color */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: FORMAT_COLOR[viewTarget.format ?? ""] ?? "var(--fg-5)", borderRadius: "8px 0 0 8px" }} />
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                {viewTarget.format && (
                  <span className="cos-chip" style={{ background: `color-mix(in srgb, ${FORMAT_COLOR[viewTarget.format] ?? "var(--fg-5)"} 12%, transparent)`, color: FORMAT_COLOR[viewTarget.format] ?? "var(--fg-4)" }}>
                    {viewTarget.format}
                  </span>
                )}
                {viewTarget.potential && (() => {
                  const s = POTENTIAL_CHIP[viewTarget.potential] ?? POTENTIAL_CHIP.low;
                  return <span className="cos-chip" style={{ background: s.bg, color: s.color }}>{viewTarget.potential}</span>;
                })()}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setViewTarget(null); setEditTarget(viewTarget); }}
                  className="cos-btn-ghost"
                >
                  <Pencil style={{ width: 11, height: 11 }} /> Edit
                </button>
                <button onClick={() => setViewTarget(null)} className="cos-row-action">
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", lineHeight: 1.35 }}>
                {viewTarget.title ?? "Untitled Idea"}
              </h2>

              {viewTarget.description && (
                <div>
                  <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>Description</p>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>{viewTarget.description}</p>
                </div>
              )}

              {viewTarget.angle && (
                <div className="cos-idea-angle">
                  <div className="cos-idea-angle-label">Angle</div>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55 }}>{viewTarget.angle}</p>
                </div>
              )}

              {viewTarget.notes && (
                <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--hairline)", borderRadius: 6, padding: "10px 12px" }}>
                  <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 4 }}>Notes</p>
                  <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.55 }}>{viewTarget.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4 pt-1 flex-wrap" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)" }}>
                <span>{formatRelativeTime(viewTarget.created_at)}</span>
                <span
                  style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,.06)", color: "var(--fg-3)" }}
                >
                  {viewTarget.status}
                </span>
                <span>Priority {viewTarget.priority}/10</span>
              </div>
            </div>

            {viewTarget.status === "idea" && (
              <div className="px-6 py-4 shrink-0" style={{ borderTop: "1px solid var(--hairline)" }}>
                <button
                  onClick={() => { addToPipeline(viewTarget); setViewTarget(null); }}
                  disabled={pipelineLoading === viewTarget.id}
                  className="cos-btn-primary w-full justify-center py-2.5 rounded-xl disabled:opacity-50"
                >
                  {pipelineLoading === viewTarget.id ? "Moving…" : "Add to Pipeline"}
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <IdeaFormModal title="Add Content Idea" initial={emptyForm} onSubmit={handleAdd} onClose={() => setShowAdd(false)} submitting={submitting} submitLabel="Add Idea" />
      )}
      {editTarget && (
        <IdeaFormModal title="Edit Idea" initial={ideaToForm(editTarget)} onSubmit={handleEdit} onClose={() => setEditTarget(null)} submitting={submitting} submitLabel="Save Changes" />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)" }}>
            <div className="flex items-start gap-4">
              <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                <AlertTriangle style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>Delete Idea</h3>
                <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>
                  Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={submitting}>{submitting ? "Deleting…" : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkDeleteConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)" }}>
            <div className="flex items-start gap-4">
              <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                <AlertTriangle style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>Delete {selected.size} Ideas</h3>
                <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>
                  This will permanently delete {selected.size} idea{selected.size > 1 ? "s" : ""}. Cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => setShowBulkDeleteConfirm(false)} disabled={bulkSubmitting}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={bulkSubmitting}>{bulkSubmitting ? "Deleting…" : `Delete ${selected.size}`}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
