"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker pdf.js — on utilise le fichier du package installé localement
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDFViewerModalProps {
  docId: string;
  docLabel: string;
  chunkText: string;
  pageStart: number | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrait les ~6 premiers mots du chunk pour le surlignage */
function getSearchWords(text: string): string[] {
  return text
    .replace(/[^\w\sàâäéèêëîïôùûüç-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 8);
}

/** Surligneur de texte : encadre les mots-clés dans le rendu react-pdf */
function makeHighlighter(searchWords: string[]) {
  return function highlightText({ str }: { str: string }): string {
    if (!searchWords.length) return str;
    const escaped = searchWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
    return str.replace(
      pattern,
      '<mark style="background:#fde68a;border-radius:2px;padding:0 1px">$1</mark>'
    );
  };
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PDFViewerModal({
  docId,
  docLabel,
  chunkText,
  pageStart,
  onClose,
}: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(pageStart ?? 1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const pdfUrl = `/api/pdf?docId=${encodeURIComponent(docId)}`;
  const searchWords = getSearchWords(chunkText);
  const highlightText = makeHighlighter(searchWords);

  // Fermeture via Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Scroll vers le haut quand on change de page
  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      // Saute directement à la page du chunk si disponible
      if (pageStart && pageStart <= numPages) {
        setCurrentPage(pageStart);
      }
    },
    [pageStart]
  );

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message);
    setLoading(false);
  }, []);

  const goTo = (page: number) =>
    setCurrentPage(Math.max(1, Math.min(numPages, page)));

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panneau */}
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl mx-4"
           style={{ height: "90vh" }}>

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{docLabel}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {numPages > 0 ? `${numPages} pages` : "Chargement…"}
              {pageStart && ` · Extrait p. ${pageStart}`}
            </p>
          </div>

          {/* Contrôles zoom */}
          <div className="flex items-center gap-2 mx-4 shrink-0">
            <button
              onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center"
            >
              −
            </button>
            <span className="text-xs text-slate-500 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors text-lg shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ── Extrait du chunk (contexte) ── */}
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 shrink-0">
          <p className="text-xs text-amber-700 font-semibold mb-0.5">Extrait recherché :</p>
          <p className="text-xs text-amber-800 leading-relaxed line-clamp-2">
            {chunkText.slice(0, 200)}…
          </p>
        </div>

        {/* ── Visionneuse PDF ── */}
        <div ref={pageRef} className="flex-1 overflow-y-auto bg-slate-100 flex justify-center py-4">
          {error ? (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <p className="text-red-500 font-semibold mb-2">Impossible de charger le PDF</p>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <a
                href={`/api/pdf?docId=${encodeURIComponent(docId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 underline text-sm"
              >
                Ouvrir directement ↗
              </a>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-64">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                customTextRenderer={highlightText}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
        </div>

        {/* ── Pagination ── */}
        {numPages > 0 && (
          <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-slate-200 shrink-0">
            <button
              onClick={() => goTo(1)}
              disabled={currentPage === 1}
              className="text-xs text-slate-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              ««
            </button>
            <button
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-xs text-slate-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              ‹ Préc.
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => goTo(Number(e.target.value))}
                className="w-14 text-center text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <span className="text-sm text-slate-400">/ {numPages}</span>
            </div>

            <button
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === numPages}
              className="text-xs text-slate-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              Suiv. ›
            </button>
            <button
              onClick={() => goTo(numPages)}
              disabled={currentPage === numPages}
              className="text-xs text-slate-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1"
            >
              »»
            </button>

            {pageStart && (
              <button
                onClick={() => goTo(pageStart)}
                className="ml-2 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors font-medium"
              >
                → p. {pageStart}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
