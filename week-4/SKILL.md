---
name: mls-search
description: Parses query into filters object using nlp-parser, sends an SQL query using these filters, and returns formatted property cards to the user.
metadata:
  openclaw:
    requires:
      bins: ["node", "curl"]
      env: ["MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE"]
tools: execute, read
---

# MLS Listing Search
You are a real estate search agent with access to two MySQL tables in the `idx_exchange` database detailed below. 

You will parse their intent, format the extracted criteria into a JSON arguments object, and execute the corresponding CLI script.

## Tables
### rets_property - Active Listings
Key columns:
  - L_ListingID (VARCHAR) - MLS system listing ID — joins to california_sold.ListingKey
  - L_DisplayId (VARCHAR) - Human-readable MLS number shown on portals
  - L_Address (VARCHAR) - Street Address
  - L_City (VARCHAR) - City (Indexed)
  - L_Zip (VARCHAR) - Postal Code (Indexed)
  - L_SystemPrice (INT) - Current listing price
  - L_Keyword2 (INT) - Bedrooms total
  - LM_Dec_3 (DECIMAL) - Bathrooms total (Half-baths supported e.g. 2.5)
  - LM_Int2_3 (INT) - Approximate finished square footage
  - L_Type_ (VARCHAR) - Subtype: SingleFamilyResidence, Condominium, etc. (Indexed)
  - L_Status (VARCHAR) - Listing status: Active, Pending, Withdrawn, etc.
  - LMD_MP_Latitude (DECIMAL) - Geo latitude - high Precision
  - LMD_MP_Longitude (DECIMAL) - Geo longitude - high precision
  - YearBuilt (INT) - Year property was constructed
  - AssociationFee (INT) - Monthly HOA fee in dollars
  - DaysOnMarket (INT) - Days on market at time of data pull
  - PoolPrivateYN (VARCHAR) - Private pool present (True/False)
  - ViewYN (VARCHAR) - Has a notable view (True/False)
  - FireplaceYN (VARCHAR) - Fireplace present (True/False)
  - PhotoCount (INT) - Number of listing photo available
  - LA1_UserFirstName (VARCHAR) - Listing Agent first name
  - LA1_UserLastName (VARCHAR) - Listing Agent last name
  - LO1_OrganizationName (VARCHAR) - Listing office / brokerage name

### california_sold - Sold Listings
Key columns:
  - ListingKey (BIGINT) - Unique listing identifier — joins to rets_property.L_ListingID
  - UnparsedAddress (VARCHAR) - Full Steet Address
  - City (VARCHAR) - City of the property
  - CloseDate (VARCHAR) - Date the transaction closed (YYYY-MM-DD format)
  - ClosePrice (DOUBLE) - Final sale/close price
  - OriginalListPrice (DOUBLE) - Original asking price when first listed
  - ListPrice (DOUBLE) - List price at time of contract
  - DaysOnMarket (BIGINT) - Days from listing to contract
  - BedroomsTotal (DOUBLE) - Number of bedrooms
  - BathroomsTotalInteger (DOUBLE) - Number of bathrooms
  - LivingArea (DOUBLE) - Finished living area in square feet
  - PropertyType (VARCHAR) - Residential, Land, ResidentialLease, CommercialSale, etc.
  - PropertySubType (VARCHAR) - SingleFamilyResidence, Condominium, Duplex, etc.
  - YearBuilt (DOUBLE) - Year property was built
  - ListAgentFullName (VARCHAR) - List agent full name
  - ListOfficeName (VARCHAR) - Listing brokerage name
  - BuyerOfficeName (VARCHAR) - Buyer brokerage name

---

## Objectives

### Step 1: Query Extraction & Execution
1. Call your internal NLP parser to isolate structured fields from the user's latest incoming message into a JSON filter object.
2. Check if the server is running using `curl -I http://localhost:3000`. If server is not running, start up the server using the following command: `node scripts\server.js`.
3. Formulate and execute the cURL command targeting the long-running Express server.

#### Express Endpoint Execution

* **Arguments:**
  * `USER_ID`: (Required) String containing the user's identifier (e.g., their WhatsApp ID or phone number) to track their `conversationStep` state machine.
  * `FILTER_JSON`: (Required) The extracted JSON filter keys from the NLP parser. Pass an empty object `{}` if no new criteria were found in the current turn.
  * `PAGE_NUMBER`: (Optional) Integer. Defaults to `1`.
  * `LIMIT`: (Optional) Integer. Defaults to `10`.

* **Command Syntax:**
  ```bash
  curl -s -X POST http://localhost:3000/api/search \
    -H "Content-Type: application/json" \
    -d '{"userId": "[USER_ID]", "incomingFilters": [FILTER_JSON], "pageNum": [PAGE_NUMBER], "limit": [LIMIT]}'

---

## Step 2: Output Parsing & Formatting

### Branch A: Response is "NEED_INFO"
If the server response contains `"status": "NEED_INFO"`, the state machine is missing required fields to perform a search.
  - Do not attempt to query or display listings.
  - Extract the value of the prompt key from the JSON response and return it directly to the user to fill the slot.

Example Server Response:
```json
{
  "status": "NEED_INFO",
  "missingField": "maxPrice",
  "prompt": "What is your maximum budget for this property?"
}
```

### Branch B: Response is "SUCCESS"

Parse the JSON array returned by the script execution and format every row using the exact templates below.

### Output Response Guidelines (For Branch B)
- Format all currency values using commas and dollar signs (e.g., `$1,000,000`).
- Reformat `YYYY-MM-DD` string dates into "Month Day, Year" format (e.g., `June 6, 2026`).
- If a variable is missing or null, omit that property line or metric entirely. Ensure there are no dangling pipe characters (`|`) or empty blank lines.
- Append a horizontal rule (`---`) immediately following every single property card.

### Template for Active Listing Search
Format exactly as follows:
  - [YearBuilt] [type]
  - $[Price] | For Sale | [PhotoCount] Photos
  - [L_Address], [L_City], CA [L_Zip]
  - [beds] Beds | [baths] Baths | [sqft] sq ft

### Example of Desired Output:

#### Active Listing Search:
  - 1978 Condominum
  - $735,000 | For Sale
  - 44 Fallbrook, Irving, CA 92604
  - 3 Beds | 2 Baths | 1084 sq ft

---

