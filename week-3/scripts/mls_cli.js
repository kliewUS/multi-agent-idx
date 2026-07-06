import { searchActiveListings } from "./active_listing_search.js";
import { getSoldComps } from "./sold_comp.js";
import { parsePropertyQuery } from "../../week-2/scripts/nlp_parser.js";
import * as readline from 'node:readline/promises';
export async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    try {
        let query = await rl.question("Enter a query: ");
        while (!query) {
            console.log("Please enter a query!");
            query = await rl.question("Enter a query: ");
        }
        const rawFilters = await parsePropertyQuery(query);
        const filters = {
            city: rawFilters.city ?? "",
            maxPrice: rawFilters.maxPrice ?? 0,
            beds: rawFilters.beds ?? 0,
            baths: rawFilters.baths ?? 0,
            sqft: rawFilters.sqft ?? 0,
            type: rawFilters.type ?? "",
            pool: rawFilters.pool ?? "",
            hasView: rawFilters.hasView ?? "",
            maxhoaPrice: rawFilters.maxhoaPrice ?? 0,
        };
        let options = await rl.question("Choose an option (1 - Active Listing Search, 2 - Sold Listings Search)\n");
        let results;
        if (Number(options) == 1) {
            results = await searchActiveListings(filters);
        }
        else if (Number(options) == 2) {
            if (filters.city) {
                results = await getSoldComps(filters.city);
            }
            else {
                console.log("City was not specified in Sold Listing search. Returning no results.");
            }
        }
        else {
            console.log("Invalid Option");
        }
        return results;
    }
    finally {
        rl.close();
    }
}
main();
