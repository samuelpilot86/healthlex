"use client";

import Link from "next/link";
import { useState } from "react";
import ChatWidget from "./components/ChatWidget";
import { LangToggle } from "./components/LangToggle";
import { useLang } from "./components/LanguageProvider";
import ContactModal from "./components/ContactModal";

const CORPUS_ITEMS = [
  {
    icon: "🔒",
    labelFr: "RGPD",
    labelEn: "GDPR",
    descFr: "Règlement Général sur la Protection des Données",
    descEn: "General Data Protection Regulation",
    urlFr: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32016R0679",
    urlEn: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679",
  },
  {
    icon: "🏥",
    labelFr: "MDR",
    labelEn: "MDR",
    descFr: "Dispositifs médicaux (UE) 2017/745",
    descEn: "Medical Devices (EU) 2017/745",
    urlFr: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32017R0745",
    urlEn: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32017R0745",
  },
  {
    icon: "🤖",
    labelFr: "AI Act",
    labelEn: "AI Act",
    descFr: "Règlement sur l'IA (UE) 2024/1689",
    descEn: "AI Regulation (EU) 2024/1689",
    urlFr: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=OJ:L_202401689",
    urlEn: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689",
  },
  {
    icon: "🛡️",
    labelFr: "NIS2",
    labelEn: "NIS2",
    descFr: "Directive cybersécurité (UE) 2022/2555",
    descEn: "Cybersecurity Directive (EU) 2022/2555",
    urlFr: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32022L2555",
    urlEn: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2555",
  },
  {
    icon: "🏨",
    labelFr: "HDS",
    labelEn: "HDS",
    descFr: "Hébergement de données de santé — référentiel de certification",
    descEn: "Health Data Hosting — certification framework (FR)",
    urlFr: "https://esante.gouv.fr/sites/default/files/media_entity/documents/ANS_referentiel-HDS_V1-1.pdf",
    urlEn: null, // French authority — no official English version
  },
  {
    icon: "🔍",
    labelFr: "CNIL — Entrepôts",
    labelEn: "CNIL — Entrepôts",
    descFr: "Référentiel entrepôts de données de santé",
    descEn: "Health Data Warehouse Reference Framework (FR)",
    urlFr: "https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_entrepot.pdf",
    urlEn: null, // French authority — no official English version
  },
  {
    icon: "✅",
    labelFr: "CNIL — Checklist",
    labelEn: "CNIL — Checklist",
    descFr: "Checklist mise en conformité données de santé",
    descEn: "Health Data Compliance Checklist (FR)",
    urlFr: "https://www.cnil.fr/sites/cnil/files/atoms/files/cnil_guide_securite_personnelle_sante.pdf",
    urlEn: null, // French authority — no official English version
  },
  {
    icon: "🌿",
    labelFr: "ANS — DMN",
    labelEn: "ANS — DMN",
    descFr: "Arbre de décision qualification DMN",
    descEn: "Decision Tree for DMN Qualification (FR)",
    urlFr: "https://industriels.esante.gouv.fr/sites/default/files/media/document/ANS_DMN_Arbre-de-decision-DMn-V6_20231127.pdf",
    urlEn: null, // French authority — no official English version
  },
];

const T = {
  fr: {
    badge: "Démo",
    heroLine1: "La réglementation HealthTech,",
    heroLine2: "retrouvée en quelques secondes.",
    heroSub:
      "HealthLex parcourt la réglementation européenne pour vous retourner les extraits exacts — sans jamais inventer, chaque réponse renvoie au texte officiel.",
    corpusTitle: "Corpus réglementaire intégré :",
    ctaMain: "Comprendre le projet →",
    ctaSub: "Problème · Stack technique · Améliorations",
    footerLeftPrefix: "HealthLex · Démo portfolio de product manager IA de",
    footerRight: "Usage démo uniquement",
  },
  en: {
    badge: "Demo",
    heroLine1: "HealthTech regulation,",
    heroLine2: "found in seconds.",
    heroSub:
      "HealthLex searches European regulation to return exact excerpts — without ever hallucinating, every answer links back to the official text.",
    corpusTitle: "Integrated Regulatory Corpus:",
    ctaMain: "Understand the project →",
    ctaSub: "Problem · Tech Stack · Improvements",
    footerLeftPrefix: "HealthLex · AI product manager portfolio demo by",
    footerRight: "For demo use only",
  },
};

