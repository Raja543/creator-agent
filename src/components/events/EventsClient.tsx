"use client";

import { useState } from "react";
import { Zap, Clock, ExternalLink, Trash2, AlertTriangle, X, Pencil, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Event, Ecosystem, EventCategory } from "@/lib/database.types";
import { ECO_BADGE } from "@/lib/ecosystem-colors";

const ECOSYSTEM_COLORS: Record<string, string> = ECO_BADGE;

const CATEGORY_COLORS: Record<string, string> = {
  launch: "bg-green-400/15 text-green-400",
  partnership: "bg-blue-400/15 text-blue-400",
  funding: "bg-amber-400/15 text-amber-400",
  token: "bg-violet-400/15 text-violet-400",
  nft: "bg-pink-400/15 text-pink-400",
  tournament: "bg-orange-400/15 text-orange-400",
  staking: "bg-cyan-400/15 text-cyan-400",
  campaign: "bg-rose-400/15 text-rose-400",
  migration: "bg-yellow-400/15 text-yellow-400",
  gameplay: "bg-emerald-400/15 text-emerald-400",
  metrics: "bg-sky-400/15 text-sky-400",
  patch: "bg-indigo-400/15 text-indigo-400",
  leaderboard: "bg-fuchsia-400/15 text-fuchsia-400",
  other: "bg-muted text-muted-foreground",
};

const SCORE_GLOW: Record<string, string> = {
  high: "bg-green-400",
  mid: "bg-amber-400",
  low: "bg-orange-400",
};

const ECOSYSTEMS: Ecosystem[] = ["ronin", "immutable", "abstract", "other"];
const CATEGORIES: EventCategory[] = [
  "campaign", "launch", "partnership", "migration", "staking",
  "gameplay", "tournament", "funding", "metrics", "token", "nft",
  "patch", "leaderboard", "other",
];

function getScoreColor(score: number) {
  if (score >= 8) return "bg-green-400/15 text-green-400 border border-green-400/20";
  if (score >= 6) return "bg-amber-400/15 text-amber-400 border border-amber-400/20";
  if (score >= 4) return "bg-orange-400/15 text-orange-400 border border-orange-400/20";
  return "bg-muted text-muted-foreground border border-border";
}

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

