"use client";

import Link from "next/link";
import { useLang } from "../components/LanguageProvider";
import { LangToggle } from "../components/LangToggle";

const STACK_FR = [
  {
    tool: "Llama 3.3 70B, Groq",
    type: "LLM et inférence",
    advantage:
      "Llama est un modèle de langage open source. L'inférence est réalisée par Groq, entreprise qui a conçu des puces spécialisées pour l'inférence de LLM, ce qui permet une génération de réponse rapide.",
  },
  {
    tool: "Cohere embed-multilingual-v3.0",
    type: "Modèle d'embedding",
    advantage:
      "Un modèle d'embedding apprend les textes réglementaires, ou plus préciément les transforme en représentations sémantiques (vecteurs). Le modèle choisi prend en charge l'anglais mais aussi le français. Les 1 024 dimensions des vecteurs sémantiques offrent un excellent compromis entre précision sémantique et coût de stockage.",
  },
  {
    tool: "Qdrant Cloud",
    type: "Base vectorielle",
    advantage:
      "La base vectorielle stocke les représentations sémantiques des textes réglementaires, permet leur rapprochement avec la question posée et restitue les extraits réglementaires pertinents. Hébergée sur un serveur Amazon Web Services en Irlande. Permet un filtrage par langue et par texte réglementaire",
  },
  {
    tool: "Next.js (full-stack)",
    type: "Framework web",
    advantage:
      "Framework comprenant le front-end (interface) et le back-end (traitements), facilitant la gestion du code, le déploiement et certaines fonctionnalités (affichage de la réponse au fil de sa génération).",
  },
  {
    tool: "Vercel",
    type: "Hébergement",
    advantage:
      "Permet un accès par le Web via une simple URL. Les modifications sont rapidement intégrées, accélérant le développement et les tests.",
  },
];

const STACK_EN = [
  {
    tool: "Llama 3.3 70B, Groq",
    type: "LLM and inference",
    advantage:
      "Llama is an open-source language model. Inference is handled by Groq, a company that designed specialised chips for LLM inference, enabling fast response generation.",
  },
  {
    tool: "Cohere embed-multilingual-v3.0",
    type: "Embedding model",
    advantage:
      "An embedding model learns regulatory texts — or more precisely, transforms them into semantic representations (vectors). The chosen model supports both English and French. The 1,024 dimensions of the semantic vectors offer an excellent balance between semantic precision and storage cost.",
  },
  {
    tool: "Qdrant Cloud",
    type: "Vector database",
    advantage:
      "The vector database stores the semantic representations of regulatory texts, matches them against the question asked, and returns the relevant regulatory excerpts. Hosted on an Amazon Web Services server in Ireland. Supports filtering by language and by regulatory text.",
  },
  {
    tool: "Next.js (full-stack)",
    type: "Web framework",
    advantage:
      "A framework covering both the front-end (interface) and back-end (processing), simplifying code management, deployment, and certain features (streaming the response as it is generated).",
  },
  {
    tool: "Vercel",
    type: "Hosting",
    advantage:
      "Provides web access via a simple URL. Updates are deployed quickly, speeding up development and testing.",
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
