"use client";

import { useState } from "react";
import { ExternalLink, Trash2, AlertTriangle, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/database.types";
import { formatRelativeTime, formatEventDate } from "@/lib/dates";
import { scoreClass } from "@/lib/utils";
import { ecoColor, tagColor } from "@/lib/ecosystem-colors";

function prettyLabel(v: string): string {
  return v.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

// Inline ecosystem badge — works for any user-defined ecosystem
function EcoBadge({ name }: { name: string }) {
  const c = ecoColor(name);
  return (
    <span style={{
      fontFamily: "var(--font-geist-mono)", fontSize: 9.5, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 4,
      color: c.hex, background: c.dim,
    }}>{prettyLabel(name)}</span>
  );
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
      <div
        className="cos-card py-24 flex flex-col items-center gap-4"
        style={{ textAlign: "center" }}
      >
        <div
          className="size-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--amber-dim)", color: "var(--amber)" }}
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">No events found</p>
          <p className="text-xs mt-1.5 max-w-xs" style={{ color: "var(--fg-3)" }}>
            Events are detected automatically when the pipeline processes tweets from your tracked sources.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Card grid */}
      <div className="cos-events-grid">
        {events.map((event) => {
          const sourceTweets: SourceTweet[] = Array.isArray(event.source_tweets)
            ? (event.source_tweets as unknown as SourceTweet[])
            : [];
          const eco = event.ecosystem ?? "other";
          const isHigh = (event.importance_score ?? 0) >= 8;

          return (
            <div
              key={event.id}
              className={`cos-event-card ${eco} ${isHigh ? "high" : ""}`}
              onClick={() => setViewTarget(event)}
            >
              {/* Head: tags + score */}
              <div className="cos-event-card-head">
                <div className="cos-event-card-tags">
                  <EcoBadge name={eco} />
                  {event.category && (() => {
                    const cat = event.category as string;
                    const c = tagColor(cat);
                    return (
                      <span style={{
                        fontFamily: "var(--font-geist-mono)", fontSize: 9.5, fontWeight: 700,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "2px 7px", borderRadius: 4,
                        background: c.dim, color: c.hex,
                      }}>{cat}</span>
                    );
                  })()}
                </div>
                <span className={`cos-score ${scoreClass(event.importance_score)}`}>
                  {event.importance_score ?? "-"}
                </span>
              </div>

              {/* Title */}
              <h3 className="cos-event-card-title">{event.title ?? "Untitled Event"}</h3>

              {/* Keywords */}
              {event.keywords && event.keywords.length > 0 && (
                <div className="cos-event-card-hash">
                  {event.keywords.slice(0, 4).map((kw) => (
                    <span key={kw}>#{kw}</span>
                  ))}
                  {event.keywords.length > 4 && (
                    <span style={{ color: "var(--fg-5)" }}>+{event.keywords.length - 4}</span>
                  )}
                </div>
              )}

              {/* Source tweets */}
              {sourceTweets.length > 0 && (() => {
                const ecoC = ecoColor(eco);
                return (
                  <div
                    className="flex items-center gap-1.5 flex-wrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {sourceTweets.slice(0, 3).map((tw) => (
                      <a
                        key={tw.tweet_id}
                        href={tw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full transition-colors"
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-geist-mono)",
                          color: ecoC.hex,
                          background: ecoC.dim,
                          padding: "2px 9px",
                          border: `1px solid ${ecoC.border}`,
                        }}
                      >
                        @{tw.username}
                        <ExternalLink style={{ width: 9, height: 9 }} />
                      </a>
                    ))}
                    {sourceTweets.length > 3 && (
                      <span style={{ fontSize: 11, color: "var(--fg-5)", fontFamily: "var(--font-geist-mono)" }}>
                        +{sourceTweets.length - 3}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Footer */}
              <div className="cos-event-card-foot">
                <span>{formatRelativeTime(event.created_at)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(event); }}
                    className="cos-row-action"
                    title="Edit"
                  >
                    <Pencil style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(event); }}
                    className="cos-row-action"
                    title="Delete"
                  >
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View modal */}
      {viewTarget && (() => {
        const sourceTweets: SourceTweet[] = Array.isArray(viewTarget.source_tweets)
          ? (viewTarget.source_tweets as unknown as SourceTweet[])
          : [];
        const eco = viewTarget.ecosystem ?? "other";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
            <div
              className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}
            >
              {/* Top border in eco color */}
              <div style={{ height: 2, background: `var(--${eco})`, borderRadius: "8px 8px 0 0" }} />

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--hairline)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <EcoBadge name={eco} />
                  {viewTarget.category && <span className="cos-chip">{viewTarget.category}</span>}
                  {viewTarget.importance_score !== null && (
                    <span className={`cos-score ${scoreClass(viewTarget.importance_score)}`}>
                      {viewTarget.importance_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(viewTarget)}
                    className="cos-btn-ghost"
                  >
                    <Pencil style={{ width: 12, height: 12 }} />
                    Edit
                  </button>
                  <button
                    onClick={() => { setViewTarget(null); setDeleteTarget(viewTarget); }}
                    className="cos-btn-ghost"
                    style={{ color: "var(--rose)" }}
                  >
                    <Trash2 style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    onClick={() => setViewTarget(null)}
                    className="cos-row-action"
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", lineHeight: 1.35 }}>
                  {viewTarget.title ?? "Untitled Event"}
                </h2>

                {viewTarget.summary && (
                  <div>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>Summary</p>
                    <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>{viewTarget.summary}</p>
                  </div>
                )}

                {viewTarget.keywords && viewTarget.keywords.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewTarget.keywords.map((kw) => (
                        <span
                          key={kw}
                          style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, background: "rgba(255,255,255,.06)", color: "var(--fg-3)", padding: "3px 8px", borderRadius: 4 }}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sourceTweets.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>Source Tweets</p>
                    <div className="space-y-2">
                      {sourceTweets.map((tw) => (
                        <a
                          key={tw.tweet_id}
                          href={tw.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 rounded-lg px-4 py-3 transition-colors group/tweet"
                          style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--hairline)" }}
                        >
                          <div
                            className="size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `var(--${eco}-dim)`, color: `var(--${eco})`, fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 700 }}
                          >
                            {tw.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: `var(--${eco})`, fontWeight: 600 }}>@{tw.username}</p>
                            {tw.content && (
                              <p style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {tw.content}
                              </p>
                            )}
                          </div>
                          <ExternalLink style={{ width: 12, height: 12, color: "var(--fg-5)", flexShrink: 0, marginTop: 2 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-5)" }}>
                  {formatEventDate(viewTarget.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit modal */}
      {editTarget && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setEditTarget(null); setEditForm(null); }} />
          <div
            className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Edit Event</h2>
              <button onClick={() => { setEditTarget(null); setEditForm(null); }} className="cos-row-action">
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {[
                { label: "Title", key: "title" as const, type: "text", placeholder: "Event title" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>{label}</label>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
                  />
                </div>
              ))}

              <div className="space-y-1.5">
                <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Summary</label>
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setField("summary", e.target.value)}
                  placeholder="Brief summary..."
                  rows={4}
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Ecosystem</label>
                  <input
                    type="text"
                    value={editForm.ecosystem}
                    onChange={(e) => setField("ecosystem", e.target.value)}
                    placeholder="e.g. Solana"
                    className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setField("category", e.target.value)}
                    placeholder="e.g. launch"
                    className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Importance Score (1–10)</label>
                <input
                  type="number"
                  min={1} max={10} step={0.1}
                  value={editForm.importance_score}
                  onChange={(e) => setField("importance_score", e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
                />
              </div>

              <div className="space-y-1.5">
                <label style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)" }}>Keywords (comma-separated)</label>
                <input
                  value={editForm.keywords}
                  onChange={(e) => setField("keywords", e.target.value)}
                  placeholder="nft, staking, launch..."
                  className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", color: "var(--fg)", fontSize: 13 }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: "1px solid var(--hairline)" }}>
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

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div
            className="relative z-10 w-full max-w-sm rounded-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)" }}
          >
            <div className="flex items-start gap-4">
              <div className="size-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--rose-dim)", color: "var(--rose)" }}>
                <AlertTriangle style={{ width: 16, height: 16 }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>Delete Event</h3>
                <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>
                  Delete &quot;{deleteTarget.title}&quot;? This cannot be undone.
                </p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="cos-row-action">
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
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
