// NOTE: For testing purposes, this is not needed.
import { searchActiveListings } from "./active_listing_search.js";
import { getSoldComps } from "./sold_comp.js";
import { parsePropertyQuery } from "../../week-2/scripts/nlp_parser.js";
import * as readline from 'node:readline/promises';
import { closeConnection } from "./mysql_conn.js";
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
            let pageNum = await rl.question("Specfic a page number: \n");
            let limit = await rl.question("Specfic a limit: \n");
            if (!await isPositiveNumber(pageNum) && !await isPositiveNumber(limit)) {
                results = await searchActiveListings(filters);
            }
            else if (!await isPositiveNumber(limit)) {
                results = await searchActiveListings(filters, Number(pageNum));
            }
            else if (!await isPositiveNumber(pageNum)) {
                results = await searchActiveListings(filters, 1, Number(limit));
            }
            else {
                results = await searchActiveListings(filters, Number(pageNum), Number(limit));
            }
            if (results.length == 0) {
                console.log("No active listings found matching those filters.");
            }
            else {
                console.log(`\n Found ${results.length} Active Listings:\n`);
                console.table(results);
            }
        }
        else if (Number(options) == 2) {
            if (filters.city) {
                results = await getSoldComps(filters.city);
                if (results.length == 0) {
                    console.log("No sold listings found matching those filters.");
                }
                else {
                    console.log(`\n Found ${results.length} Sold Listings:\n`);
                    console.table(results);
                }
            }
            else {
                console.log("City was not specified in Sold Listing search. Returning no results.");
            }
        }
        else {
            console.log("Invalid Option");
        }
        await closeConnection();
        // For Week 4, we may need to rethink this. 
        // Since we will to make a conversation and let the agent ask follow-up questions, remembering preference in a session, and refine results iteratively.
        return results;
    }
    finally {
        rl.close();
    }
}
export async function isPositiveNumber(input) {
    return typeof input === 'number' && !isNaN(input) && input > 0;
}
main();
