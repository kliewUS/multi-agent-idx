---
name: semantic-search
description: Search local real estate property listings using semantic vector search with EmbeddingGemma and ChromaDB.
metadata:
  openclaw:
    requires:
      bins: ["~/.openclaw/openclaw_env/bin/python"]
tools: execute, read
---

# Real Estate Semantic Property Search

Use this skill when the user asks to find, search, or recommend real estate listings matching subjective criteria (e.g., "charming craftsman home", "affordable family house near park").

---

## Objectives

### Step 1: Execution

1. **Notify the User**: Briefly inform the user that you are executing a local semantic search across the real estate vector database.
2. **Execute Search**: Use the designated Python environment to execute `semantic_search.py`.
   - **User Query**: Pass the sanitized natural language query as the first argument (properly quoted).
   - **Top K**: Pass as the second argument (default to `5` if not specified by the user).

```bash
  ~/.openclaw/openclaw_env/bin/python ~/.openclaw/workspace/skills/semantic-search/scripts/semantic_search.py "[USER_QUERY]" [TOP_K]
```

---

## Step 2: Output Parsing & Formatting

When `semantic_search.py` returns matching listings, process the raw output as follows before replying to the user:

### 1. Clean the Data
- Remove embedding prefix artifacts (e.g., `title: Listing ... | text:`).
- Parse key attributes: Listing ID, City/Location, Beds, Baths, SqFt, Year Built, Price, and Similarity Score.

### 2. Output Format Strategy
Present the results using a structured layout. For each matched listing:

* **Header**: `### [City, CA] - $[Price] (Listing #[ID])`
* **Key Stats**: Format as a table or compact bullet point list (Beds, Baths, SqFt, Built Year, Match Score).
* **Summary Highlights**: Do not dump the entire `L_Remarks` block verbatim. Summarize the description into 2–3 key bullet points that directly address what the user was searching for (e.g., mountain views, acreage, custom design).

### Example Output Structure for the Agent:

### 🏔️ Sugarloaf, CA — $849,900 (Listing #1144182993)
**Relevance Score**: 41.35% match

| Beds | Baths | Sq Ft | Built |
| :---: | :---: | :---: | :---: | 
| 4 | 3.0 | 2,300 | 1980 |

**Key Highlights:**
- **Location & Privacy**: Tucked in a private canyon, backing directly to National Forest and Conservation Land with direct trail access.
- **Architectural Character**: Designed by an artist-architect featuring custom tile work, hand-painted murals, and custom windows with panoramic canyon views.
- **Amenities**: Two primary suites (one main-level), skylights, dual fireplaces (wood-burning & gas), Jacuzzi tub, live-edge wood bar, and an expansive main deck.

---
## Edge Cases & Error Handling
* **No Matches / Empty Output**: If no listings are returned, inform the user that no matching properties were found and suggest broadening their search terms.
* **Low Match Scores (< 25%)**: Inform the user that the matches returned have low overall confidence scores relative to their query.
* **Script Error**: If the execution fails due to a database or environment error, report the error message briefly to the user instead of displaying empty results.
