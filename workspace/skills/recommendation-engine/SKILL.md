---
name: recommendation-engine
description: Recommend local real estate property listings using a hybrid engine (60% structured + 40% semantic similarity) validated against recent California sales comps.
metadata:
  openclaw:
    requires:
      bins: ["python3"]
tools: execute, read
---

# Hybrid Real Estate Recommendation Engine

Use this skill when the user asks to search, recommend, or analyze real estate listings matching subjective or objective criteria (e.g., "charming craftsman home with mountain views under $800k", "4 bed house in Sugarloaf").

---

## Objectives

### Step 1: Execution

1. **Notify the User**: Briefly inform the user that you are executing a hybrid recommendation search and validating list prices against recent local sales comps.
2. **Execute Engine Script**: Call `recommendation_engine.py` using the workspace virtual environment.
   - **User Query**: Pass the natural language query as the first argument (properly quoted).
   - **Top K**: Pass as the second argument (default to `5` if omitted).

```bash
  ~/.openclaw/workspace/venv/bin/python ~/.openclaw/workspace/skills/real-estate-recommendations/scripts/recommendation_engine.py "[USER_QUERY]" [TOP_K]
```

---

## Step 2: Output Parsing & Formatting

When `recommendation_engine.py` finishes, process the raw JSON/stdout stream as follows before presenting recommendations to the user:

### 1. Extract Metrics
- Core Attributes: Listing ID, City, Price, Beds, SqFt, Remarks.
- Scoring Metrics: Hybrid Score (out of 100) and Semantic Score.
- Comps Validation: Estimated Comp Price, Recent Comp Count, and Price Delta % (+X% or -X% vs list price).

### 2. Output Format Strategy
Format each recommendation clearly with key listing details, property highlights, and market pricing validation.

### Example Agent Output Layout

### 🏔️ Sugarloaf, CA — $849,900 (Listing #1144182993)
**Hybrid Match Score**: 84.5/100 (Semantic: 0.4135)

| Beds | Sq Ft | List Price | Estimated Comp | Market Assessment
| :---: | :---: | :---: | :---: | :---: | 
| 4 | 2,300 | $849,000 | $812,000 | +4.7% vs Comps (3 sales)

**Key Highlights:**
- **Location & Privacy**: Tucked in a private canyon, backing directly to National Forest and Conservation Land with direct trail access.
- **Architectural Character**: Designed by an artist-architect featuring custom tile work, hand-painted murals, and custom windows with panoramic canyon views.
- **Amenities**: Two primary suites (one main-level), skylights, dual fireplaces (wood-burning & gas), Jacuzzi tub, live-edge wood bar, and an expansive main deck.

**Market Valuation Check**:
- Based on 3 recent sales in Sugarloaf within (+/-) 20% living area over the last 6 months, the estimated market value is $812,000.
- The list price is slightly above market average (+4.7%).

---
## Edge Cases & Error Handling
- **No Matches / Empty Output**: Inform the user that no listings were found in the database matching their criteria and suggest broadening their query.
- **Zero Sales Comps**: If comp_count is 0, state: "Insufficient recent sales data in california_sold to estimate market value for this property size/location."
- **Low Match Scores**: (< 40/100 Hybrid Score): Include a minor disclaimer that the listings returned have lower overall alignment with the search criteria.
- **Script Failure**: If execution fails due to a database connection or missing virtual environment, report a concise error message rather than displaying empty markdown tables.
