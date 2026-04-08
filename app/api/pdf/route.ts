import { NextRequest, NextResponse } from "next/server";

// doc_id → nom de fichier dans /public/pdfs/
const PDF_FILES: Record<string, string> = {
  rgpd:           "rgpd.pdf",
  mdr:            "mdr.pdf",
  ai_act:         "ai_act.pdf",
  nis2:           "nis2.pdf",
  hds:            "hds.pdf",
  cnil_entrepots: "cnil_entrepots.pdf",
  cnil_checklist: "cnil_checklist.pdf",
  ans_dmn:        "ans_dmn.pdf",
  gdpr:           "gdpr.pdf",
  mdr_en:         "mdr_en.pdf",
  ai_act_en:      "ai_act_en.pdf",
  nis2_en:        "nis2_en.pdf",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  if (!docId || !PDF_FILES[docId]) {
    return NextResponse.json({ error: "Document inconnu" }, { status: 404 });
  }

  // Redirige vers le fichier statique dans /public/pdfs/
  return NextResponse.redirect(new URL(`/pdfs/${PDF_FILES[docId]}`, req.url));
}
