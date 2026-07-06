---
name: mls-listing-search
description: Parses query into filters object using nlp-parser, sends an SQL query using these filters, and returns formatted property cards to the user.
metadata:
  openclaw:
    requires:
      bins: ["node"]
      env: ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"]
tools: execute, read
---

# Run and Format the Property listing cards

## Objectives
Execute the MLS CLI script and format the resulting data into property listing cards to the user. You have access to two MySQL tables in the `idx_exchange` database.

## Step 1: Execution Order
You must run this following command.

`node scripts/mls_cli.js`

## Step 2: CLI
You will be prompted with the option to enter a query. Use the query provided as the input and send it to CLI.
Then you will be prompted with another option to choose either Active Listing Search and Sold Listing Search.
If asked to do an Active Listing Search, enter 1 and sent it to CLI. If asked to do an Sold Listing Search, enter 2 and sent it to CLI.

## Step 3: Output Parsing & Formatting
Monitor the terminal output. Locate a table result if provided. For every row in the table, intercept it and do the following:

1. If it was an active listing search, format it exactly as seen:
Active Property Card
  - [YearBuilt] [type]
  - $[Price] | For Sale
  - [L_Address], [L_City], CA [L_Zip]
  - [beds] Beds | [baths] Baths | [sqft] sq ft

OR

1. If it was a sold listing search, then instead format it exactly as seen:
Sold Property Card
  - [YearBuilt] [PropertySubType]
  - Sold on [ClosingDate] for $[ClosePrice] in [DaysOnMarket] days! 
  - $[ClosePrice - OriginalListPrice] over asking price!
  - [UnparsedAddress], [City], CA
  - [BedroomsTotal] Beds | [BathroomsTotalInteger] Baths | [Living Area] sq ft

2. If there's a null value in the output rows, omit it from the output print-out.
3. Separator: Print a horizontal rule (`---`) after each object.

### Example of Desired Output:
Active Listing Search:
  - 1978 Condominum
  - $735000 | For Sale
  - 44 Fallbrook, Irving, CA 92604
  - 3 Beds | 2 Baths | 1084 sq ft

Sold Listing Search:
  - 2005 Single Family Residence
  - Sold on June 6th, 2026 for $3,180,000 in 12 days! 
  - $218,000 over asking price!
  - 25 Twiggs, Irvine, CA
  - 4 Beds | 5 Baths | 4000 sq ft
---