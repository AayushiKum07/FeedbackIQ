"""Clustering algorithms for grouping semantically similar customer feedback."""

from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.cluster import AgglomerativeClustering, KMeans
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity


def perform_clustering(
    embeddings: np.ndarray,
    n_clusters: int = None,
) -> Tuple[np.ndarray, float]:
    """
    Cluster embeddings using Agglomerative Clustering (cosine metric) or KMeans.
    Returns (labels, silhouette_score_val)
    """
    n_samples = len(embeddings)
    if n_samples < 2:
        return np.zeros(n_samples, dtype=int), 0.0

    if n_clusters is None:
        # Heuristic for number of clusters based on dataset size
        if n_samples <= 6:
            n_clusters = 2
        elif n_samples <= 15:
            n_clusters = 3
        elif n_samples <= 35:
            n_clusters = 4
        elif n_samples <= 70:
            n_clusters = 5
        else:
            n_clusters = min(8, max(3, n_samples // 12))

    n_clusters = min(n_clusters, n_samples - 1)
    if n_clusters < 2:
        n_clusters = 2

    # Try Agglomerative Clustering with cosine distance
    try:
        clusterer = AgglomerativeClustering(
            n_clusters=n_clusters,
            metric="cosine",
            linkage="average",
        )
        labels = clusterer.fit_predict(embeddings)
    except Exception:
        # Fallback to KMeans
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
        labels = kmeans.fit_predict(embeddings)

    # Compute silhouette score if more than 1 cluster and at least 3 samples
    score = 0.0
    unique_labels = set(labels)
    if len(unique_labels) > 1 and n_samples > len(unique_labels):
        try:
            score = float(silhouette_score(embeddings, labels, metric="cosine"))
        except Exception:
            score = 0.0

    return labels, score


def find_cluster_representatives(
    cluster_indices: List[int],
    embeddings: np.ndarray,
    texts: List[str],
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Find the most representative feedback items in a cluster by computing
    the cosine similarity between each item and the cluster centroid.
    """
    if not cluster_indices:
        return []

    cluster_embeddings = embeddings[cluster_indices]
    centroid = np.mean(cluster_embeddings, axis=0, keepdims=True)

    sims = cosine_similarity(cluster_embeddings, centroid).flatten()
    sorted_order = np.argsort(-sims)

    representatives = []
    for rank in sorted_order[:top_k]:
        idx = cluster_indices[rank]
        representatives.append({
            "index": idx,
            "text": texts[idx],
            "similarity_to_centroid": float(sims[rank]),
        })

    return representatives

