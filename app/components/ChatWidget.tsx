"use client";

import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useLang } from "./LanguageProvider";

// Chargement différé du viewer PDF (lourd, inutile au premier rendu)
const PDFViewerModal = lazy(() => import("./PDFViewerModal"));

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  score: number;
  document: string;
  doc_id: string;
  source_url: string;
  page_start: number | null;
  text: string;
  chunk_id: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

// ─── Traductions ───────────────────────────────────────────────────────────────

const DOCS_FR = [
  { id: "all",            label: "Tous les textes" },
  { id: "rgpd",           label: "RGPD" },
  { id: "mdr",            label: "MDR" },
  { id: "ai_act",         label: "AI Act" },
  { id: "nis2",           label: "NIS2" },
  { id: "hds",            label: "HDS" },
  { id: "cnil_entrepots", label: "CNIL — Entrepôts" },
  { id: "cnil_checklist", label: "CNIL — Checklist" },
  { id: "ans_dmn",        label: "ANS — DMN" },
];

const DOCS_EN = [
  { id: "all",            label: "All texts" },
  { id: "gdpr",           label: "GDPR" },
  { id: "mdr_en",         label: "MDR" },
  { id: "ai_act_en",      label: "AI Act" },
  { id: "nis2_en",        label: "NIS2" },
  { id: "hds",            label: "HDS (FR)" },
  { id: "cnil_entrepots", label: "CNIL — Entrepôts (FR)" },
  { id: "cnil_checklist", label: "CNIL — Checklist (FR)" },
  { id: "ans_dmn",        label: "ANS — DMN (FR)" },
];

const CHAT_T = {
  fr: {
    filterLabel: "Restreindre à :",
    welcome:
      "Bonjour ! Je suis HealthLex, un moteur de recherche dans la réglementation HealthTech (RGPD, MDR, AI Act, NIS2, HDS…). Posez-moi une question sur un texte réglementaire et je vous citerai les extraits pertinents.",
    placeholder: "Posez votre question réglementaire…",
    suggestionsLabel: "Questions fréquentes :",
    suggestions: [
      "Quelles exigences l'AI Act impose-t-il aux systèmes d'IA à haut risque ?",
      "Quelles sont les catégories spéciales de données au sens du RGPD ?",
    ],
    sourceLabel: (i: number, doc: string) => `Source ${i + 1} — ${doc}`,
    readDoc: "Read in document",
  },
  en: {
    filterLabel: "Restrict to:",
    welcome:
      "Hello! I'm HealthLex, a search engine for HealthTech regulation (GDPR, MDR, AI Act, NIS2, HDS…). Ask me a question about a regulatory text and I'll cite the relevant excerpts.",
    placeholder: "Ask your regulatory question…",
    suggestionsLabel: "Frequently asked:",
    suggestions: [
      "What requirements does the AI Act impose on high-risk AI systems?",
      "What are the special categories of data under the GDPR?",
    ],
    sourceLabel: (i: number, doc: string) => `Source ${i + 1} — ${doc}`,
    readDoc: "Read in document",
  },
} as const;

// ─── Sous-composants ───────────────────────────────────────────────────────────

function SourceCard({
  source,
  index,
  readDocLabel,
}: {
  source: Source;
  index: number;
  readDocLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const score = Math.round(source.score * 100);
  const { lang } = useLang();
  const t = CHAT_T[lang];

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
        {/* ── En-tête cliquable ── */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <span className="font-medium text-slate-700 truncate">
            {t.sourceLabel(index, source.document)}
          </span>
          <span className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                score >= 70
                  ? "bg-green-100 text-green-700"
                  : score >= 55
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {score}%
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {/* ── Texte du chunk ── */}
        {open && (
          <div className="bg-white border-t border-slate-100">
            <p className="px-3 pt-2 pb-1 text-slate-600 leading-relaxed text-xs">
              {source.text.length > 500 ? source.text.slice(0, 500) + "…" : source.text}
            </p>

            {/* ── Bouton "Lire dans le document" ── */}
            <div className="px-3 pb-2 flex items-center gap-2">
              <button
                onClick={() => setShowPDF(true)}
                className="flex items-center gap-1.5 text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-full transition-colors font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {readDocLabel}
                {source.page_start && (
                  <span className="bg-teal-200 text-teal-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    p. {source.page_start}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Viewer PDF (lazy-loaded) ── */}
      {showPDF && (
        <Suspense fallback={null}>
          <PDFViewerModal
            docId={source.doc_id}
            docLabel={source.document}
            chunkText={source.text}
            pageStart={source.page_start}
            onClose={() => setShowPDF(false)}
          />
        </Suspense>
      )}
    </>
  );
}

function MessageBubble({ msg, readDocLabel }: { msg: Message; readDocLabel: string }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">HL</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">HealthLex</span>
          </div>
        )}

        {/* Bulle */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-teal-600 text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.sources.map((src, i) => (
              <SourceCard key={src.chunk_id} source={src} index={i} readDocLabel={readDocLabel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ChatWidget() {
  const { lang } = useLang();
  const t = CHAT_T[lang];

  const makeWelcome = (l: keyof typeof CHAT_T): Message => ({
    role: "assistant",
    content: CHAT_T[l].welcome,
  });

  const [messages, setMessages] = useState<Message[]>([makeWelcome(lang)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("all");
  const shouldScrollRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Au changement de langue :
  // - si le dernier message assistant est un accueil → le remplacer dans la nouvelle langue
  // - si une conversation est en cours → ne pas interrompre
  // - remettre le filtre thématique à "all" (les doc_ids diffèrent entre FR et EN)
  useEffect(() => {
    const welcomeTexts = [CHAT_T.fr.welcome, CHAT_T.en.welcome];
    setMessages((prev) => {
      const last = [...prev].reverse().find((m) => m.role === "assistant");
      if (last && (welcomeTexts as string[]).includes(last.content)) {
        return prev.map((m) => (m === last ? makeWelcome(lang) : m));
      }
      return prev;
    });
    setTheme("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setLoading(true);

    shouldScrollRef.current = true;
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    const assistantPlaceholder: Message = { role: "assistant", content: "", sources: [] };
    shouldScrollRef.current = true;
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang, theme }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || errBody.error || `Server error ${res.status}`);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          const parsed = JSON.parse(data);

          if (parsed.type === "sources") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], sources: parsed.sources };
              return next;
            });
          } else if (parsed.type === "token") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: next[next.length - 1].content + parsed.token,
              };
              return next;
            });
          } else if (parsed.type === "error") {
            throw new Error(parsed.message);
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: `⚠️ Error: ${errMsg}`,
        };
        return next;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} readDocLabel={t.readDoc} />
        ))}

        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (affiché seulement au début) */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">{t.suggestionsLabel}</p>
          <div className="flex flex-wrap gap-2">
            {t.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  inputRef.current?.focus();
                }}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:border-teal-400 hover:text-teal-700 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtre thématique */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2">
        <span className="text-xs text-slate-400 shrink-0">{t.filterLabel}</span>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          disabled={loading}
          className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 cursor-pointer"
        >
          {(lang === "fr" ? DOCS_FR : DOCS_EN).map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.label}</option>
          ))}
        </select>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-slate-200 bg-white flex gap-2 items-end"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          rows={1}
          disabled={loading}
          className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 max-h-32 overflow-y-auto"
          style={{ minHeight: "42px" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
