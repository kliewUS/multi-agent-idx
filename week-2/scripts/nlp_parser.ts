export async function parsePropertyQuery(query: string) {
    const cityMatch = query.match(/in\s+([A-Za-z\s]+?)(?=\s+(?:below|under|with|at|max|min|above|over|\d)|$)/i);
    const priceMatch = query.match(/(?<!hoa\s)(?:under|below)\s+\$?([\d,.]+)(k|m)?/i);
    const bedsMatch = query.match(/(\d+)[\s\-+]*(bed|beds|bedroom|bedrooms|br)/i); 
    const bathsMatch = query.match(/(\d+(?:\.5)?)[\s\-+]*(bath|baths|bathroom|ba)/i); 
    const sqftMatch = query.match(/([\d,]+)[\s\-+]*(sqft|sq ft|square feet)/i); 
    const poolMatch = /pool/i.test(query);
    const viewMatch = /view/i.test(query);
    const hoaMatch = query.match(/hoa\s+(?:under|below|max)?\s*\$?([\d,.]+)(k)?/i);

    const typeMap: Record<string,string> = { //Add more types.
        condo: "Condominium", 
        condominium: "Condominium",
        townhome: "Townhouse",
        townhouse: "Townhouse",
        "single family": "SingleFamilyResidence", 
        land: "UnimprovedLand",
        duplex: "Duplex", 
        studio: "Studio", 
        loft: "Loft", 
        "mobile homes": "MobileHome",
        triplex: "Triplex", 
        "manufactured homes": "ManufacturedHome", 
        cabin: "Cabin",
        timeshare: "Timeshare"
    };

    let cleanedSqFt = null
    if (sqftMatch) {
        cleanedSqFt = sqftMatch[1].replaceAll(',','')
    }

    const typeKey = Object.keys(typeMap).find(k => {
        // Escapes the key and adds an optional 's' or 'es' for plurals
        // \b matches the start, (?:es|s)? handles plurals, \b matches the end
        const regex = new RegExp(`\\b${k}(?:es|s)?\\b`, 'i'); 
        return regex.test(query);
    });

    let maxhoaPrice = null;
    if (hoaMatch) {
        maxhoaPrice = Number(hoaMatch[1].replace(/,/g, ""));
        if (hoaMatch[2]?.toLowerCase() === "k") maxhoaPrice *= 1000;
    }


    let maxPrice = null;
    if (priceMatch) {
        maxPrice = Number(priceMatch[1].replace(/,/g, ""));
        if (priceMatch[2]?.toLowerCase() === "k") maxPrice *= 1000;
        if (priceMatch[2]?.toLowerCase() === "m") maxPrice *= 1_000_000;
    }
    return {
        city: cityMatch?.[1]?.trim() || null,
        maxPrice,
        beds: bedsMatch ? Number(bedsMatch[1]) : null,
        baths: bathsMatch ? Number(bathsMatch[1]) : null,
        // sqft: sqftMatch ? Number(sqftMatch[1]) : null,
        sqft: sqftMatch ? Number(cleanedSqFt) : null,
        type: typeKey ? typeMap[typeKey] : null,
        pool: poolMatch ? "True" : null,
        hasView: viewMatch ? "True" : null,
        maxhoaPrice
    };
}

// Move this to a test file.
// const testQueries = [
//     "Show me 3-bedroom condos in Irvine under $1.5M with a pool.",
//     "Find me a 4 bed condo in Pasadena under $1.2M with a pool and a view.",
//     "Condos for sale in San Jose below 900k with HOA under 400 a month",
//     "Looking for luxury condominiums in San Diego at least 2000 sq ft with ocean views",
//     "3 bedroom 2.5 bath condos in Sacramento under 750000",
//     "3 BR 3 BA townhome in Santa Monica under 1.5M with community pool",
//     "Under $1,300,000 pool and view 3br condo in Glendale",
//     "Big condominiums in Long Beach minimum 1800 square feet with a view",
//     "Show condos in Fresno with HOA max $350 and price under $500k",
//     "3+ bed 2.5+ bath condos in Santa Barbara under $1.5M with at least 1800 sqft, a pool, nice view, and HOA under 500",
//     "Find duplexes in Sacramento with at least 2 bedrooms, 2 bathrooms, and over 1,200 sq ft.",
//     "Show me studios in San Diego under 500 square feet with 1 bath.",
//     "Looking for a loft in Oakland with minimum 1 bed, 1.5 baths, and 1,100 sqft.",
//     "2 bedroom 1.5 bathroom mobile homes for sale in Fremont over 1000 sq ft",
//     "5 bed 4 bath single family homes in Fresno at least 3,200 square feet",
//     "Triplex in Long Beach min 6 br and 3 ba",
//     "Townhomes in San Jose with 5+ bedrooms and 4.5+ bathrooms",
//     "2 bed 1 bath cabins in Big Bear minimum 900 sqft",
//     "Manufactured homes in Bakersfield with 3 beds, 2 baths, and 1,500 sq ft",
//     "Timeshares in San Francisco with a minimum of 2 beds, 3.5 baths, and 2,500 sq ft",
// ]

// for (var query of testQueries) {

//     const parsedQuery = parsePropertyQuery(query);

//     console.log("Query: " + query);
//     console.log("Parsed Query: ")
//     console.log(parsedQuery);

//     const hyphenLine = "-".repeat(40);
//     console.log(hyphenLine);
// }