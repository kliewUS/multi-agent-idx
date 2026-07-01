---
name: nlp-parser
description: This skill parse free-text real estate queries into structured filter objects that can be used to query the rets_property dataset in the local mySQL database.
tools: execute, read
---

# Run and Fomrat NLP Parser Output

## Objectives
Execute the NLP parser script and format the resulting data for the user.

## Step 1: Execution Order
You must run these following commands in order. Wait for the first command before executing the second command.

1. `tsc scripts/nlp_parser.ts`
2. `node scripts/nlp_parser.js`

## Step 2: Output Parsing & Formatting
Monitor the terminal output from the second command. Locate any resolved **Promise objects** or JSON-like object outputs. For each object found, intercept it and format it exactly as follows:

1. Original Query: [Insert query string that trigger the promise]
2. Data breakdown:
    - [Key 1]: [Value 1]
    - [Key 2]: [Value 2]
    - and so on...
3. If there's a null value in the output, omit it from the output print-out.
4. Separator: Print a horizontal rule (`---`) after each object.

### Example of Desired Output:
**Original Query:** "Show me 3-bedroom condos in Irvine under $1.5M with a pool."
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