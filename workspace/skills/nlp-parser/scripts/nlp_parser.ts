export async function parsePropertyQuery(query: string) {
    // const cityMatch = query.match(/in\s+([A-Za-z\s]+?)(?=\s+(?:below|under|with|at|max|min|above|over|\d)|$)/i);
    const cityMatch = query.match(/in\s+([A-Za-z\s]+?)(?=[.,!?]?(?:\s+(?:below|under|with|at|max|min|above|over|\d)|$))/i);
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
        sqft: sqftMatch ? Number(cleanedSqFt) : null,
        type: typeKey ? typeMap[typeKey] : null,
        pool: poolMatch ? "True" : null,
        hasView: viewMatch ? "True" : null,
        maxhoaPrice
    };
}

const query = process.argv[2];

if(query){
    const result = await parsePropertyQuery(query);

    console.log(JSON.stringify(result));
}