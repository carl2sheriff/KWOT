"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
}

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string) => void;
  error?: string;
}

function ClientSelector({ value, onChange, error }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.data || data.clients || data || []);
      }
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchClients(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen, fetchClients]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && !selectedClient) {
      fetch(`/api/clients?search=`)
        .then((res) => res.json())
        .then((data) => {
          const list = data.data || data.clients || data || [];
          const found = list.find((c: Client) => c.id === value);
          if (found) setSelectedClient(found);
        })
        .catch(() => {});
    }
  }, [value, selectedClient]);

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    onChange(client.id);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(null);
    onChange("");
    setSearch("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Client</label>

      <div
        className={[
          "w-full border rounded-lg px-3 py-2.5 text-sm transition-colors bg-surface cursor-pointer flex items-center justify-between gap-2",
          isOpen ? "border-accent" : error ? "border-danger" : "border-zinc-800",
        ].join(" ")}
        onClick={handleOpen}
      >
        {selectedClient ? (
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="font-medium text-zinc-100">{selectedClient.name}</span>
              {selectedClient.company && (
                <span className="text-zinc-500 ml-2 text-xs">{selectedClient.company}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-zinc-600 hover:text-danger transition-colors p-1"
              aria-label="Effacer"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-zinc-600">Selectionner un client</span>
            <ChevronDown size={16} className="text-zinc-600" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-2 left-0 right-0 bg-surface-raised border border-zinc-800 rounded-lg shadow-card overflow-hidden">
            <div className="p-3 border-b border-zinc-800/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full bg-surface border border-zinc-800 rounded-md pl-9 pr-3 py-2 text-sm text-zinc-200 outline-none focus:border-accent transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-auto">
              {loading ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-xs text-zinc-500">Chargement...</span>
                </div>
              ) : clients.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-xs text-zinc-500">Aucun client</span>
                </div>
              ) : (
                clients.map((client) => {
                  const isSelected = client.id === value;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelect(client)}
                      className={[
                        "w-full text-left px-4 py-3 transition-colors cursor-pointer",
                        isSelected
                          ? "bg-accent-muted border-l-2 border-accent"
                          : "hover:bg-zinc-800/50 border-l-2 border-transparent",
                      ].join(" ")}
                    >
                      <div className="font-medium text-sm text-zinc-100">{client.name}</div>
                      {client.company && (
                        <div className="text-xs text-zinc-500 mt-0.5">{client.company}</div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-2xs text-danger mt-1 font-medium">{error}</p>}
    </div>
  );
}

export { ClientSelector };
export type { ClientSelectorProps };
