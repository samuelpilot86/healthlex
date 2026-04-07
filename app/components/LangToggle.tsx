"use client";

import { useLang } from "./LanguageProvider";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-0.5 text-sm font-medium select-none">
      <button
        onClick={() => setLang("en")}
        className={`px-2 py-0.5 rounded transition-colors ${
          lang === "en"
            ? "text-teal-600 font-bold"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        EN
      </button>
      <span className="text-slate-300">|</span>
      <button
        onClick={() => setLang("fr")}
        className={`px-2 py-0.5 rounded transition-colors ${
          lang === "fr"
            ? "text-teal-600 font-bold"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        FR
      </button>
    </div>
  );
}
