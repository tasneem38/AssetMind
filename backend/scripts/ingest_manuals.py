from pathlib import Path

import os
import sys
from unittest.mock import MagicMock
# Bypass Windows AppLocker blocking the grpc cygrpc.pyd extension
grpc_mock = MagicMock()
grpc_mock.__version__ = '1.60.0'
sys.modules['grpc'] = grpc_mock

import chromadb

from pypdf import PdfReader

from sentence_transformers import SentenceTransformer

from langchain_text_splitters import RecursiveCharacterTextSplitter


# ----------------------------
# CONFIG
# ----------------------------

import os
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_SCRIPT_DIR)

MANUALS_DIR = Path(os.path.join(_BACKEND_DIR, "manuals"))

CHROMA_DIR = os.path.join(_BACKEND_DIR, "chroma_db")

COLLECTION_NAME = "assetmind_manuals"


# ----------------------------
# CHROMADB
# ----------------------------

client = chromadb.PersistentClient(
    path=CHROMA_DIR
)

collection = client.get_or_create_collection(
    name=COLLECTION_NAME
)


# ----------------------------
# EMBEDDING MODEL
# ----------------------------

model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# ----------------------------
# CHUNKER
# ----------------------------

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100
)


# ----------------------------
# PROCESS PDF
# ----------------------------

def process_pdf(pdf_path):

    print(f"Processing: {pdf_path.name}")

    reader = PdfReader(pdf_path)

    for page_num, page in enumerate(reader.pages):

        text = page.extract_text()

        if not text:
            continue

        chunks = splitter.split_text(text)

        for idx, chunk in enumerate(chunks):

            chunk_id = (
                f"{pdf_path.stem}"
                f"_p{page_num+1}"
                f"_c{idx}"
            )

            embedding = model.encode(
                chunk
            ).tolist()

            collection.add(
                ids=[chunk_id],

                documents=[chunk],

                embeddings=[embedding],

                metadatas=[
                    {
                        "manual": pdf_path.stem,
                        "page": page_num + 1
                    }
                ]
            )

    print(
        f"Completed: {pdf_path.name}"
    )


# ----------------------------
# MAIN
# ----------------------------

def main():

    pdfs = list(
        MANUALS_DIR.glob("*.pdf")
    )

    print(
        f"Found {len(pdfs)} PDFs"
    )

    for pdf in pdfs:
        process_pdf(pdf)

    print(
        "Ingestion Complete"
    )


if __name__ == "__main__":
    main()