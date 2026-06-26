import chromadb

from sentence_transformers import SentenceTransformer


client = chromadb.PersistentClient(
    path="../chroma_db"
)

collection = client.get_collection(
    "assetmind_manuals"
)

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


query = "What causes cavitation?"

embedding = model.encode(
    query
).tolist()

results = collection.query(
    query_embeddings=[embedding],
    n_results=5
)

for doc, meta in zip(
    results["documents"][0],
    results["metadatas"][0]
):

    print("\n")
    print("=" * 50)

    print(
        meta["manual"],
        "Page",
        meta["page"]
    )

    print(doc[:500])