function formatDate(iso: string) {
  return parseUTC(iso).toLocaleDateString([], {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

interface SourceTweet {
  tweet_id: string;
  username: string;
  url: string;
  content: string;
}

type EditForm = {
  title: string;
  summary: string;
  ecosystem: string;
  category: string;
  importance_score: string;
  keywords: string;
};

function eventToForm(event: Event): EditForm {
  return {
    title: event.title ?? "",
    summary: event.summary ?? "",
    ecosystem: event.ecosystem ?? "",
    category: event.category ?? "",
    importance_score: event.importance_score?.toString() ?? "",
    keywords: (event.keywords ?? []).join(", "),
  };
}

interface Props {
  initialEvents: Event[];
}

export function EventsClient({ initialEvents }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [viewTarget, setViewTarget] = useState<Event | null>(null);
  const [editTarget, setEditTarget] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openEdit(event: Event) {
    setViewTarget(null);
    setEditTarget(event);
    setEditForm(eventToForm(event));
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editForm) return;
    setSubmitting(true);
    try {
      const keywords = editForm.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const res = await fetch(`/api/events/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title || null,
          summary: editForm.summary || null,
          ecosystem: editForm.ecosystem || null,
          category: editForm.category || null,
          importance_score: editForm.importance_score ? parseFloat(editForm.importance_score) : null,
          keywords: keywords.length > 0 ? keywords : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to update event");
      }
      const updated: Event = await res.json();
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      setEditTarget(null);
      setEditForm(null);
      toast.success("Event updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to delete event");
      }
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success("Event deleted");
      setDeleteTarget(null);
      setViewTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  }

  if (events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl py-24 flex flex-col items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-400/5 flex items-center justify-center">
          <Zap className="size-7 text-amber-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground">No events found</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
            Events are detected automatically when the pipeline processes tweets from your tracked sources.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((event) => {
          const sourceTweets: SourceTweet[] = Array.isArray(event.source_tweets)
            ? (event.source_tweets as unknown as SourceTweet[])
            : [];
          const isHighScore = event.importance_score !== null && event.importance_score >= 8;
          const glowKey = event.importance_score !== null
            ? event.importance_score >= 8 ? "high" : event.importance_score >= 6 ? "mid" : "low"
            : "low";

          return (
            <div
              key={event.id}
              onClick={() => setViewTarget(event)}
              className={`relative bg-card rounded-xl p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 border overflow-hidden group cursor-pointer ${
                isHighScore
                  ? "border-green-400/30 shadow-sm shadow-green-400/10 hover:shadow-green-400/20"
                  : "border-border hover:shadow-black/25"
              }`}
            >
              {/* Ambient glow */}
              {event.importance_score !== null && (
                <div className={`absolute -top-4 -right-4 size-20 rounded-full blur-2xl opacity-15 ${SCORE_GLOW[glowKey]}`} />
              )}

              {/* Badges + score */}
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {event.ecosystem && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ECOSYSTEM_COLORS[event.ecosystem] ?? ECOSYSTEM_COLORS.other}`}>
                      {event.ecosystem}
                    </span>
                  )}
                  {event.category && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other}`}>
                      {event.category}
                    </span>
                  )}
                </div>
                {event.importance_score !== null && (
                  <span className={`shrink-0 text-base font-black px-2.5 py-0.5 rounded-lg tabular-nums ${getScoreColor(event.importance_score)}`}>
                    {event.importance_score}
                  </span>
                )}
              </div>

              {/* Title + summary */}
              <div className="relative">
                <h3 className="font-bold text-foreground leading-snug line-clamp-2">
                  {event.title ?? "Untitled Event"}
                </h3>
                {event.summary && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                    {event.summary}
                  </p>
                )}
              </div>

              {/* Keywords */}
              {event.keywords && event.keywords.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {event.keywords.slice(0, 3).map((kw) => (
                    <span key={kw} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-mono">
                      #{kw}
                    </span>
                  ))}
                  {event.keywords.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{event.keywords.length - 3}</span>
                  )}
                </div>
              )}

              {/* Source tweets */}
              {sourceTweets.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {sourceTweets.slice(0, 3).map((tw) => (
                    <a
                      key={tw.tweet_id}
                      href={tw.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary/80 bg-primary/8 hover:bg-primary/15 hover:text-primary border border-primary/15 px-2 py-0.5 rounded-full transition-colors"
                    >
                      @{tw.username}
                      <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ))}
                  {sourceTweets.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{sourceTweets.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatRelativeTime(event.created_at)}
                </div>
                <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  View details <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── View modal ── */}
      {viewTarget && (() => {
        const sourceTweets: SourceTweet[] = Array.isArray(viewTarget.source_tweets)
          ? (viewTarget.source_tweets as unknown as SourceTweet[])
          : [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
            <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {viewTarget.ecosystem && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ECOSYSTEM_COLORS[viewTarget.ecosystem] ?? ECOSYSTEM_COLORS.other}`}>
                      {viewTarget.ecosystem}
                    </span>
                  )}
                  {viewTarget.category && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[viewTarget.category] ?? CATEGORY_COLORS.other}`}>
                      {viewTarget.category}
                    </span>
                  )}
                  {viewTarget.importance_score !== null && (
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg tabular-nums ${getScoreColor(viewTarget.importance_score)}`}>
                      Score {viewTarget.importance_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(viewTarget)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => { setViewTarget(null); setDeleteTarget(viewTarget); }}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1.5 rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                  <button onClick={() => setViewTarget(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                <h2 className="text-xl font-black text-foreground leading-snug">
                  {viewTarget.title ?? "Untitled Event"}
                </h2>

                {viewTarget.summary && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">{viewTarget.summary}</p>
                  </div>
                )}

                {viewTarget.keywords && viewTarget.keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewTarget.keywords.map((kw) => (
                        <span key={kw} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-mono">#{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {sourceTweets.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Source Tweets</p>
                    <div className="space-y-2">
                      {sourceTweets.map((tw) => (
                        <a
                          key={tw.tweet_id}
                          href={tw.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 bg-muted/40 hover:bg-muted/70 border border-border rounded-xl px-4 py-3 transition-colors group/tweet"
                        >
                          <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-black text-primary">{tw.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-primary">@{tw.username}</p>
                            {tw.content && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{tw.content}</p>
                            )}
                          </div>
                          <ExternalLink className="size-3.5 text-muted-foreground group-hover/tweet:text-primary shrink-0 mt-0.5 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Clock className="size-3" />
                  {formatDate(viewTarget.created_at)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit modal ── */}
      {editTarget && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setEditTarget(null); setEditForm(null); }} />
          <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">Edit Event</h2>
              <button onClick={() => { setEditTarget(null); setEditForm(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Event title"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</label>
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setField("summary", e.target.value)}
                  placeholder="Brief summary..."
                  rows={4}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ecosystem</label>
                  <select
                    value={editForm.ecosystem}
                    onChange={(e) => setField("ecosystem", e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                  >
                    <option value="">None</option>
                    {ECOSYSTEMS.map((eco) => (
                      <option key={eco} value={eco} className="capitalize">{eco}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                  >
                    <option value="">None</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Importance Score <span className="normal-case text-muted-foreground/60">(1–10)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={editForm.importance_score}
                  onChange={(e) => setField("importance_score", e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Keywords <span className="normal-case text-muted-foreground/60">(comma-separated)</span>
                </label>
                <input
                  value={editForm.keywords}
                  onChange={(e) => setField("keywords", e.target.value)}
                  placeholder="nft, staking, launch..."
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditTarget(null); setEditForm(null); }} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">Delete Event</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  Delete <span className="text-foreground font-medium">&quot;{deleteTarget.title}&quot;</span>? This cannot be undone.
                </p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
