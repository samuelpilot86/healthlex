import { NextRequest } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION = process.env.QDRANT_COLLECTION ?? "lexsante";

// Ping quotidien (cron Vercel) pour empêcher la suspension du cluster Qdrant gratuit.
export async function GET(req: NextRequest) {
  // Sécurité : Vercel envoie "Authorization: Bearer <CRON_SECRET>" si la variable est définie.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const qdrant = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY!,
      checkCompatibility: false,
    });
    const info = await qdrant.getCollection(COLLECTION);
    return Response.json({
      ok: true,
      collection: COLLECTION,
      points: info.points_count,
      at: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[HealthLex] keepalive error:", msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
