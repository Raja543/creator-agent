"use client";

import { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Clock, Trash2, Inbox } from "lucide-react";
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
  idea: "border-violet-400/40 bg-violet-400/5",
  draft: "border-blue-400/40 bg-blue-400/5",
  preparing: "border-amber-400/40 bg-amber-400/5",
  review: "border-orange-400/40 bg-orange-400/5",
  published: "border-green-400/40 bg-green-400/5",
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
  // @hello-pangea/dnd requires the board to be rendered only on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [grouped, setGrouped] = useState<Record<string, ContentIdea[]>>(() =>
    Object.fromEntries(stages.map((s) => [s.id, initialGrouped[s.id] ?? []]))
  );

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      setGrouped((prev) => {
        const sourceList = [...(prev[source.droppableId] ?? [])];
        const isSameCol = source.droppableId === destination.droppableId;
        const destList = isSameCol ? sourceList : [...(prev[destination.droppableId] ?? [])];

        const [moved] = sourceList.splice(source.index, 1);
        if (!moved) return prev;

        const updatedMoved = {
          ...moved,
          status: destination.droppableId as PipelineStatus,
        };
        destList.splice(destination.index, 0, updatedMoved);

        return {
          ...prev,
          [source.droppableId]: sourceList,
          [destination.droppableId]: destList,
        };
      });

      await fetch(`/api/ideas/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destination.droppableId }),
      });
    },
    []
  );

  const deleteIdea = useCallback(async (id: string, status: PipelineStatus) => {
    setGrouped((prev) => ({
      ...prev,
      [status]: (prev[status] ?? []).filter((i) => i.id !== id),
    }));
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
  }, []);

  const totalCards = Object.values(grouped).reduce(
    (sum, col) => sum + (col?.length ?? 0),
    0
  );

  if (!mounted) {
    // SSR skeleton — same column structure, no DnD
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
      <p className="text-xs text-muted-foreground mb-4">
        {totalCards} items in pipeline — drag cards between columns to update status
      </p>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {stages.map((stage) => {
            const cards = grouped[stage.id] ?? [];
            return (
              <div key={stage.id} className="w-[280px] shrink-0 flex flex-col">
                {/* Column header */}
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t border-x ${STAGE_HEADER_COLORS[stage.id] ?? "border-border bg-muted/30"}`}
                >
                  <span className={`text-sm font-semibold ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs bg-black/20 text-muted-foreground px-2 py-0.5 rounded-full tabular-nums">
                    {cards.length}
                  </span>
                </div>

                {/* Droppable column body */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[420px] max-h-[calc(100vh-280px)] overflow-y-auto rounded-b-xl border p-2 space-y-2 transition-colors duration-150 ${
                        snapshot.isDraggingOver
                          ? "bg-primary/8 border-primary/40"
                          : "bg-muted/20 border-border"
                      }`}
                    >
                      {cards.map((card, index) => (
                        <Draggable
                          key={card.id}
                          draggableId={card.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              className={`bg-card rounded-lg p-3 border select-none transition-shadow duration-150 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging
                                  ? "border-primary/50 shadow-xl shadow-black/20 rotate-1 opacity-95"
                                  : "border-border hover:border-muted-foreground/30 hover:shadow-sm"
                              }`}
                            >
                              <p className="text-xs font-medium text-foreground leading-snug">
                                {card.title}
                              </p>

                              <div className="flex flex-wrap gap-1 mt-2">
                                {card.format && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${FORMAT_COLORS[card.format] ?? "bg-muted text-muted-foreground"}`}
                                  >
                                    {card.format}
                                  </span>
                                )}
                                {card.potential && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${POTENTIAL_COLORS[card.potential] ?? "bg-muted text-muted-foreground"}`}
                                  >
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
                        <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-40">
                          <Inbox className="size-5 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground">
                            Drop here
                          </p>
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
