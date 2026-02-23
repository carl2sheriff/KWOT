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
import { Calendar, User, Euro, GripVertical } from "lucide-react";

// Types
export interface KanbanCard {
  id: string;
  title: string;
  amount?: number;
  client?: string;
  date?: string;
  status?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onCardClick?: (card: KanbanCard) => void;
}

// Default columns with correct colors
export const defaultColumns: KanbanColumn[] = [
  { id: "new", title: "Nouveau", color: "bg-blue-500", bgColor: "bg-blue-500/10", cards: [] },
  { id: "qualified", title: "Qualifié", color: "bg-yellow-500", bgColor: "bg-yellow-500/10", cards: [] },
  { id: "proposal", title: "Proposition", color: "bg-orange-500", bgColor: "bg-orange-500/10", cards: [] },
  { id: "negotiation", title: "Négociation", color: "bg-purple-500", bgColor: "bg-purple-500/10", cards: [] },
  { id: "won", title: "Gagné", color: "bg-emerald-500", bgColor: "bg-emerald-500/10", cards: [] },
  { id: "lost", title: "Perdu", color: "bg-red-500", bgColor: "bg-red-500/10", cards: [] },
];

// Status color mapping
const getStatusColor = (columnId: string) => {
  switch (columnId) {
    case "new": return "border-l-blue-500";
    case "qualified": return "border-l-yellow-500";
    case "proposal": return "border-l-orange-500";
    case "negotiation": return "border-l-purple-500";
    case "won": return "border-l-emerald-500";
    case "lost": return "border-l-red-500";
    default: return "border-l-zinc-500";
  }
};

// Sortable Card Component
function SortableCard({ 
  card, 
  columnId,
  onClick 
}: { 
  card: KanbanCard; 
  columnId: string;
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
        p-4 mb-3 bg-white dark:bg-zinc-800 rounded-lg 
        border border-zinc-200 dark:border-zinc-700
        border-l-4 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600
        cursor-grab active:cursor-grabbing
        transition-all group
        ${getStatusColor(columnId)}
        ${isDragging ? "shadow-xl shadow-black/20 border-2 border-zinc-400 opacity-90 scale-105" : ""}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 flex-1">
          {card.title}
        </h4>
        <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
      </div>
      
      {card.client && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <User className="w-3 h-3" />
          <span className="truncate">{card.client}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-700">
        {card.amount !== undefined && card.amount > 0 && (
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {card.amount.toLocaleString("fr-FR")}€
          </span>
        )}
        {card.date && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Calendar className="w-3 h-3" />
            <span>{card.date}</span>
          </div>
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

  // Calculate column total
  const columnTotal = column.cards.reduce((sum, card) => sum + (card.amount || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      {/* Header */}
      <div className={`p-3 border-b-2 ${column.color.replace('bg-', 'border-')}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color} animate-pulse`} />
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{column.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              {column.cards.length}
            </span>
          </div>
        </div>
        {columnTotal > 0 && (
          <div className="mt-2 text-xs text-zinc-500 font-medium">
            {columnTotal.toLocaleString("fr-FR")}€
          </div>
        )}
      </div>

      {/* Cards */}
      <SortableContext 
        items={column.cards.map(c => c.id)} 
        strategy={horizontalListSortingStrategy}
      >
        <div className="p-2 min-h-[300px] max-h-[calc(100vh-300px)] overflow-y-auto">
          {column.cards.map((card) => (
            <SortableCard 
              key={card.id} 
              card={card}
              columnId={column.id}
              onClick={() => onCardClick?.(card)}
            />
          ))}
          {column.cards.length === 0 && (
            <div className="flex items-center justify-center h-24 text-zinc-400 text-sm">
              Aucun devis
            </div>
          )}
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

  // Find active card for overlay
  const activeCard = activeId 
    ? items.flatMap(col => col.cards).find(c => c.id === activeId)
    : null;

  const activeColumn = activeCard
    ? items.find(col => col.cards.some(c => c.id === activeId))
    : null;

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
        {activeCard && activeColumn ? (
          <div className={`
            p-4 bg-white dark:bg-zinc-800 rounded-lg 
            border-2 border-zinc-400 shadow-2xl shadow-black/30
            border-l-4 w-80
            ${getStatusColor(activeColumn.id)}
          `}>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2">
              {activeCard.title}
            </h4>
            {activeCard.client && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                <User className="w-3 h-3" />
                <span className="truncate">{activeCard.client}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-700">
              {activeCard.amount !== undefined && activeCard.amount > 0 && (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {activeCard.amount.toLocaleString("fr-FR")}€
                </span>
              )}
              {activeCard.date && (
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <Calendar className="w-3 h-3" />
                  <span>{activeCard.date}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
