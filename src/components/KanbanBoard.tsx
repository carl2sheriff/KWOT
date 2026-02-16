"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
export interface KanbanCard {
  id: string;
  title: string;
  amount?: number;
  client?: string;
  date?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onCardClick?: (card: KanbanCard) => void;
}

// Default columns (pipeline type)
export const defaultColumns: KanbanColumn[] = [
  { id: "new", title: "Nouveau", color: "bg-blue-500", cards: [] },
  { id: "qualified", title: "Qualifié", color: "bg-yellow-500", cards: [] },
  { id: "proposal", title: "Proposition", color: "bg-orange-500", cards: [] },
  { id: "negotiation", title: "Négociation", color: "bg-purple-500", cards: [] },
  { id: "won", title: "Gagné", color: "bg-emerald-500", cards: [] },
  { id: "lost", title: "Perdu", color: "bg-red-500", cards: [] },
];

// Sortable Card Component
function SortableCard({ 
  card, 
  onClick 
}: { 
  card: KanbanCard; 
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        p-3 mb-2 bg-zinc-800/80 rounded-lg border border-zinc-700
        cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-800
        transition-all group
        ${isDragging ? "shadow-lg shadow-emerald-500/20 border-emerald-500 opacity-50" : ""}
      `}
    >
      <h4 className="text-sm font-medium text-zinc-100 mb-1">
        {card.title}
      </h4>
      {card.client && (
        <p className="text-xs text-zinc-500 mb-2">{card.client}</p>
      )}
      <div className="flex items-center justify-between">
        {card.amount !== undefined && (
          <span className="text-sm font-semibold text-emerald-400">
            {card.amount.toLocaleString("fr-FR")}€
          </span>
        )}
        {card.date && (
          <span className="text-xs text-zinc-600">{card.date}</span>
        )}
      </div>
    </div>
  );
}

// Sortable Column Component
function SortableColumn({ 
  column, 
  onCardClick 
}: { 
  column: KanbanColumn;
  onCardClick?: (card: KanbanCard) => void;
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 bg-zinc-900/50 rounded-xl border border-zinc-800 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.color}`} />
          <span className="font-medium text-zinc-100">{column.title}</span>
          <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext 
        items={column.cards.map(c => c.id)} 
        strategy={horizontalListSortingStrategy}
      >
        <div className="p-2 min-h-[200px]">
          {column.cards.map((card) => (
            <SortableCard 
              key={card.id} 
              card={card} 
              onClick={() => onCardClick?.(card)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ columns, onCardMove, onCardClick }: KanbanBoardProps) {
  const [items, setItems] = useState<KanbanColumn[]>(columns);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when columns prop changes
  useState(() => {
    setItems(columns);
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source column and card
    let sourceColumn: KanbanColumn | undefined;
    let sourceIndex = -1;
    
    for (const col of items) {
      const idx = col.cards.findIndex(c => c.id === activeId);
      if (idx !== -1) {
        sourceColumn = col;
        sourceIndex = idx;
        break;
      }
    }

    if (!sourceColumn) return;

    // Check if dropped on a column
    const destColumn = items.find(col => col.id === overId);
    if (destColumn) {
      // Dropped on column header - move to end of that column
      const newItems = items.map(col => {
        if (col.id === sourceColumn!.id) {
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== activeId)
          };
        }
        if (col.id === overId) {
          return {
            ...col,
            cards: [...col.cards, sourceColumn!.cards[sourceIndex]]
          };
        }
        return col;
      });
      setItems(newItems);
      onCardMove?.(activeId, sourceColumn.id, overId);
      return;
    }

    // Dropped on another card - find destination
    let destColumnId: string | undefined;
    let destIndex = -1;

    for (const col of items) {
      const idx = col.cards.findIndex(c => c.id === overId);
      if (idx !== -1) {
        destColumnId = col.id;
        destIndex = idx;
        break;
      }
    }

    if (!destColumnId) return;

    if (sourceColumn.id === destColumnId) {
      // Same column reorder
      const newCards = arrayMove(sourceColumn.cards, sourceIndex, destIndex);
      setItems(items.map(col => 
        col.id === sourceColumn.id ? { ...col, cards: newCards } : col
      ));
    } else {
      // Different column
      const newItems = items.map(col => {
        if (col.id === sourceColumn!.id) {
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== activeId)
          };
        }
        if (col.id === destColumnId) {
          const card = sourceColumn!.cards[sourceIndex];
          const newCards = [...col.cards];
          newCards.splice(destIndex, 0, card);
          return { ...col, cards: newCards };
        }
        return col;
      });
      setItems(newItems);
      onCardMove?.(activeId, sourceColumn.id, destColumnId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4 min-h-[500px]">
        <SortableContext 
          items={items.map(c => c.id)} 
          strategy={horizontalListSortingStrategy}
        >
          {items.map((column) => (
            <SortableColumn 
              key={column.id} 
              column={column}
              onCardClick={onCardClick}
            />
          ))}
        </SortableContext>
      </div>
      
      <DragOverlay>
        {activeId ? (
          <div className="p-3 bg-zinc-800 rounded-lg border border-emerald-500 shadow-lg shadow-emerald-500/20">
            {/* Card preview */}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