export default function Home() {
  const { lang } = useLang();
  const t = T[lang];
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col">
      {/* ── Navbar ── */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="HealthLex logo" className="h-8 w-8" />
            <span className="inline-flex text-xl font-black tracking-tight">
              <span className="text-teal-600">Health</span><span className="text-slate-800">Lex</span>
            </span>
            <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
              {t.badge}
            </span>
          </div>
          <LangToggle />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
          {t.heroLine1}<br />
          <span className="text-teal-600">{t.heroLine2}</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          {t.heroSub}
        </p>
      </section>

      {/* ── Main layout : Chat + Corpus ── */}
      <section className="max-w-6xl mx-auto px-4 pb-16 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden"
          style={{ minHeight: "560px" }}
        >
          <ChatWidget />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Corpus */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>📚</span> {t.corpusTitle}
            </h2>
            <div className="space-y-2">
              {CORPUS_ITEMS.map((item) => {
                const label = lang === "fr" ? item.labelFr : item.labelEn;
                const desc = lang === "fr" ? item.descFr : item.descEn;
                const url = lang === "fr" ? item.urlFr : (item.urlEn ?? item.urlFr);
                return (
                  <a
                    key={item.labelFr}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 text-sm group hover:bg-slate-50 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
                  >
                    <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">
                        {label}
                      </span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-500 text-xs">{desc}</span>
                    </div>
                    <span className="ml-auto shrink-0 text-slate-300 group-hover:text-teal-400 transition-colors text-xs mt-0.5">
                      {lang === "fr" || item.urlEn ? "PDF ↗" : "PDF (FR) ↗"}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/about"
            className="bg-teal-600 hover:bg-teal-700 transition-colors text-white rounded-2xl p-4 text-center block"
          >
            <p className="font-bold text-sm">{t.ctaMain}</p>
            <p className="text-teal-200 text-xs mt-0.5">{t.ctaSub}</p>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">{t.footerLeftPrefix} Samuel PILOT</span>
            {/* LinkTree */}
            <a href="https://linktr.ee/samuelpilot" target="_blank" rel="noopener noreferrer" title="LinkTree"
              className="text-slate-400 hover:text-[#39e09b] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.051 2.286a1.5 1.5 0 0 0-2.102 0L7.07 6.165l-1.06-1.06a1.5 1.5 0 0 0-2.122 2.121l2.121 2.122a1.5 1.5 0 0 0 2.122 0l.768-.768V20.25a1.5 1.5 0 0 0 3 0V8.58l.768.768a1.5 1.5 0 0 0 2.122 0l2.121-2.122a1.5 1.5 0 0 0-2.121-2.121l-1.06 1.06-3.879-3.879ZM7.5 14.25a1.5 1.5 0 0 0-3 0v6a1.5 1.5 0 0 0 3 0v-6Zm12 0a1.5 1.5 0 0 0-3 0v6a1.5 1.5 0 0 0 3 0v-6Z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://www.linkedin.com/in/samuel-pi/" target="_blank" rel="noopener noreferrer" title="LinkedIn"
              className="text-slate-400 hover:text-[#0a66c2] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            {/* Mail */}
            <button onClick={() => setContactOpen(true)} title={lang === "fr" ? "Me contacter" : "Contact me"}
              className="text-slate-400 hover:text-teal-600 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </button>
          </span>
          <span>{t.footerRight}</span>
        </div>
      </footer>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} lang={lang} />}
    </div>
  );
}
