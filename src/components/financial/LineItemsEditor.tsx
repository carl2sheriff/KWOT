"use client";

import React, { useCallback, useMemo } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface LineItem {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discount: number;
  taxRate: number;
  total: number;
  position: number;
  section?: string;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readOnly?: boolean;
}

const PRODUCTION_SECTIONS = [
  "Pre-production",
  "Production",
  "Post-production",
  "Droits & Assurances",
  "Frais generaux",
];

const SECTION_AUTRES = "Autres";

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function calculateRowTotal(quantity: number, unitPrice: number, discount: number): number {
  return quantity * unitPrice - discount;
}

/** Get a short label for the section chip (first letter, or first letters for multi-word) */
function sectionInitial(section: string): string {
  const words = section.split(/[\s&]+/).filter(Boolean);
  if (words.length === 1) return words[0][0].toUpperCase();
  return words.map((w) => w[0].toUpperCase()).join("");
}

interface SectionGroup {
  section: string;
  items: { item: LineItem; originalIndex: number }[];
}

function LineItemsEditor({ items, onChange, readOnly = false }: LineItemsEditorProps) {
  const handleFieldChange = useCallback(
    (index: number, field: keyof LineItem, rawValue: string) => {
      const updated = [...items];
      const item = { ...updated[index] };

      if (field === "description") {
        item.description = rawValue;
      } else if (field === "section") {
        item.section = rawValue || undefined;
      } else if (field === "quantity" || field === "unitPrice" || field === "discount" || field === "taxRate") {
        const numValue = parseFloat(rawValue) || 0;
        (item as Record<string, unknown>)[field] = numValue;
        item.total = calculateRowTotal(
          field === "quantity" ? numValue : item.quantity,
          field === "unitPrice" ? numValue : item.unitPrice,
          field === "discount" ? numValue : item.discount,
        );
      }

      updated[index] = item;
      onChange(updated);
    },
    [items, onChange],
  );

  const handleAddItem = useCallback(
    (section?: string) => {
      const newItem: LineItem = {
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 20,
        total: 0,
        position: items.length + 1,
        section: section || undefined,
      };
      onChange([...items, newItem]);
    },
    [items, onChange],
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      const updated = items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, position: i + 1 }));
      onChange(updated);
    },
    [items, onChange],
  );

  // Group items by section, preserving original indices
  const groupedSections: SectionGroup[] = useMemo(() => {
    const sectionMap = new Map<string, { item: LineItem; originalIndex: number }[]>();

    // Initialize groups for predefined sections (in order) so they appear even if empty only when at least one item uses sections
    const hasSections = items.some((item) => item.section);

    items.forEach((item, index) => {
      const sectionKey = item.section || SECTION_AUTRES;
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, []);
      }
      sectionMap.get(sectionKey)!.push({ item, originalIndex: index });
    });

    // If no items use sections at all, return a single "flat" group with no section headers
    if (!hasSections) {
      return [
        {
          section: "",
          items: items.map((item, index) => ({ item, originalIndex: index })),
        },
      ];
    }

    // Build ordered groups: predefined sections first, then any custom sections, then "Autres"
    const result: SectionGroup[] = [];

    for (const section of PRODUCTION_SECTIONS) {
      const sectionItems = sectionMap.get(section);
      if (sectionItems && sectionItems.length > 0) {
        result.push({ section, items: sectionItems });
        sectionMap.delete(section);
      }
    }

    // Any remaining custom sections (not in PRODUCTION_SECTIONS and not "Autres")
    for (const [section, sectionItems] of sectionMap) {
      if (section !== SECTION_AUTRES && sectionItems.length > 0) {
        result.push({ section, items: sectionItems });
      }
    }

    // "Autres" group at the end
    const autresItems = sectionMap.get(SECTION_AUTRES);
    if (autresItems && autresItems.length > 0) {
      result.push({ section: SECTION_AUTRES, items: autresItems });
    }

    return result;
  }, [items]);

  const hasSections = useMemo(() => items.some((item) => item.section), [items]);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // All section options for the dropdown
  const sectionOptions = [...PRODUCTION_SECTIONS, SECTION_AUTRES];

  const renderRow = (
    item: LineItem,
    originalIndex: number,
    displayIndex: number,
  ) => (
    <div
      key={item.id || `line-${originalIndex}`}
      className="group grid grid-cols-[40px_1fr_80px_120px_100px_70px_120px_40px] gap-2 text-sm py-3 border-b border-zinc-800/30 items-center"
    >
      <div className="flex items-center gap-1 text-zinc-600 min-w-0">
        {readOnly ? (
          <>
            {item.section && (
              <span
                className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold bg-zinc-800/60 text-zinc-500"
                title={item.section}
              >
                {sectionInitial(item.section)}
              </span>
            )}
            <span className="text-xs">{displayIndex}</span>
          </>
        ) : (
          <>
            <GripVertical size={14} className="shrink-0 cursor-grab text-zinc-700" />
            {hasSections && (
              <select
                value={item.section || ""}
                onChange={(e) => handleFieldChange(originalIndex, "section", e.target.value)}
                className="w-5 h-5 shrink-0 appearance-none bg-zinc-800/60 text-[9px] font-bold text-zinc-500 rounded text-center cursor-pointer border-0 outline-none hover:bg-zinc-700/60 transition-colors p-0"
                title={item.section || "No section"}
                style={{ textAlignLast: "center" }}
              >
                <option value="">--</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>
                    {sectionInitial(s)}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      <div>
        {readOnly ? (
          <span className="text-zinc-200">{item.description}</span>
        ) : (
          <input
            type="text"
            value={item.description}
            onChange={(e) => handleFieldChange(originalIndex, "description", e.target.value)}
            placeholder="Description de l'article"
            className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 placeholder:text-zinc-700 transition-colors"
          />
        )}
      </div>

      <div>
        {readOnly ? (
          <span className="block text-right text-zinc-300 tabular-nums">{formatNumber(item.quantity)}</span>
        ) : (
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleFieldChange(originalIndex, "quantity", e.target.value)}
            min={0}
            step={1}
            className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 text-right tabular-nums transition-colors"
          />
        )}
      </div>

      <div>
        {readOnly ? (
          <span className="block text-right text-zinc-300 tabular-nums">{formatNumber(item.unitPrice)}</span>
        ) : (
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => handleFieldChange(originalIndex, "unitPrice", e.target.value)}
            min={0}
            step={0.01}
            className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 text-right tabular-nums transition-colors"
          />
        )}
      </div>

      <div>
        {readOnly ? (
          <span className="block text-right text-zinc-300 tabular-nums">{formatNumber(item.discount)}</span>
        ) : (
          <input
            type="number"
            value={item.discount}
            onChange={(e) => handleFieldChange(originalIndex, "discount", e.target.value)}
            min={0}
            step={0.01}
            className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 text-right tabular-nums transition-colors"
          />
        )}
      </div>

      <div>
        {readOnly ? (
          <span className="block text-right text-zinc-300 tabular-nums">{item.taxRate}%</span>
        ) : (
          <input
            type="number"
            value={item.taxRate}
            onChange={(e) => handleFieldChange(originalIndex, "taxRate", e.target.value)}
            min={0}
            max={100}
            step={0.01}
            className="w-full bg-transparent border-0 border-b border-transparent focus:border-zinc-700 outline-none text-sm text-zinc-200 py-1 text-right tabular-nums transition-colors"
          />
        )}
      </div>

      <div className="text-right font-semibold tabular-nums text-zinc-100">
        {formatNumber(item.total)}
      </div>

      <div className="flex items-center justify-center">
        {!readOnly && (
          <button
            type="button"
            onClick={() => handleRemoveItem(originalIndex)}
            className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-danger-muted rounded"
            aria-label="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const renderSectionHeader = (sectionName: string) => (
    <div
      key={`section-header-${sectionName}`}
      className="flex items-center justify-between bg-zinc-800/30 rounded px-3 py-1.5 mt-3 mb-1"
    >
      <span className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
        {sectionName}
      </span>
      {!readOnly && (
        <button
          type="button"
          onClick={() => handleAddItem(sectionName)}
          className="text-zinc-600 hover:text-accent transition-colors p-0.5 rounded hover:bg-zinc-800/50"
          aria-label={`Ajouter dans ${sectionName}`}
          title={`Ajouter dans ${sectionName}`}
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );

  // Track a running display index across all groups
  let runningDisplayIndex = 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_80px_120px_100px_70px_120px_40px] gap-2 text-2xs font-medium text-zinc-500 border-b border-zinc-800/50 pb-2">
        <div>#</div>
        <div>Description</div>
        <div className="text-right">Qte</div>
        <div className="text-right">Prix unit.</div>
        <div className="text-right">Remise</div>
        <div className="text-right">TVA</div>
        <div className="text-right">Total</div>
        <div />
      </div>

      {/* Grouped rows */}
      {groupedSections.map((group) => {
        // If section is empty string, it means no sections are in use -- render flat
        const showHeader = group.section !== "";

        return (
          <React.Fragment key={`section-${group.section || "flat"}`}>
            {showHeader && renderSectionHeader(group.section)}
            {group.items.map(({ item, originalIndex }) => {
              runningDisplayIndex += 1;
              return renderRow(item, originalIndex, runningDisplayIndex);
            })}
          </React.Fragment>
        );
      })}

      {/* Add item button at the bottom */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => handleAddItem()}
          className="mt-3 text-accent text-xs font-medium flex items-center gap-2 py-2 px-1 hover:bg-accent-muted rounded-lg transition-colors"
        >
          <Plus size={14} />
          Ajouter un article
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-800/50">
        <div className="flex justify-end">
          <div className="flex justify-between w-72">
            <span className="text-xs text-zinc-500">Sous-total</span>
            <span className="text-sm font-semibold text-zinc-100 tabular-nums">
              {formatNumber(subtotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LineItemsEditor, PRODUCTION_SECTIONS };
export type { LineItem, LineItemsEditorProps };
