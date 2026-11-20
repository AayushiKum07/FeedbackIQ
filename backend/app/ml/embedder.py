"""Sentence embedding generation and vector operations."""

import pickle
from typing import List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize


class FeedbackEmbedder:
    """Generates dense semantic vector embeddings for customer feedback sentences."""

    def __init__(self, n_components: int = 128):
        self.n_components = n_components
        self.vectorizer = TfidfVectorizer(
            max_features=2500,
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
        )
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.is_fitted = False

    def fit_transform(self, texts: List[str]) -> np.ndarray:
        """Fit vectorizer and SVD on a corpus and return dense normalized embeddings."""
        if not texts:
            return np.zeros((0, self.n_components), dtype=np.float32)

        # Handle very small corpus
        effective_components = min(self.n_components, len(texts) - 1, 100)
        if effective_components < 2:
            effective_components = 2

        self.svd = TruncatedSVD(n_components=effective_components, random_state=42)

        tfidf = self.vectorizer.fit_transform(texts)
        if tfidf.shape[1] < effective_components:
            # Fewer terms than components
            effective_components = max(1, tfidf.shape[1] - 1)
            self.svd = TruncatedSVD(n_components=effective_components, random_state=42)

        reduced = self.svd.fit_transform(tfidf)
        normalized = normalize(reduced, norm="l2")
        self.is_fitted = True
        return normalized.astype(np.float32)

    def transform(self, texts: List[str]) -> np.ndarray:
        """Transform new texts using fitted embedder."""
        if not self.is_fitted:
            return self.fit_transform(texts)
        tfidf = self.vectorizer.transform(texts)
        reduced = self.svd.transform(tfidf)
        return normalize(reduced, norm="l2").astype(np.float32)


_global_embedder = FeedbackEmbedder()


def generate_embeddings(texts: List[str]) -> np.ndarray:
    """Generate dense normalized embeddings for a list of texts."""
    return _global_embedder.fit_transform(texts)


def serialize_vector(vector: np.ndarray) -> bytes:
    """Serialize a numpy float32 vector to bytes."""
    return vector.astype(np.float32).tobytes()


def deserialize_vector(data: bytes) -> np.ndarray:
    """Deserialize bytes back to a numpy float32 vector."""
    return np.frombuffer(data, dtype=np.float32)

