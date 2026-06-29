import { NextRequest } from "next/server";
import { CohereClient } from "cohere-ai";
import { QdrantClient } from "@qdrant/js-client-rest";
import Groq from "groq-sdk";

// ─── Clients ──────────────────────────────────────────────────────────────────

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY! });

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
  checkCompatibility: false,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const COLLECTION = process.env.QDRANT_COLLECTION ?? "lexsante";
const TOP_K = 5;
const RETRIEVAL_K = 15; // Nombre de chunks récupérés avant reranking

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Source {
  score: number;
  document: string;
  doc_id: string;
  source_url: string;
  page_start: number | null;
  text: string;
  chunk_id: string;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { question, theme, lang } = await req.json();
  const isEn = lang === "en";

  if (!question?.trim()) {
    return new Response(JSON.stringify({ error: isEn ? "Empty question" : "Question vide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Embedding de la question
  let vector: number[];
  try {
    const embedResponse = await cohere.embed({
      texts: [question],
      model: "embed-multilingual-v3.0",
      inputType: "search_query",
      embeddingTypes: ["float"],
    });
    // Cohere SDK v8 : embeddings est { float: number[][] } quand embeddingTypes est spécifié
    const raw = embedResponse.embeddings as
      | number[][]
      | { float?: number[][] };
    if (Array.isArray(raw)) {
      vector = raw[0];
    } else if (raw?.float) {
      vector = raw.float[0];
    } else {
      throw new Error(`Format d'embeddings inattendu : ${JSON.stringify(raw)}`);
    }
    console.log("[HealthLex] Vector ok, length:", vector?.length);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[HealthLex] Cohere embed error:", msg);
    return new Response(JSON.stringify({ error: "Erreur embedding Cohere", detail: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Recherche Qdrant
  // cnil_checklist est exclu après récupération (format quiz Vrai/Faux, peu pertinent)
  const EXCLUDED_DOC_IDS = ["cnil_checklist"];

  // Filtre langue (toujours actif) + filtre thématique optionnel
  const langFilter = { key: "lang", match: { value: isEn ? "en" : "fr" } };
  const filter =
    theme && theme !== "all"
      ? { must: [langFilter, { key: "doc_id", match: { value: theme } }] }
      : { must: [langFilter] };

  let sources: Source[];
  try {
    const results = await qdrant.search(COLLECTION, {
      vector,
      limit: RETRIEVAL_K + EXCLUDED_DOC_IDS.length,
      with_payload: true,
      ...(filter ? { filter } : {}),
    });

    const candidates = results
      .filter((hit) => !EXCLUDED_DOC_IDS.includes(hit.payload?.doc_id as string))
      .slice(0, RETRIEVAL_K)
      .map((hit) => ({
        score: hit.score,
        document: (hit.payload?.doc_label as string) ?? "Document inconnu",
        doc_id: (hit.payload?.doc_id as string) ?? "",
        source_url: (hit.payload?.source_url as string) ?? "",
        page_start: (hit.payload?.page_start as number) ?? null,
        text: (hit.payload?.text as string) ?? "",
        embed_text: (hit.payload?.embed_text as string) ?? "",
        chunk_id: String(hit.id),
      }));

    // 2b. Reranking Cohere — utilise embed_text (avec préfixe contextuel) si disponible
    const rerankResponse = await cohere.rerank({
      model: "rerank-multilingual-v3.0",
      query: question,
      documents: candidates.map((c) => c.embed_text || c.text),
      topN: TOP_K,
    });

    sources = rerankResponse.results.map((r) => {
      const { embed_text: _et, ...rest } = candidates[r.index];
      return { ...rest, score: r.relevanceScore };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const detail = (e as Record<string, unknown>)?.data ?? (e as Record<string, unknown>)?.body ?? msg;
    console.error("[HealthLex] Qdrant/rerank error:", msg, "| detail:", JSON.stringify(detail));
    console.error("[HealthLex] vector length:", vector?.length, "| filter:", JSON.stringify(filter));
    return new Response(JSON.stringify({ error: "Erreur recherche Qdrant", detail: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Construction du prompt RAG
  const context = sources
    .map((s, i) => `[Source ${i + 1} — ${s.document}]\n${s.text}`)
    .join("\n\n---\n\n");

  const systemPrompt = isEn
    ? `You are HealthLex, a legal assistant specialising in HealthTech regulation in France and Europe.
You answer exclusively based on the regulatory extracts provided in the context.
If the information is not in the context, say so clearly without inventing anything.
Cite relevant sources at the end of your answer (e.g. "Source 1 — MDR").
Respond in English, clearly and in a structured manner.`
    : `Tu es HealthLex, un assistant juridique spécialisé dans la réglementation HealthTech en France et en Europe.
Tu réponds uniquement à partir des extraits réglementaires fournis dans le contexte.
Si l'information n'est pas dans le contexte, dis-le clairement sans inventer.
Cite les sources pertinentes en fin de réponse (ex : « Source 1 — MDR »).
Réponds en français, de façon claire et structurée.`;

  const userPrompt = isEn
    ? `Regulatory context:\n\n${context}\n\n---\n\nQuestion: ${question}`
    : `Contexte réglementaire :\n\n${context}\n\n---\n\nQuestion : ${question}`;

  // 4. Streaming Groq
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Envoyer les sources en premier (comme événement JSON)
      const sourcesEvent = `data: ${JSON.stringify({ type: "sources", sources })}\n\n`;
      controller.enqueue(encoder.encode(sourcesEvent));

      try {
        const completion = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
          temperature: 0.1,
          max_tokens: 1024,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            const event = `data: ${JSON.stringify({ type: "token", token: delta })}\n\n`;
            controller.enqueue(encoder.encode(event));
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[HealthLex] Groq streaming error:", msg);
        const errEvent = `data: ${JSON.stringify({ type: "error", message: msg })}\n\n`;
        controller.enqueue(encoder.encode(errEvent));
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
