---
name: nlp-parser
description: This skill parse free-text real estate queries into structured filter objects that can be used to query the rets_property dataset in the local mySQL database.
tools: execute, read
---

# NLP Parser

## Objectives
Execute the NLP parser script on a user's natural language query, intercept its JSON output, and format the resulting metadata cleanly for the user.

## Step 1: Execution Order
When a user provides a natural language search query, pass it as a literal string argument to the script. 

**Command:**
`node scripts/nlp_parser.js '[QUERY STRING]'`

## Step 2: Output Parsing & Formatting
Monitor the terminal output. Locate any resolved **Promise objects** or JSON-like object outputs. For each object found, intercept it and format it exactly as follows:

1. Print the exact query string that triggered the script.
2. List every non-null key-value pair as a bullet point.
3. If a key has a value of `null`, omit it from the final print-out entirely.
4. Print a horizontal rule (`---`) immediately following the data breakdown.

### Example of Desired Output:
**Original Query:** "3+ bed 2.5+ bath condos in Santa Barbara under $1.5M with at least 1800 sqft, a pool, nice view, and HOA under 500"
- city: 'Santa Barbara'
- maxPrice: 1500000
- beds: 3
- baths: 2.5
- sqft: 1800
- type: 'Condominium'
- pool: 'True'
- hasView: 'True'
- maxhoaPrice: 500
---