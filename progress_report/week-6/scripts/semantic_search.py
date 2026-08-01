import sys
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("google/embeddinggemma-300m")
chroma_client = chromadb.PersistentClient(path="../../chroma_db")

try:
    collection = chroma_client.get_collection(name="property_listings")
except chromadb.errors.NotFoundError:
    print("property_listings does not exist!")
    sys.exit(1)

def find_similar_listings(query: str, top_k: int = 5) -> list[str]:
    if not query:
        print("No query specified.")
        return []
        
    formatted_query = f"task: search result | query: {query}"

    query_vector = model.encode([formatted_query], batch_size=64, show_progress_bar=True).tolist()

    results = collection.query(query_embeddings=query_vector, n_results=top_k)

    top_ids = results["ids"][0]
    documents = results["documents"][0]
    # metadatas = results["metadatas"][0]
    distances = results["distances"][0]
    matched_listings = []

    # for listing_id, doc, meta, dist in zip(top_ids, documents, metadatas, distances):
    for listing_id, doc, dist in zip(top_ids, documents, distances):
        similarity = 1 - dist
        matched_listings.append(
            {
                "listing_id": listing_id,
                "similarity_score": round(float(similarity), 4),
                "document_text": doc,
                # "metadata": meta,
            }
        )

    return matched_listings

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        top_k = int(sys.argv[2]) if len(sys.argv) == 3 else 5
        top_listings = find_similar_listings(query, top_k)
        for listing in top_listings:
            print(f"Listing ID: {listing['listing_id']} | Similarity: {listing['similarity_score']}")
            print(f"Details: {listing['document_text']}")
            # print(f"Metadata: {listing['metadata']}")
            print("-" * 50)
    else:
        print("Please provide a search query!")