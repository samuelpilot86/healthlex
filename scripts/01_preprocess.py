"""
HealthLex — Script de preprocessing du corpus
=============================================
Ce script télécharge les documents réglementaires, extrait le texte
des sections pertinentes, découpe en chunks et sauvegarde en JSONL.

Usage :
    python scripts/01_preprocess.py

Prérequis :
    pip install -r scripts/requirements.txt
"""

import os
import json
import time
import re
import requests
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from tqdm import tqdm


def sent_tokenize(text: str) -> list[str]:
    """Découpe un texte en phrases par regex, sans dépendance NLTK.

    Découpe sur : . ! ? suivi d'un espace + majuscule ou fin de chaîne,
    tout en évitant les abréviations courantes (Art., n°, al., etc.).
    Convient aux textes réglementaires FR/EN.
    """
    # Remplace les abréviations fréquentes pour éviter les faux découpages
    ABBREVS = r"(?:Art|art|al|n°|No|no|cf|p|pp|vol|ibid|id|op|cit|fig|tab|vs|Dr|Mr|Mrs|Ms|Prof|Mme|M|par|§|aff|anc|anx|annexe|chap|chapitre|titre|section|sect|para|reg|règl|dir|déc|décis|arrêté|ord|loi|c|v|ex|inc|Ltd|Corp|Co|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\."
    placeholder = text
    placeholder = re.sub(ABBREVS, lambda m: m.group().replace(".", "\x00"), placeholder)

    # Découpe sur la ponctuation de fin de phrase
    parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-ÿ\d(«\"])", placeholder)

    sentences = []
    for part in parts:
        # Restaure les points d'abréviation
        part = part.replace("\x00", ".")
        part = part.strip()
        if part:
            sentences.append(part)
    return sentences if sentences else [text]

# ─────────────────────────────────────────────
# CONFIGURATION DU CORPUS
# ─────────────────────────────────────────────
# Pour chaque document :
#   - url        : lien de téléchargement
#   - type       : "pdf" ou "html"
#   - id         : identifiant court unique
#   - label      : nom affiché dans l'interface
#   - theme      : catégorie thématique
#   - sections   : mots-clés de début/fin de section à extraire (None = tout)
#   - max_pages  : limite de pages à extraire (None = tout)

