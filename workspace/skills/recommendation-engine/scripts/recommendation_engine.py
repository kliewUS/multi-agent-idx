from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine
import numpy as np
import pandas as pd
import mysql.connector
import chromadb
import sys

engine = create_engine(
    "mysql+mysqlconnector://root:@localhost/idx_exchange"
)

model = SentenceTransformer("google/embeddinggemma-300m")
chroma_client = chromadb.PersistentClient(path="./chroma_db")

try:
    collection = chroma_client.get_collection(name="property_listings")
except chromadb.errors.NotFoundError:
    print("property_listings does not exist!")
    sys.exit(1)

def calculate_similarity_score(target: dict, candidate: dict, sem_sim: float) -> float:
    score = 0.0
    # Structured similarity (60% of total score)
    target_price = target.get("L_SystemPrice")
    cand_price = candidate.get("L_SystemPrice")

    # print("-" * 50)

    # print(f"Candidate Price: {cand_price}")

    price_diff = abs(target_price - cand_price)

    if price_diff < 50_000: score += 20
    elif price_diff < 150_000: score += 12
    elif price_diff < 300_000: score += 5

    # print(f"Score after Price: {score}")

    target_beds = target.get("L_Keyword2")
    cand_beds = candidate.get("L_Keyword2")

    # print(f"Candidate Beds: {cand_beds}")

    if target_beds != 0 and target_beds == cand_beds:
        score += 15

    # print(f"Score after Beds: {score}")

    target_city = target.get("L_City")
    cand_city = candidate.get("L_City")

    # print(f"Candidate City: {cand_city}")

    if cand_city != "" and target_city.lower() == cand_city.lower():
        score += 15

    # print(f"Score after City: {score}")

    target_sqft = target.get("LM_Int2_3")
    cand_sqft = candidate.get("LM_Int2_3")

    # print(f"Candidate Sq Ft: {cand_sqft}")

    sqft_diff = abs(target_sqft - cand_sqft)

    if sqft_diff < 300: score += 10
    elif sqft_diff < 700: score += 5

    # print(f"Score after Sq Ft: {score}")

    target_id = target.get("L_ListingID")
    cand_id = candidate.get("L_ListingID")

    if target_id == cand_id:
        # print("Ids matches. Applying self-match penalty!")
        score *= 0.7
    
    # Semantic similarity (40% of total score)
    score += max(0, sem_sim) * 40

    return round(score, 2)

# Once we get the recommendations: For each recommendated listing, check the city, sqft between 0.8 and 1.2 of the recommendations' living area, and price to see if is supported by 
# california_sold pricing data.
# Check if recommended price is supported by recent comps
def validate_with_comps(city: str, sqft: int, price: int) -> dict:
    if not city or sqft <= 0:
        return {
            "comp_price": 0,
            "list_price": price,
            "comp_count": 0,
            "delta_pct": 0.0,
        }

    sql = """
        SELECT
        AVG(ClosePrice / NULLIF(LivingArea,0)) AS avg_ppsf,
        COUNT(*) AS comp_count
        FROM california_sold
        WHERE City = %s AND PropertyType = 'Residential'
        AND LivingArea BETWEEN %s AND %s
        AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    """

    result = pd.read_sql(sql, engine, params=(city, sqft * 0.8, sqft * 1.2))
    avg_ppsf = result["avg_ppsf"].iloc[0] if not pd.isna(result["avg_ppsf"].iloc[0]) else 0
    comp_count = int(result["comp_count"].iloc[0])
    comp_price = avg_ppsf * sqft
    delta_pct = round((price - comp_price) / comp_price * 100, 1) if comp_price > 0 else 0.0
    return {
        "comp_price": round(comp_price),
        "list_price": price,
        "comp_count": comp_count,
        "delta_pct": delta_pct
    }

def recommendation_engine(query: str, top_k: int = 5):
    # Take in input query, similar to week 6.
    # Call calculate_similarity_score. Embed target and candidate queries. If query doesn't include any structural similarity fields, just use semantic similarity like Week 6.
    # After that, validate active recommendations to see if matches up with california_sold data.
    if not query:
        print("No query specified.")
        return []

    formatted_query = f"task: search result | query: {query}"

    query_vector = model.encode([formatted_query]).tolist()

    results = collection.query(query_embeddings=query_vector, n_results=50)

    candidate_ids = results["ids"][0]
    distances = results["distances"][0]    
    sem_scores = {
        cid: max(0, 1 - dist) for cid, dist in zip(candidate_ids, distances)
    }

    if not candidate_ids:
        return []    

    ids_str = ", ".join([f"'{cid}'" for cid in sem_scores.keys()])
    sql_candidates = f"""
            SELECT L_ListingID, L_Type_, L_City, L_Keyword2, LM_Dec_3, LM_Int2_3, YearBuilt, L_SystemPrice, L_Remarks
            FROM rets_property
            WHERE L_ListingID IN ({ids_str});
        """
    df = pd.read_sql(sql_candidates, engine)

    df[df.select_dtypes(include=["float64"]).columns] = df.select_dtypes(include=["float64"]).fillna(0.0)
    df[df.select_dtypes(include=["str"]).columns] = df.select_dtypes(include=["str"]).fillna("")    
    
    candidates = df.to_dict("records")

    anchor_target = max(
        candidates,
        key=lambda c: sem_scores.get(str(c["L_ListingID"]), 0),
    )

    # print(anchor_target)

    scored_candidates = []
    for candidate in candidates:
        cid = str(candidate["L_ListingID"])
        sem_sim = sem_scores.get(cid, 0.0)

        hybrid_score = calculate_similarity_score(
            anchor_target, candidate, sem_sim
        )

        c_price = int(candidate["L_SystemPrice"])
        c_sqft = int(candidate["LM_Int2_3"])
        
        comps = validate_with_comps(
            city=candidate["L_City"], sqft=c_sqft, price=c_price
        )

        scored_candidates.append(
            {
                "listing_id": cid,
                "city": candidate["L_City"],
                "price": c_price,
                "beds": int(candidate["L_Keyword2"]),
                "sqft": c_sqft,
                "hybrid_score": hybrid_score,
                "semantic_score": round(sem_sim, 4),
                "comps_validation": comps,
            }
        )        

    scored_candidates.sort(key=lambda x: x["hybrid_score"], reverse=True)
    return scored_candidates[:top_k]

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        top_k = int(sys.argv[2]) if len(sys.argv) == 3 else 5
        rec_listings = recommendation_engine(query, top_k)
        
        print(f"Top {top_k} comp-validated recommendations")
        for idx, rec in enumerate(rec_listings, 1):
            comps = rec["comps_validation"]
            print(f"\n{idx}. Listing #{rec['listing_id']} in {rec['city']}")
            print(f"Hybrid Score: {rec['hybrid_score']}/100 (Semantic: {rec['semantic_score']})")
            print(f"Price: ${rec['price']:,} | Beds: {rec['beds']} | SqFt: {rec['sqft']}")
            print(f"Comps ({comps['comp_count']} sales): Avg Comp = ${comps['comp_price']:,} ({comps['delta_pct']:+}% vs list)")
    else:
        print("Please provide a search query!")