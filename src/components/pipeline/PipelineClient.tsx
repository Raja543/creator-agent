"use client";

import { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Clock, Trash2, Inbox, ChevronRight, ChevronLeft } from "lucide-react";
import type { ContentIdea, PipelineStatus } from "@/lib/database.types";

interface Stage {
  id: PipelineStatus;
  label: string;
  color: string;
}

interface Props {
  stages: Stage[];
  initialGrouped: Record<string, ContentIdea[] | null>;
}

const FORMAT_COLORS: Record<string, string> = {
  thread: "bg-blue-400/15 text-blue-400",
  infographic: "bg-violet-400/15 text-violet-400",
  guide: "bg-cyan-400/15 text-cyan-400",
  comparison: "bg-amber-400/15 text-amber-400",
  analysis: "bg-orange-400/15 text-orange-400",
  narrative: "bg-pink-400/15 text-pink-400",
  breakdown: "bg-green-400/15 text-green-400",
};

const POTENTIAL_COLORS: Record<string, string> = {
  high: "bg-green-400/15 text-green-400",
  medium: "bg-amber-400/15 text-amber-400",
  low: "bg-muted text-muted-foreground",
};

const STAGE_HEADER_COLORS: Record<string, string> = {
  idea: "border-violet-400/40 bg-gradient-to-r from-violet-400/10 to-violet-400/5",
  draft: "border-blue-400/40 bg-gradient-to-r from-blue-400/10 to-blue-400/5",
  preparing: "border-amber-400/40 bg-gradient-to-r from-amber-400/10 to-amber-400/5",
  review: "border-orange-400/40 bg-gradient-to-r from-orange-400/10 to-orange-400/5",
  published: "border-green-400/40 bg-gradient-to-r from-green-400/10 to-green-400/5",
};

const POTENTIAL_BORDER: Record<string, string> = {
  high: "border-l-green-400",
  medium: "border-l-amber-400",
  low: "border-l-border",
};

function parseUTC(iso: string): Date {
  const hasZone = iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : iso + "Z");
}

function formatRelative(isoString: string) {
  const diff = Date.now() - parseUTC(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function PipelineClient({ stages, initialGrouped }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="w-[280px] shrink-0 flex flex-col">
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-t border-x ${STAGE_HEADER_COLORS[stage.id] ?? ""}`}>
              <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {(initialGrouped[stage.id] ?? []).length}
              </span>
            </div>
            <div className="flex-1 min-h-[400px] rounded-b-xl border border-border bg-muted/20 p-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        {totalCards} items in pipeline
      </p>

      {/* ── Mobile: tab-based single column ── */}
      <div className="md:hidden">
        {/* Stage tabs — scrollable with fade hint */}
        <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {stages.map((stage) => {
            const count = grouped[stage.id]?.length ?? 0;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeStage === stage.id
                    ? "bg-card border border-primary/30 text-foreground"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={activeStage === stage.id ? stage.color : ""}>{stage.label}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeStage === stage.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>

        {/* Active stage cards */}
        {(() => {
          const cards = grouped[activeStage] ?? [];
          const currentStageIdx = stages.findIndex((s) => s.id === activeStage);
          const nextStage = stages[currentStageIdx + 1];
          const prevStage = stages[currentStageIdx - 1];
          return cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card border border-border rounded-xl">
              <Inbox className="size-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No cards in this stage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className={`bg-card border border-border border-l-2 rounded-xl p-4 ${POTENTIAL_BORDER[card.potential ?? "low"] ?? "border-l-border"}`}>
                  <p className="text-sm font-bold text-foreground leading-snug mb-3">{card.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {card.format && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${FORMAT_COLORS[card.format] ?? "bg-muted text-muted-foreground"}`}>
                        {card.format}
                      </span>
                    )}
                    {card.potential && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${POTENTIAL_COLORS[card.potential] ?? "bg-muted text-muted-foreground"}`}>
                        {card.potential}
                      </span>
                    )}
                  </div>
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatRelative(card.created_at)}
                      </div>
                      <button
                        onClick={() => deleteIdea(card.id, card.status)}
                        className="p-1 rounded text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {prevStage ? (
                        <button
                          onClick={() => moveToPrevStage(card)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                        >
                          <ChevronLeft className="size-3" />
                          {prevStage.label}
                        </button>
                      ) : <span />}
                      {nextStage && (
                        <button
                          onClick={() => moveToNextStage(card)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          {nextStage.label}
                          <ChevronRight className="size-3" />
                        </button>
                      )}
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
        <div className="hidden md:flex gap-4 overflow-x-auto pb-6">
          {stages.map((stage) => {
            const cards = grouped[stage.id] ?? [];
            return (
              <div key={stage.id} className="w-[280px] shrink-0 flex flex-col">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t border-x ${STAGE_HEADER_COLORS[stage.id] ?? "border-border bg-muted/30"}`}>
                  <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${cards.length > 0 ? "bg-card/60 text-foreground" : "bg-black/20 text-muted-foreground"}`}>
                    {cards.length}
                  </span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[420px] max-h-[calc(100vh-280px)] overflow-y-auto rounded-b-xl border p-2 space-y-2 transition-colors duration-150 ${
                        snapshot.isDraggingOver ? "bg-primary/8 border-primary/40" : "bg-muted/20 border-border"
                      }`}
                    >
                      {cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              className={`bg-card rounded-lg p-3 border-l-2 border border-border select-none transition-all duration-150 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging
                                  ? "border-l-primary border-primary/30 shadow-xl shadow-black/30 rotate-1 opacity-95 scale-105"
                                  : `${POTENTIAL_BORDER[card.potential ?? "low"] ?? "border-l-border"} hover:border-muted-foreground/30 hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5`
                              }`}
                            >
                              <p className="text-xs font-bold text-foreground leading-snug">{card.title}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {card.format && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${FORMAT_COLORS[card.format] ?? "bg-muted text-muted-foreground"}`}>
                                    {card.format}
                                  </span>
                                )}
                                {card.potential && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${POTENTIAL_COLORS[card.potential] ?? "bg-muted text-muted-foreground"}`}>
                                    {card.potential}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="size-2.5" />
                                  {formatRelative(card.created_at)}
                                </div>
                                <button
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => deleteIdea(card.id, card.status)}
                                  className="text-muted-foreground/50 hover:text-destructive transition-colors p-0.5 rounded"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-30 border-2 border-dashed border-border rounded-lg m-1">
                          <Inbox className="size-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Drop here</p>
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
    </div>
  );
}