CORPUS = [
    # ── Corpus français ───────────────────────────────────────────────────────
    {
        "id": "rgpd",
        "lang": "fr",
        "label": "RGPD — Règlement Général sur la Protection des Données",
        "theme": "Protection des données",
        "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32016R0679",
        "type": "pdf",
        "sections": ["CHAPITRE I", "CHAPITRE II", "CHAPITRE III", "CHAPITRE IV", "CHAPITRE IX"],
        "max_pages": None,
    },
    {
        "id": "mdr",
        "lang": "fr",
        "label": "MDR — Règlement (UE) 2017/745 sur les Dispositifs Médicaux",
        "theme": "Dispositifs médicaux",
        "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32017R0745",
        "type": "pdf",
        "sections": ["CHAPITRE I", "CHAPITRE II", "CHAPITRE III", "ANNEXE VIII"],
        "max_pages": None,
    },
    {
        "id": "ai_act",
        "lang": "fr",
        "label": "IA Act — Règlement (UE) 2024/1689 sur l'Intelligence Artificielle",
        "theme": "Intelligence artificielle",
        "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=OJ:L_202401689",
        "type": "pdf",
        "sections": ["TITRE I", "TITRE II", "TITRE III", "TITRE IV", "ANNEXE III"],
        "max_pages": None,
    },
    {
        "id": "nis2",
        "lang": "fr",
        "label": "NIS2 — Directive (UE) 2022/2555 sur la Cybersécurité",
        "theme": "Cybersécurité",
        "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32022L2555",
        "type": "pdf",
        "sections": None,
        "max_pages": None,
    },
    {
        "id": "hds",
        "lang": "fr",
        "label": "HDS — Référentiel de certification Hébergement Données de Santé (v2)",
        "theme": "Hébergement données de santé",
        "url": "https://esante.gouv.fr/sites/default/files/media_entity/documents/referentiel_certification_hds---fr--v2.pdf",
        "type": "pdf",
        "sections": None,
        "max_pages": None,
    },
    {
        "id": "cnil_entrepots",
        "lang": "fr",
        "label": "CNIL — Référentiel entrepôts de données de santé",
        "theme": "Protection des données",
        "url": "https://www.cnil.fr/sites/cnil/files/atoms/files/referentiel_entrepot.pdf",
        "type": "pdf",
        "sections": None,
        "max_pages": None,
    },
    {
        "id": "cnil_checklist",
        "lang": "fr",
        "label": "CNIL — Check-list de conformité entrepôts de données de santé",
        "theme": "Protection des données",
        "url": "https://www.cnil.fr/sites/cnil/files/atoms/files/check-list_de_conformite_referentiel-donnes-sante.pdf",
        "type": "pdf",
        "sections": None,
        "max_pages": None,
    },
    {
        "id": "ans_dmn",
        "lang": "fr",
        "label": "ANS — Arbre de décision qualification Dispositif Médical Numérique",
        "theme": "Dispositifs médicaux",
        "url": "https://industriels.esante.gouv.fr/sites/default/files/media/document/ANS_DMN_Arbre-de-decision-DMn-V6_20231127.pdf",
        "type": "pdf",
        "sections": None,
        "max_pages": None,
    },
    # Legifrance (secret_medical, lil) retourne HTTP 403 aux requêtes automatisées — exclus du corpus
    # ── Corpus anglais (versions EN officielles EUR-Lex) ──────────────────────
    {
        "id": "gdpr",
        "lang": "en",
        "label": "GDPR — General Data Protection Regulation",
        "theme": "Protection des données",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679&from=EN",
        "type": "pdf",
        "sections": ["CHAPTER I", "CHAPTER II", "CHAPTER III", "CHAPTER IV", "CHAPTER IX"],
        "max_pages": None,
    },
    {
        "id": "mdr_en",
        "lang": "en",
        "label": "MDR — Medical Devices Regulation (EU) 2017/745",
        "theme": "Dispositifs médicaux",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32017R0745",
        "type": "pdf",
        "sections": ["CHAPTER I", "CHAPTER II", "CHAPTER III", "ANNEX VIII"],
        "max_pages": None,
    },
    {
        "id": "ai_act_en",
        "lang": "en",
        "label": "AI Act — Regulation (EU) 2024/1689 on Artificial Intelligence",
        "theme": "Intelligence artificielle",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401689",
        "type": "pdf",
        "sections": ["TITLE I", "TITLE II", "TITLE III", "TITLE IV", "ANNEX III"],
        "max_pages": None,
    },
    {
        "id": "nis2_en",
        "lang": "en",
        "label": "NIS2 — Cybersecurity Directive (EU) 2022/2555",
        "theme": "Cybersécurité",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2555",
        "type": "pdf",
        "sections": None,
        "max_pages": None,
    },
]

# ─────────────────────────────────────────────
# PARAMÈTRES DE CHUNKING
# ─────────────────────────────────────────────
CHUNK_SIZE = 800       # Taille d'un chunk en tokens (approx.)
CHUNK_OVERLAP = 150    # Recouvrement entre chunks pour préserver le contexte

# ─────────────────────────────────────────────
# CHEMINS
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "corpus", "raw")
CHUNKS_DIR = os.path.join(BASE_DIR, "corpus", "chunks")
OUTPUT_FILE = os.path.join(CHUNKS_DIR, "corpus.jsonl")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(CHUNKS_DIR, exist_ok=True)


# ─────────────────────────────────────────────
# FONCTIONS UTILITAIRES
# ─────────────────────────────────────────────

