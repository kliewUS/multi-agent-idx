import chromadb
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine
import torch

if torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"

model = SentenceTransformer("google/embeddinggemma-300m", device=device)

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="property_listings", metadata={"hnsw:space": "cosine"}
)

engine = create_engine("mysql+mysqlconnector://root:@localhost/idx_exchange")

query = """
    SELECT L_ListingID, L_Type_, L_City, L_Keyword2, LM_Dec_3, LM_Int2_3, YearBuilt, L_SystemPrice, L_Remarks 
    FROM rets_property
    LIMIT 5000;
"""
df = pd.read_sql(query, engine)

def format_listing_text(row: dict) -> str:

    raw_text = f"""
        {row["L_Type_"]} in {row["L_City"]}, CA.
        {int(row["L_Keyword2"])} beds, {row["LM_Dec_3"]} baths.
        {int(row["LM_Int2_3"])} sq ft. Built {int(row["YearBuilt"])}.
        Price: ${row["L_SystemPrice"]:,}.
        {row["L_Remarks"]}
    """.strip()

    return f"title: Listing {row['L_ListingID']} | text: {raw_text}"


def ingest_listings():
    documents = []
    ids = []
    metadatas = []

    df[df.select_dtypes(include=["float64"]).columns] = df.select_dtypes(include=["float64"]).fillna(0.0)
    df[df.select_dtypes(include=["str"]).columns] = df.select_dtypes(include=["str"]).fillna("")

    for row in df.to_dict("records"):
        listing_id = str(row["L_ListingID"])
        formatted_text = format_listing_text(row)

        documents.append(formatted_text)
        ids.append(listing_id)
        metadata = {}

        if row["L_Type_"]:
            metadata["type"] = row["L_Type_"]
        if row["L_City"]:
            metadata["city"] = row["L_City"]
        if int(row["L_Keyword2"]) > 0:
            metadata["beds"] = int(row["L_Keyword2"])
        if float(row["LM_Dec_3"]) > 0:
            metadata["baths"] = float(row["LM_Dec_3"])
        if int(row["LM_Int2_3"]) > 0:
            metadata["sqft"] = int(row["LM_Int2_3"])
        if int(row["YearBuilt"]):
            metadata["yearbuilt"] = int(row["YearBuilt"])
        if row["L_Remarks"]:
            metadata["remarks"] = row["L_Remarks"]

        metadatas.append(metadata)

    # Compute local embeddings in batches
    embeddings = model.encode(documents, batch_size=64, show_progress_bar=True).tolist()

    # Upsert into ChromaDB
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )
    print(f"Successfully ingested {len(ids)} listings into ChromaDB.")

if __name__ == "__main__":
    ingest_listings()