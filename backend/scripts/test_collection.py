import chromadb

client = chromadb.PersistentClient(
    path="../chroma_db"
)

collection = client.get_collection(
    "assetmind_manuals"
)

print(
    collection.count()
)