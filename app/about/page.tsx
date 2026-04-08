"use client";

import Link from "next/link";
import { useLang } from "../components/LanguageProvider";
import { LangToggle } from "../components/LangToggle";

const STACK_FR = [
  {
    tool: "Groq · Llama 3.3 70B",
    type: "LLM",
    advantage:
      "Inférence ultra-rapide avec streaming natif — la latence perçue reste inférieure à la seconde, ce qui est déterminant pour l'UX d'un chatbot.",
  },
  {
    tool: "Cohere embed-multilingual-v3.0",
    type: "Modèle d'embedding",
    advantage:
      "Modèle nativement multilingue (français / anglais juridique). Les 1 024 dimensions offrent un excellent compromis entre précision sémantique et coût de stockage.",
  },
  {
    tool: "Qdrant Cloud",
    type: "Base vectorielle",
    advantage:
      "Base vectorielle managée sur AWS eu-west, SDK TypeScript mature, filtres de métadonnées natifs — idéal pour restreindre la recherche par thème réglementaire.",
  },
  {
    tool: "Next.js (full-stack)",
    type: "Framework web",
    advantage:
      "Un seul dépôt, un seul déploiement. Les API Routes gardent les clés côté serveur sans backend séparé ; le streaming SSE s'intègre nativement.",
  },
  {
    tool: "Vercel",
    type: "Hébergement",
    advantage:
      "Déploiement continu en quelques secondes depuis GitHub, edge network mondial, HTTPS et variables d'environnement gérés de façon native.",
  },
];

const STACK_EN = [
  {
    tool: "Groq · Llama 3.3 70B",
    type: "LLM",
    advantage:
      "Ultra-fast inference with native streaming — perceived latency stays under one second, which is critical for chatbot UX.",
  },
  {
    tool: "Cohere embed-multilingual-v3.0",
    type: "Embedding Model",
    advantage:
      "Natively multilingual model (French / legal English). The 1,024 dimensions offer an excellent balance between semantic precision and storage cost.",
  },
  {
    tool: "Qdrant Cloud",
    type: "Vector Database",
    advantage:
      "Managed vector database on AWS eu-west, mature TypeScript SDK, native metadata filters — ideal for restricting search by regulatory topic.",
  },
  {
    tool: "Next.js (full-stack)",
    type: "Web Framework",
    advantage:
      "One repository, one deployment. API Routes keep keys server-side without a separate backend; SSE streaming integrates natively.",
  },
  {
    tool: "Vercel",
    type: "Hosting",
    advantage:
      "Continuous deployment in seconds from GitHub, global edge network, HTTPS and environment variables managed natively.",
  },
];

const T = {
  fr: {
    badge: "Portfolio PM IA",
    backLink: "← Retour au chat",
    h1: "Trouver les textes réglementaires HealthTech en quelques secondes",
    subtitle: "Un RAG de démonstration complet, du corpus réglementaire au déploiement Vercel.",
    problemTitle: "Le problème",
    problemText:
      "Les réglementations HealthTech — RGPD, MDR, AI Act, NIS2, HDS — représentent des milliers de pages de textes techniques. Identifier l'article exact applicable à une situation prend du temps, même pour un professionnel. HealthLex démontre qu'un système RAG peut localiser en quelques secondes les extraits pertinents et les citer avec précision — sans jamais les inventer.",
    stats: [
      { value: "8", label: "textes réglementaires" },
      { value: "2", label: "langues (FR / EN)" },
      { value: "1 552", label: "chunks indexés" },
      { value: "< 1s", label: "latence Groq (streaming)" },
    ],
    stackTitle: "Une stack technique efficiente",
    stackHeaders: ["Composant", "Avantages"],
    stack: STACK_FR,
    improvementsTitle: "Améliorations possibles",
    improvements: [
      "Élargir le corpus aux textes applicables aux États-Unis, aux normes non disponibles en accès libre (ISO…) et à la jurisprudence",
      "Veille juridique automatisée et actualisation continue du RAG",
    ],
    ctaButton: "Essayer HealthLex →",
  },
  en: {
    badge: "AI PM Portfolio",
    backLink: "← Back to chat",
    h1: "Find HealthTech Regulatory Texts in Seconds",
    subtitle: "A complete RAG demonstration, from regulatory corpus to Vercel deployment.",
    problemTitle: "The Problem",
    problemText:
      "HealthTech regulations — GDPR, MDR, AI Act, NIS2, HDS — span thousands of pages of technical text. Identifying the exact article applicable to a given situation takes time, even for a professional. HealthLex demonstrates that a RAG system can locate relevant excerpts in seconds and cite them precisely — without ever hallucinating.",
    stats: [
      { value: "8", label: "regulatory texts" },
      { value: "2", label: "languages (FR / EN)" },
      { value: "1,552", label: "indexed chunks" },
      { value: "< 1s", label: "Groq latency (streaming)" },
    ],
    stackTitle: "An Efficient Tech Stack",
    stackHeaders: ["Component", "Benefits"],
    stack: STACK_EN,
    improvementsTitle: "Possible Improvements",
    improvements: [
      "Extend the corpus to texts applicable in the United States, standards not freely available (ISO…) and case law",
      "Automated legal monitoring and continuous RAG updates",
    ],
    ctaButton: "Try HealthLex →",
  },
};

export default function AboutPage() {
  const { lang } = useLang();
  const t = T[lang];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex text-xl font-black tracking-tight">
              <span className="text-teal-600">Health</span><span className="text-slate-800">Lex</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-teal-600 transition-colors flex items-center gap-1"
            >
              {t.backLink}
            </Link>
            <LangToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-3">
            {t.h1}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        {/* Contexte */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-3">{t.problemTitle}</h2>
          <p className="text-slate-600 leading-relaxed">{t.problemText}</p>
        </section>

        {/* Chiffres */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {t.stats.map(({ value, label }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-black text-teal-600">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </section>

        {/* Stack technique */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">{t.stackTitle}</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-700 w-2/5">
                    {t.stackHeaders[0]}
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">
                    {t.stackHeaders[1]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.stack.map((row, i) => (
                  <tr
                    key={row.tool}
                    className={i < t.stack.length - 1 ? "border-b border-slate-100" : ""}
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-teal-700">{row.tool}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{row.type}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 leading-relaxed">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Améliorations possibles */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-amber-800 mb-3">{t.improvementsTitle}</h2>
          <ul className="space-y-2 text-sm text-amber-700">
            {t.improvements.map((item) => (
              <li key={item}>→ {item}</li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/"
            className="bg-teal-600 hover:bg-teal-700 transition-colors text-white rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            {t.ctaButton}
          </Link>
        </div>
      </div>
    </div>
  );
}
