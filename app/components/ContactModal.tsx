"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  lang: "fr" | "en";
}

const T = {
  fr: {
    title: "Me contacter",
    name: "Nom",
    email: "Email",
    message: "Message",
    send: "Envoyer",
    sending: "Envoi…",
    success: "Message envoyé, merci !",
    error: "Une erreur est survenue. Réessayez.",
    namePlaceholder: "Votre nom",
    emailPlaceholder: "votre@email.com",
    messagePlaceholder: "Votre message…",
  },
  en: {
    title: "Contact me",
    name: "Name",
    email: "Email",
    message: "Message",
    send: "Send",
    sending: "Sending…",
    success: "Message sent, thank you!",
    error: "Something went wrong. Please try again.",
    namePlaceholder: "Your name",
    emailPlaceholder: "your@email.com",
    messagePlaceholder: "Your message…",
  },
};

export default function ContactModal({ onClose, lang }: Props) {
  const t = T[lang];
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        {/* Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl leading-none"
          aria-label="Fermer"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-slate-800 mb-4">{t.title}</h2>

        {status === "success" ? (
          <p className="text-teal-600 font-medium py-6 text-center">{t.success}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t.name}</label>
              <input
                required
                type="text"
                placeholder={t.namePlaceholder}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t.email}</label>
              <input
                required
                type="email"
                placeholder={t.emailPlaceholder}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t.message}</label>
              <textarea
                required
                rows={4}
                placeholder={t.messagePlaceholder}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              />
            </div>
            {status === "error" && (
              <p className="text-red-500 text-xs">{t.error}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors text-white rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              {status === "sending" ? t.sending : t.send}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
