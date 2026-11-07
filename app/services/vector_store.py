import math
import re
from typing import List, Dict, Any, Tuple

class SimpleVectorStore:
    """
    Lightweight, dependency-free in-memory vector store with Cosine Similarity search.
    Provides semantic/lexical matching for CVs and past proposal sections.
    Easily swapped with Supabase pgvector in production environments.
    """

    def __init__(self):
        self.documents: List[Dict[str, Any]] = []

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
        # Filter common stopwords
        stopwords = {
            "the", "and", "for", "with", "that", "this", "from", "are", "was",
            "were", "will", "have", "has", "had", "been", "which", "into", "their"
        }
        return [w for w in words if w not in stopwords]

    def _get_term_frequencies(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        if not tokens:
            return {}
        counts: Dict[str, int] = {}
        for t in tokens:
            counts[t] = counts.get(t, 0) + 1
        total = float(len(tokens))
        return {term: count / total for term, count in counts.items()}

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        if not vec1 or not vec2:
            return 0.0

        common_keys = set(vec1.keys()) & set(vec2.keys())
        dot_product = sum(vec1[k] * vec2[k] for k in common_keys)

        norm1 = math.sqrt(sum(v * v for v in vec1.values()))
        norm2 = math.sqrt(sum(v * v for v in vec2.values()))

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def add_document(self, doc_id: str, doc_type: str, text: str, metadata: Dict[str, Any]):
        vec = self._get_term_frequencies(text)
        self.documents.append({
            "id": doc_id,
            "type": doc_type,  # "CV" | "PAST_PROPOSAL"
            "text": text,
            "metadata": metadata,
            "vector": vec
        })

    def search(self, query: str, doc_type: str = None, top_k: int = 5) -> List[Tuple[Dict[str, Any], float]]:
        query_vec = self._get_term_frequencies(query)
        scored_results = []

        for doc in self.documents:
            if doc_type and doc["type"] != doc_type:
                continue

            sim = self._cosine_similarity(query_vec, doc["vector"])
            scored_results.append((doc, round(sim, 4)))

        # Sort descending by similarity
        scored_results.sort(key=lambda item: item[1], reverse=True)
        return scored_results[:top_k]

    def clear(self):
        self.documents = []

vector_store = SimpleVectorStore()
