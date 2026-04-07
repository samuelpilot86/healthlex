"""
HealthLex — Script d'ingestion dans Qdrant
==========================================
Ce script lit le corpus.jsonl, génère les embeddings via Cohere
et les indexe dans Qdrant Cloud.

Usage :
    python scripts/02_ingest.py

Prérequis :
    pip3 install -r scripts/requirements.txt
    pip3 install qdrant-client cohere python-dotenv
"""

import json
import os
import time
from dotenv import load_dotenv
import cohere
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from tqdm import tqdm

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
load_dotenv()

QDRANT_URL     = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
COLLECTION     = os.getenv("QDRANT_COLLECTION", "lexsante")

EMBEDDING_MODEL = "embed-multilingual-v3.0"
EMBEDDING_DIM   = 1024   # Dimension des vecteurs embed-multilingual-v3.0
BATCH_SIZE      = 48     # Nombre de chunks envoyés à Cohere par batch

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_FILE = os.path.join(BASE_DIR, "corpus", "chunks", "corpus.jsonl")


# ─────────────────────────────────────────────
# INITIALISATION DES CLIENTS
# ─────────────────────────────────────────────
def init_clients():
    cohere_client = cohere.Client(COHERE_API_KEY)
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    return cohere_client, qdrant_client


# ─────────────────────────────────────────────
# CRÉATION DE LA COLLECTION QDRANT
# ─────────────────────────────────────────────
def create_collection(qdrant: QdrantClient):
    existing = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION in existing:
        print(f"  Collection '{COLLECTION}' déjà existante — on la recrée proprement.")
        qdrant.delete_collection(COLLECTION)

    qdrant.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
    )
    print(f"  ✓ Collection '{COLLECTION}' créée ({EMBEDDING_DIM} dimensions, cosine)")


# ─────────────────────────────────────────────
# GÉNÉRATION DES EMBEDDINGS + INDEXATION
# ─────────────────────────────────────────────
def ingest(cohere_client: cohere.Client, qdrant: QdrantClient, chunks: list):
    total = len(chunks)
    indexed = 0

    for i in tqdm(range(0, total, BATCH_SIZE), desc="Ingestion"):
        batch = chunks[i : i + BATCH_SIZE]
        texts = [c["text"] for c in batch]

        # Génération des embeddings via Cohere avec retry sur 429
        for attempt in range(5):
            try:
                response = cohere_client.embed(
                    texts=texts,
                    model=EMBEDDING_MODEL,
                    input_type="search_document",
                )
                embeddings = response.embeddings
                break
            except Exception as e:
                if "429" in str(e) or "rate limit" in str(e).lower():
                    wait = 15 * (attempt + 1)
                    print(f"\n  ⏳ Rate limit Cohere — attente {wait}s...")
                    time.sleep(wait)
                else:
                    raise

        # Préparation des points Qdrant
        points = []
        for j, (chunk, vector) in enumerate(zip(batch, embeddings)):
            points.append(PointStruct(
                id=i + j,
                vector=vector,
                payload={
                    "id":          chunk["id"],
                    "doc_id":      chunk["doc_id"],
                    "doc_label":   chunk["doc_label"],
                    "theme":       chunk["theme"],
                    "source_url":  chunk["source_url"],
                    "chunk_index": chunk["chunk_index"],
                    "page_start":  chunk.get("page_start"),
                    "lang":        chunk.get("lang", "fr"),
                    "text":        chunk["text"],
                },
            ))

        qdrant.upsert(collection_name=COLLECTION, points=points)
        indexed += len(batch)

        # Délai pour respecter le rate limit Cohere free tier (100k tokens/min)
        time.sleep(5)

    return indexed


# ─────────────────────────────────────────────
# TEST DE RECHERCHE
# ─────────────────────────────────────────────
def test_search(cohere_client: cohere.Client, qdrant: QdrantClient):
    test_query = "Mon logiciel de santé est-il un dispositif médical ?"
    print(f"\n🔍 Test de recherche : \"{test_query}\"")

    # Embedding de la question
    response = cohere_client.embed(
        texts=[test_query],
        model=EMBEDDING_MODEL,
        input_type="search_query",
    )
    query_vector = response.embeddings[0]

    # Recherche dans Qdrant
    results = qdrant.query_points(
        collection_name=COLLECTION,
        query=query_vector,
        limit=3,
    ).points

    print("\nTop 3 résultats :")
    for r in results:
        print(f"\n  [{r.score:.3f}] {r.payload['doc_label']}")
        print(f"  → {r.payload['text'][:200]}...")


# ─────────────────────────────────────────────
# PIPELINE PRINCIPAL
# ─────────────────────────────────────────────
def main():
    print("\n🏥 HealthLex — Ingestion dans Qdrant")
    print("=" * 50)

    # Chargement du corpus
    print(f"\n📂 Chargement du corpus...")
    with open(CORPUS_FILE, encoding="utf-8") as f:
        chunks = [json.loads(line) for line in f if line.strip()]
    print(f"  ✓ {len(chunks)} chunks chargés")

    # Initialisation
    print(f"\n🔌 Connexion aux services...")
    cohere_client, qdrant = init_clients()
    print(f"  ✓ Cohere connecté")
    print(f"  ✓ Qdrant connecté ({QDRANT_URL})")

    # Création de la collection
    print(f"\n📦 Création de la collection Qdrant...")
    create_collection(qdrant)

    # Ingestion
    print(f"\n⚙️  Génération des embeddings et indexation...")
    print(f"  (modèle : {EMBEDDING_MODEL}, batch : {BATCH_SIZE})")
    indexed = ingest(cohere_client, qdrant, chunks)

    print(f"\n✅ Ingestion terminée : {indexed} chunks indexés")

    # Test de recherche
    test_search(cohere_client, qdrant)

    print(f"\nProchaine étape : construction de l'API RAG (Next.js)")


if __name__ == "__main__":
    main()