def download_file(url: str, dest_path: str) -> bool:
    """Télécharge un fichier si pas déjà présent (et non vide)."""
    # Si le fichier existe mais est vide, on le supprime pour re-télécharger
    if os.path.exists(dest_path):
        if os.path.getsize(dest_path) == 0:
            print(f"  ⚠ Fichier vide détecté, re-téléchargement : {os.path.basename(dest_path)}")
            os.remove(dest_path)
        else:
            print(f"  ✓ Déjà téléchargé : {os.path.basename(dest_path)}")
            return True
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; HealthLex/1.0)"}
        response = requests.get(url, headers=headers, timeout=60, stream=True)
        response.raise_for_status()
        with open(dest_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        # Vérifie que le fichier n'est pas vide après téléchargement
        if os.path.getsize(dest_path) == 0:
            os.remove(dest_path)
            print(f"  ✗ Fichier vide reçu depuis {url} — URL peut-être invalide")
            return False
        print(f"  ✓ Téléchargé : {os.path.basename(dest_path)}")
        return True
    except Exception as e:
        print(f"  ✗ Échec téléchargement {url} : {e}")
        return False


def clean_text(text: str) -> str:
    """Nettoie le texte extrait : supprime les espaces multiples,
    les numéros de page, les en-têtes répétitifs."""
    # Supprime les lignes qui ne sont que des numéros de page
    text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
    # Normalise les espaces multiples
    text = re.sub(r"[ \t]+", " ", text)
    # Normalise les sauts de ligne multiples (max 2)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Supprime les caractères de contrôle sauf \n
    text = re.sub(r"[^\S\n]+", " ", text)
    return text.strip()


def extract_sections_from_text(text: str, section_keywords: list) -> str:
    """Extrait les sections pertinentes d'un texte long
    en cherchant les mots-clés de section."""
    if not section_keywords:
        return text

    lines = text.split("\n")
    result_parts = []
    in_section = False
    current_section_lines = []

    for line in lines:
        line_upper = line.strip().upper()
        # Vérifie si la ligne marque le début d'une section cible
        is_target = any(kw.upper() in line_upper for kw in section_keywords)
        # Vérifie si c'est un nouveau titre de section (pas cible)
        is_new_section = bool(re.match(r"^(TITRE|CHAPITRE|ANNEXE|SECTION|TITLE|CHAPTER|ANNEX)\s+[IVXLC\d]", line_upper))

        if is_target:
            if current_section_lines:
                result_parts.append("\n".join(current_section_lines))
            current_section_lines = [line]
            in_section = True
        elif is_new_section and in_section and not is_target:
            # Fin de la section cible, on sauvegarde
            if current_section_lines:
                result_parts.append("\n".join(current_section_lines))
            current_section_lines = []
            in_section = False
        elif in_section:
            current_section_lines.append(line)

    if current_section_lines:
        result_parts.append("\n".join(current_section_lines))

    extracted = "\n\n".join(result_parts)
    # Si rien n'est trouvé (mauvais mots-clés), on retourne le texte complet
    return extracted if len(extracted) > 500 else text


def extract_text_from_pdf(filepath: str, sections: list = None) -> list[tuple[int, str]]:
    """Extrait le texte d'un PDF page par page.

    Retourne une liste de tuples (page_number, text) — page_number est 1-indexé.
    Si sections est fourni, filtre les sections pertinentes tout en conservant
    l'information de page.
    """
    doc = fitz.open(filepath)
    pages = []
    for page_num, page in enumerate(doc, start=1):
        text = clean_text(page.get_text())
        if text:
            pages.append((page_num, text))
    doc.close()

    if not sections:
        return pages

    # Reconstruction du texte complet pour la détection de sections,
    # puis réattribution des pages
    full_text = "\n\n".join(t for _, t in pages)
    filtered_text = extract_sections_from_text(full_text, sections)

    # On ré-attribue les pages : chaque page est incluse si son texte
    # apparaît dans le texte filtré
    filtered_pages = []
    for page_num, text in pages:
        # Vérification par chevauchement partiel (50 premiers caractères)
        sample = text[:80].strip()
        if sample and sample in filtered_text:
            filtered_pages.append((page_num, text))

    return filtered_pages if filtered_pages else pages


def extract_text_from_html(url: str) -> str:
    """Extrait le texte principal d'une page HTML Légifrance."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; LexSanté/1.0)"}
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        # Supprime scripts, styles, nav
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        # Cible le contenu principal
        main = (
            soup.find("div", class_="content-page")
            or soup.find("article")
            or soup.find("main")
            or soup.find("body")
        )
        text = main.get_text(separator="\n") if main else soup.get_text(separator="\n")
        return clean_text(text)
    except Exception as e:
        print(f"  ✗ Erreur extraction HTML : {e}")
        return ""


def chunk_text(pages: list[tuple[int, str]], doc_id: str, doc_label: str,
               doc_theme: str, doc_url: str, lang_code: str = "fr") -> list:
    """Découpe le texte en chunks aux frontières de phrases, avec numéro de page.

    Chaque chunk commence et se termine sur une phrase complète.
    L'overlap est réalisé en reprenant les dernières phrases du chunk précédent.
    Le numéro de page correspond à la page où commence le chunk.
    """
    MAX_CHARS = CHUNK_SIZE * 4    # ~3 200 caractères ≈ 800 tokens
    OVERLAP_CHARS = CHUNK_OVERLAP * 4  # ~600 caractères de recouvrement

    # ── 1. Tokenisation en phrases par page ──────────────────────────
    # Chaque élément : (page_num, sentence_text)
    page_sentences: list[tuple[int, str]] = []
    for page_num, text in pages:
        sents = sent_tokenize(text)
        for sent in sents:
            sent = sent.strip()
            # Recolle les césures de fin de ligne typiques des PDFs
            sent = re.sub(r"-\n\s*", "", sent)
            sent = re.sub(r"\s+", " ", sent)
            if len(sent) > 20:  # ignore les artefacts très courts
                page_sentences.append((page_num, sent))

    if not page_sentences:
        return []

    # ── 2. Regroupement en chunks ─────────────────────────────────────
    raw_chunks: list[tuple[int, list[str]]] = []  # (page_start, [sentences])
    current_sents: list[str] = []
    current_page: int = page_sentences[0][0]
    current_len: int = 0

    for page_num, sent in page_sentences:
        sent_len = len(sent) + 1  # +1 pour l'espace de jointure

        if current_len + sent_len > MAX_CHARS and current_sents:
            # Sauvegarde le chunk courant
            raw_chunks.append((current_page, current_sents.copy()))

            # Overlap : reprend les dernières phrases jusqu'à OVERLAP_CHARS
            overlap_sents: list[str] = []
            overlap_len = 0
            for s in reversed(current_sents):
                if overlap_len + len(s) + 1 <= OVERLAP_CHARS:
                    overlap_sents.insert(0, s)
                    overlap_len += len(s) + 1
                else:
                    break
            current_sents = overlap_sents
            current_len = overlap_len
            # La page du nouveau chunk = page de la première phrase reprise
            # (ou page courante si pas d'overlap)
            current_page = page_num

        if not current_sents:
            current_page = page_num
        current_sents.append(sent)
        current_len += sent_len

    if current_sents:
        raw_chunks.append((current_page, current_sents))

    # ── 3. Construction des objets chunk ─────────────────────────────
    result = []
    chunk_idx = 0
    for page_start, sents in raw_chunks:
        text_chunk = " ".join(sents).strip()
        if len(text_chunk) < 100:
            continue
        result.append({
            "id": f"{doc_id}_{chunk_idx:04d}",
            "doc_id": doc_id,
            "doc_label": doc_label,
            "theme": doc_theme,
            "source_url": doc_url,
            "chunk_index": chunk_idx,
            "total_chunks": 0,   # mis à jour après
            "page_start": page_start,
            "lang": lang_code,
            "text": text_chunk,
        })
        chunk_idx += 1

    # Mise à jour de total_chunks
    total = len(result)
    for chunk in result:
        chunk["total_chunks"] = total

    return result


# ─────────────────────────────────────────────
# PIPELINE PRINCIPAL
# ─────────────────────────────────────────────

def main():
    print("\n🏥 HealthLex — Preprocessing du corpus")
    print("=" * 50)

    all_chunks = []

    for doc in tqdm(CORPUS, desc="Documents traités"):
        print(f"\n📄 {doc['label']}")

        # 1. Téléchargement / extraction
        pages: list[tuple[int, str]] = []

        if doc["type"] == "pdf":
            filename = f"{doc['id']}.pdf"
            filepath = os.path.join(RAW_DIR, filename)
            success = download_file(doc["url"], filepath)
            if not success:
                print(f"  ⚠ Document ignoré (téléchargement échoué)")
                continue
            time.sleep(1)
            print(f"  → Extraction du texte par page...")
            if os.path.getsize(filepath) == 0:
                print(f"  ✗ Fichier vide, ignoré : {os.path.basename(filepath)}")
                os.remove(filepath)
                continue
            pages = extract_text_from_pdf(filepath, doc.get("sections"))

        elif doc["type"] == "html":
            print(f"  → Extraction depuis {doc['url']}")
            html_text = extract_text_from_html(doc["url"])
            if html_text:
                pages = [(1, html_text)]  # HTML = page unique

        if not pages:
            print(f"  ⚠ Aucun texte extrait, document ignoré")
            continue

        total_chars = sum(len(t) for _, t in pages)

        # 2. Chunking aux frontières de phrases
        print(f"  → Découpage en chunks (sentence-aware)...")
        chunks = chunk_text(
            pages=pages,
            doc_id=doc["id"],
            doc_label=doc["label"],
            doc_theme=doc["theme"],
            doc_url=doc["url"],
            lang_code=doc.get("lang", "fr"),
        )
        print(f"  ✓ {len(chunks)} chunks générés ({total_chars:,} caractères, {len(pages)} pages)")
        all_chunks.extend(chunks)

    # 3. Sauvegarde en JSONL
    print(f"\n💾 Sauvegarde du corpus...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"\n✅ Preprocessing terminé !")
    print(f"   {len(all_chunks)} chunks générés au total")
    print(f"   Fichier : corpus/chunks/corpus.jsonl")
    print(f"\nProchaine étape : python scripts/02_ingest.py")


if __name__ == "__main__":
    main()
