"use client";

import React, { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ParsedRow {
  [key: string]: string;
}

interface ColumnMapping {
  name: string;
  description: string;
  price: string;
  category: string;
  unit: string;
  sku: string;
}

const CSV_COLUMNS = [
  { key: "name", label: "Nom du produit", required: true },
  { key: "description", label: "Description", required: false },
  { key: "price", label: "Prix", required: false },
  { key: "category", label: "Catégorie", required: false },
  { key: "unit", label: "Unité", required: false },
  { key: "sku", label: "SKU", required: false },
];

export default function ImportProductsPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: "",
    description: "",
    price: "",
    category: "",
    unit: "",
    sku: "",
  });
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "done">("upload");
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors?: string[];
  } | null>(null);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      processFile(droppedFile);
    } else {
      toast.error("Veuillez uploader un fichier CSV");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = (file: File) => {
    setFile(file);
    
    Papa.parse(file, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("Le fichier CSV est vide");
          return;
        }
        
        const data = results.data as ParsedRow[];
        const headerRow = results.meta.fields || [];
        
        setHeaders(headerRow);
        setParsedData(data);
        
        // Auto-map columns based on header names
        const autoMapping: ColumnMapping = {
          name: "",
          description: "",
          price: "",
          category: "",
          unit: "",
          sku: "",
        };
        
        headerRow.forEach((header) => {
          const h = header.toLowerCase().trim();
          if (h === "name" || h === "nom" || h === "produit" || h === "libelle" || h === "label") {
            autoMapping.name = header;
          } else if (h === "description" || h === "desc") {
            autoMapping.description = header;
          } else if (h === "price" || h === "prix" || h === "tarif") {
            autoMapping.price = header;
          } else if (h === "category" || h === "categorie" || h === "cat") {
            autoMapping.category = header;
          } else if (h === "unit" || h === "unite" || h === "unity") {
            autoMapping.unit = header;
          } else if (h === "sku" || h === "ref" || h === "reference") {
            autoMapping.sku = header;
          }
        });
        
        setColumnMapping(autoMapping);
        setStep("mapping");
      },
      error: (error) => {
        toast.error(`Erreur lors du parsing: ${error.message}`);
      },
    });
  };

  const handleMappingChange = (key: keyof ColumnMapping, value: string) => {
    setColumnMapping((prev) => ({ ...prev, [key]: value }));
  };

  const getMappedData = () => {
    return parsedData.map((row) => ({
      name: columnMapping.name ? row[columnMapping.name] || "" : "",
      description: columnMapping.description ? row[columnMapping.description] || "" : undefined,
      price: columnMapping.price ? row[columnMapping.price] || "" : undefined,
      category: columnMapping.category ? row[columnMapping.category] || "" : undefined,
      unit: columnMapping.unit ? row[columnMapping.unit] || "" : undefined,
      sku: columnMapping.sku ? row[columnMapping.sku] || "" : undefined,
    }));
  };

  const handleImport = async () => {
    const products = getMappedData();
    
    setStep("importing");
    
    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      
      const json = await res.json();
      
      if (json.success) {
        setImportResult({
          imported: json.imported,
          errors: json.errors,
        });
        setStep("done");
        toast.success(`${json.imported} produit(s) importé(s)`);
      } else {
        toast.error(json.error || "Erreur lors de l'import");
        setStep("preview");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
      setStep("preview");
    }
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({
      name: "",
      description: "",
      price: "",
      category: "",
      unit: "",
      sku: "",
    });
    setStep("upload");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const previewData = getMappedData().slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/catalogue"
              className="p-1.5 -ml-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-lg font-semibold text-zinc-100">
              Importer des produits
            </h1>
          </div>
          
          {step !== "done" && (
            <div className="flex items-center gap-1 text-xs">
              <span className={`px-2 py-1 rounded-md ${step === "upload" ? "bg-accent/20 text-accent" : "text-zinc-500"}`}>
                1. Upload
              </span>
              <ArrowRight size={12} className="text-zinc-600" />
              <span className={`px-2 py-1 rounded-md ${step === "mapping" || step === "preview" ? "bg-accent/20 text-accent" : "text-zinc-500"}`}>
                2. Mapping
              </span>
              <ArrowRight size={12} className="text-zinc-600" />
              <span className={`px-2 py-1 rounded-md ${step === "preview" || step === "importing" ? "bg-accent/20 text-accent" : "text-zinc-500"}`}>
                3. Preview
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
                <Upload size={28} className="text-accent" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Uploader votre fichier CSV
              </h2>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Le fichier doit contenir les colonnes: nom, prix, catégorie, etc.
                Utilisez le point-virgule (;) comme séparateur.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-accent/50 rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 hover:bg-zinc-900/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet size={40} className="mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-300 font-medium mb-1">
                Glissez-déposez votre fichier CSV ici
              </p>
              <p className="text-zinc-600 text-sm">
                ou cliquez pour parcourir
              </p>
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">
                Format attendu
              </h3>
              <div className="font-mono text-xs text-zinc-500 bg-zinc-950 rounded-lg p-3 overflow-x-auto">
                name;description;price;category;unit<br />
                Retouche mascara;Retouche mascara luxe;150;Retouches;piece<br />
                Extension cils;Extension cils naturel;200;Extensions;piece
              </div>
            </div>
          </div>
        )}

        {/* Mapping Step */}
        {step === "mapping" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Mapper les colonnes
                </h2>
                <p className="text-zinc-500 text-sm">
                  Associez les colonnes de votre fichier aux champs Kwot
                </p>
              </div>
              <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={reset}>
                Réinitialiser
              </Button>
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800/50">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <FileSpreadsheet size={20} className="text-accent" />
                <span className="font-medium">{file?.name}</span>
                <span className="text-zinc-600 text-sm">
                  ({parsedData.length} lignes)
                </span>
              </div>

              <div className="space-y-4">
                {CSV_COLUMNS.map((col) => (
                  <div key={col.key} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <span className="text-sm text-zinc-300">
                        {col.label}
                        {col.required && <span className="text-danger ml-1">*</span>}
                      </span>
                    </div>
                    <select
                      value={columnMapping[col.key as keyof ColumnMapping]}
                      onChange={(e) => handleMappingChange(col.key as keyof ColumnMapping, e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-accent"
                    >
                      <option value="">-- Non mapper --</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={reset}>
                Annuler
              </Button>
              <Button
                variant="accent"
                onClick={() => setStep("preview")}
                disabled={!columnMapping.name}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Aperçu avant import
                </h2>
                <p className="text-zinc-500 text-sm">
                  Vérifiez les données qui seront importées
                </p>
              </div>
              <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={reset}>
                Réinitialiser
              </Button>
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                        Catégorie
                      </th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                        Unité
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                        <td className="px-4 py-3 text-zinc-200 font-medium">
                          {row.name || <span className="text-danger">Manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {row.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 tabular-nums">
                          {row.price || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {row.category || "-"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {row.unit || "piece"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <div className="px-4 py-3 bg-zinc-950/50 border-t border-zinc-800 text-center">
                  <span className="text-zinc-500 text-sm">
                    ... et {parsedData.length - 5} autres lignes
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("mapping")}>
                Retour
              </Button>
              <Button
                variant="accent"
                icon={<Upload size={14} />}
                onClick={handleImport}
              >
                Importer {parsedData.length} produit(s)
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={48} className="text-accent animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Import en cours...
            </h2>
            <p className="text-zinc-500">
              Veuillez patienter pendant l'importation des produits
            </p>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && importResult && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 mb-4">
                <Check size={28} className="text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Import terminé !
              </h2>
              <p className="text-zinc-500">
                {importResult.imported} produit(s) importé(s) avec succès
              </p>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-danger/10 rounded-xl p-4 border border-danger/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-danger" />
                  <span className="text-sm font-medium text-danger">
                    Erreurs rencontrées
                  </span>
                </div>
                <ul className="space-y-1">
                  {importResult.errors.slice(0, 5).map((error, i) => (
                    <li key={i} className="text-xs text-danger/80">
                      {error}
                    </li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li className="text-xs text-danger/80">
                      ... et {importResult.errors.length - 5} autres erreurs
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={reset}>
                Importer d'autres produits
              </Button>
              <Link href="/catalogue">
                <Button variant="accent" icon={<ArrowRight size={14} />}>
                  Voir le catalogue
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
