import { NextRequest } from "next/server";

// ─── Mapping doc_id → URL source du PDF ───────────────────────────────────────
// Toutes ces URLs sont celles utilisées lors du preprocessing (01_preprocess.py)

const PDF_URLS: Record<string, string> = {
  rgpd: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32016R0679",
  mdr: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32017R0745",
  ai_act: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=OJ:L_202401689",
  nis2: "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32022L2555",
  hds: "https://esante.gouv.fr/sites/default/files/media_entity/documents/referentiel_certification_hds_v1.1.pdf",
  cnil_entrepots:
    "https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_entrepot.pdf",
  cnil_checklist:
    "https://www.cnil.fr/sites/cnil/files/atoms/files/check-list_de_conformite_referentiel-donnes-sante.pdf",
  ans_dmn:
    "https://industriels.esante.gouv.fr/sites/default/files/media/document/ANS_DMN_Arbre-de-decision-DMn-V6_20231127.pdf",
  // EN versions
  gdpr: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679&from=EN",
  mdr_en: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32017R0745",
  ai_act_en: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689",
  nis2_en: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2555",
};

// Cache en mémoire pour éviter de re-télécharger le PDF à chaque ouverture
// (valable le temps de la session Next.js)
const pdfCache = new Map<string, ArrayBuffer>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  if (!docId || !PDF_URLS[docId]) {
    return new Response(JSON.stringify({ error: "Document inconnu" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Retourne depuis le cache si disponible
  if (pdfCache.has(docId)) {
    return new Response(pdfCache.get(docId)!, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": `inline; filename="${docId}.pdf"`,
      },
    });
  }

  // Téléchargement depuis la source
  try {
    const upstream = await fetch(PDF_URLS[docId], {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HealthLex/1.0)",
        Accept: "application/pdf,*/*",
      },
    });

    if (!upstream.ok) {
      throw new Error(`Upstream ${upstream.status}: ${upstream.statusText}`);
    }

    const buffer = await upstream.arrayBuffer();
    pdfCache.set(docId, buffer);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": `inline; filename="${docId}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[HealthLex] PDF proxy error (${docId}):`, msg);
    return new Response(JSON.stringify({ error: "Erreur téléchargement PDF", detail: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
