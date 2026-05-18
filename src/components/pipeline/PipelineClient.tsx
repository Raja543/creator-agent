"use client";

import { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Clock, Trash2, Inbox, ChevronRight, ChevronLeft, X, Pencil } from "lucide-react";
import type { ContentIdea, PipelineStatus } from "@/lib/database.types";
import { timeAgo } from "@/lib/dates";

interface Stage {
  id: PipelineStatus;
  label: string;
  color: string;
}

interface Props {
  stages: Stage[];
  initialGrouped: Record<string, ContentIdea[] | null>;
}

const STAGE_CLS: Record<string, string> = {
  idea:       "idea",
  draft:      "draft",
  preparing:  "prep",
  review:     "rev",
  published:  "pub",
};

const FORMAT_CLS: Record<string, string> = {
  thread:      "ronin",
  infographic: "violet",
  guide:       "abstract",
  comparison:  "amber",
  analysis:    "amber",
  narrative:   "rose",
  breakdown:   "",
};

const POTENTIAL_CLS: Record<string, string> = {
  high:   "signal",
  medium: "amber",
  low:    "",
};


export function PipelineClient({ stages, initialGrouped }: Props) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const [viewTarget, setViewTarget] = useState<ContentIdea | null>(null);
  const [grouped, setGrouped] = useState<Record<string, ContentIdea[]>>(() =>
    Object.fromEntries(stages.map((s) => [s.id, initialGrouped[s.id] ?? []]))
  );
  const [activeStage, setActiveStage] = useState<PipelineStatus>(stages[0]?.id ?? "idea");

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setGrouped((prev) => {
      const sourceList = [...(prev[source.droppableId] ?? [])];
      const isSameCol = source.droppableId === destination.droppableId;
      const destList = isSameCol ? sourceList : [...(prev[destination.droppableId] ?? [])];
      const [moved] = sourceList.splice(source.index, 1);
      if (!moved) return prev;
      const updatedMoved = { ...moved, status: destination.droppableId as PipelineStatus };
      destList.splice(destination.index, 0, updatedMoved);
      return { ...prev, [source.droppableId]: sourceList, [destination.droppableId]: destList };
    });

    await fetch(`/api/ideas/${draggableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destination.droppableId }),
    });
  }, []);

  const deleteIdea = useCallback(async (id: string, status: PipelineStatus) => {
    setGrouped((prev) => ({
      ...prev,
      [status]: (prev[status] ?? []).filter((i) => i.id !== id),
    }));
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
  }, []);

  async function moveToNextStage(card: ContentIdea) {
    const currentIdx = stages.findIndex((s) => s.id === card.status);
    if (currentIdx === -1 || currentIdx >= stages.length - 1) return;
    const nextStage = stages[currentIdx + 1].id;
    setGrouped((prev) => ({
      ...prev,
      [card.status]: (prev[card.status] ?? []).filter((i) => i.id !== card.id),
      [nextStage]: [{ ...card, status: nextStage }, ...(prev[nextStage] ?? [])],
    }));
    await fetch(`/api/ideas/${card.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStage }),
    });
  }

  async function moveToPrevStage(card: ContentIdea) {
    const currentIdx = stages.findIndex((s) => s.id === card.status);
    if (currentIdx <= 0) return;
    const prevStage = stages[currentIdx - 1].id;
    setGrouped((prev) => ({
      ...prev,
      [card.status]: (prev[card.status] ?? []).filter((i) => i.id !== card.id),
      [prevStage]: [...(prev[prevStage] ?? []), { ...card, status: prevStage }],
    }));
    await fetch(`/api/ideas/${card.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: prevStage }),
    });
  }

  const totalCards = Object.values(grouped).reduce((sum, col) => sum + (col?.length ?? 0), 0);

  if (!mounted) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const cls = STAGE_CLS[stage.id] ?? "idea";
          return (
            <div key={stage.id} className="cos-kanban-col" style={{ width: 240, flexShrink: 0 }}>
              <div className="cos-kanban-head">
                <div className={`cos-kanban-title ${cls}`}>
                  <span className="dot" />
                  {stage.label}
                </div>
                <span className="cos-kanban-count">{(initialGrouped[stage.id] ?? []).length}</span>
              </div>
              <div className="cos-kanban-body" style={{ minHeight: 400 }} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)", marginBottom: 16 }}>
        {totalCards} items in pipeline
      </p>

      {/* ── Mobile: tab-based single column ── */}
      <div className="md:hidden">
        <div className="relative mb-4">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {stages.map((stage) => {
              const count = grouped[stage.id]?.length ?? 0;
              const isActive = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`cos-fchip ${isActive ? "active" : ""}`}
                  style={{ flexShrink: 0 }}
                >
                  {stage.label}
                  <span className="ct">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>

        {(() => {
          const cards = grouped[activeStage] ?? [];
          const currentStageIdx = stages.findIndex((s) => s.id === activeStage);
          const nextStage = stages[currentStageIdx + 1];
          const prevStage = stages[currentStageIdx - 1];
          const cls = STAGE_CLS[activeStage] ?? "idea";
          return cards.length === 0 ? (
            <div className="cos-card" style={{ padding: "48px 20px", textAlign: "center" }}>
              <Inbox style={{ width: 28, height: 28, color: "var(--fg-5)", margin: "0 auto 10px" }} />
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--fg-4)" }}>No cards in this stage</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setViewTarget(card)}
                  className={`cos-kanban-card ${cls}`}
                >
                  <h4>{card.title}</h4>
                  <div className="cos-kanban-card-tags">
                    {card.format && <span className={`cos-chip ${FORMAT_CLS[card.format] ?? ""}`}>{card.format}</span>}
                    {card.potential && <span className={`cos-chip ${POTENTIAL_CLS[card.potential] ?? ""}`}>{card.potential}</span>}
                  </div>
                  <div className="cos-kanban-card-meta">
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock style={{ width: 10, height: 10 }} />
                      {timeAgo(card.created_at)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {prevStage && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveToPrevStage(card); }}
                          style={{ display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          <ChevronLeft style={{ width: 10, height: 10 }} />
                          {prevStage.label}
                        </button>
                      )}
                      {nextStage && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveToNextStage(card); }}
                          style={{ display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "var(--signal)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          {nextStage.label}
                          <ChevronRight style={{ width: 10, height: 10 }} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteIdea(card.id, card.status); }}
                        className="cos-row-action"
                        style={{ width: 22, height: 22 }}
                      >
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── Desktop: kanban board ── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="hidden md:flex gap-3 overflow-x-auto pb-6">
          {stages.map((stage) => {
            const cards = grouped[stage.id] ?? [];
            const cls = STAGE_CLS[stage.id] ?? "idea";
            return (
              <div key={stage.id} className="cos-kanban-col" style={{ width: 248, flexShrink: 0 }}>
                <div className="cos-kanban-head">
                  <div className={`cos-kanban-title ${cls}`}>
                    <span className="dot" />
                    {stage.label}
                  </div>
                  <span className="cos-kanban-count">{cards.length}</span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="cos-kanban-body"
                      style={{
                        minHeight: 420,
                        maxHeight: "calc(100vh - 280px)",
                        overflowY: "auto",
                        background: snapshot.isDraggingOver ? "rgba(74,222,128,.03)" : undefined,
                        transition: "background 0.15s",
                      }}
                    >
                      {cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cos-kanban-card ${cls}`}
                              style={{
                                ...provided.draggableProps.style,
                                cursor: snapshot.isDragging ? "grabbing" : "grab",
                                opacity: snapshot.isDragging ? 0.95 : 1,
                                boxShadow: snapshot.isDragging ? "0 16px 32px rgba(0,0,0,.45)" : undefined,
                              }}
                            >
                              <h4>{card.title}</h4>
                              <div className="cos-kanban-card-tags">
                                {card.format && (
                                  <span className={`cos-chip ${FORMAT_CLS[card.format] ?? ""}`}>{card.format}</span>
                                )}
                                {card.potential && (
                                  <span className={`cos-chip ${POTENTIAL_CLS[card.potential] ?? ""}`}>{card.potential}</span>
                                )}
                              </div>
                              <div className="cos-kanban-card-meta">
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Clock style={{ width: 9, height: 9 }} />
                                  {timeAgo(card.created_at)}
                                </div>
                                <div className="cos-row-actions">
                                  <button
                                    className="cos-row-action"
                                    style={{ width: 22, height: 22 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); setViewTarget(card); }}
                                    title="View details"
                                  >
                                    <Pencil style={{ width: 10, height: 10 }} />
                                  </button>
                                  <button
                                    className="cos-row-action"
                                    style={{ width: 22, height: 22 }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); deleteIdea(card.id, card.status); }}
                                  >
                                    <Trash2 style={{ width: 10, height: 10 }} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 80, gap: 6, opacity: 0.25, border: "1px dashed var(--hairline-2)", borderRadius: 6, margin: 4 }}>
                          <Inbox style={{ width: 14, height: 14, color: "var(--fg-4)" }} />
                          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9.5, color: "var(--fg-4)" }}>Drop here</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* ── Idea detail modal ── */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div
            className="relative z-10"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hairline-2)",
              borderRadius: 10,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 48px rgba(0,0,0,.5)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--hairline)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {viewTarget.format && (
                  <span className={`cos-chip ${FORMAT_CLS[viewTarget.format] ?? ""}`}>{viewTarget.format}</span>
                )}
                {viewTarget.potential && (
                  <span className={`cos-chip ${POTENTIAL_CLS[viewTarget.potential] ?? ""}`}>{viewTarget.potential}</span>
                )}
                {(() => {
                  const stage = stages.find((s) => s.id === viewTarget.status);
                  if (!stage) return null;
                  const cls = STAGE_CLS[stage.id] ?? "idea";
                  const colorMap: Record<string, string> = { idea: "ronin", draft: "amber", prep: "violet", rev: "signal", pub: "abstract" };
                  return <span className={`cos-chip ${colorMap[cls] ?? ""}`}>{stage.label}</span>;
                })()}
              </div>
              <button className="cos-row-action" onClick={() => setViewTarget(null)}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)", lineHeight: 1.3, marginBottom: 16 }}>
                {viewTarget.title ?? "Untitled Idea"}
              </h2>

              {viewTarget.description ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>{viewTarget.description}</p>
                </div>
              ) : null}

              {viewTarget.angle ? (
                <div className="cos-idea-angle" style={{ marginBottom: 14 }}>
                  <div className="cos-idea-angle-label">Angle</div>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>{viewTarget.angle}</p>
                </div>
              ) : null}

              {viewTarget.notes ? (
                <div style={{ background: "var(--surface-2)", borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
                  <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>Notes</div>
                  <p style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>{viewTarget.notes}</p>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-geist-mono)", fontSize: 10.5, color: "var(--fg-4)", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {timeAgo(viewTarget.created_at)}
                </span>
                <span>Priority {viewTarget.priority}/10</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
