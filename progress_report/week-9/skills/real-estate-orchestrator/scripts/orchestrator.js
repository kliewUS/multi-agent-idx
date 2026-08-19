// Goals:
// Figure a consistent output template for all agents. (DONE)
// Setup CLI interface for user and OpenClaw to connect to. 
// Setup and run smoke tests. 
// Test on OpenClaw.
import { parsePropertyQuery } from "../../nlp-parser/scripts/nlp_parser.js";
import { getSession } from "../../mls-search/scripts/mls_session.js";
import { spawn } from 'child_process';
import { search } from "../../mls-search/scripts/active_listing_search.js";
import { closeConnection } from "../../mls-search/scripts/mysql_conn.js";
export async function classifyIntent(query) {
    // Use Ollama agent to read the query and classify it as one of the intent.
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-9/skills/real-estate-orchestrator/scripts/intent_query.py', query]);
        let result = '';
        process.stdout.on('data', function (data) {
            result += data.toString();
            console.log(result);
        });
        process.on('close', (code) => {
            if (code === 0)
                res(result.trim());
            else
                rej(`Process exited with code ${code}`);
        });
    });
}
export async function propertySearchAgent(query, userId) {
    const parsedFilters = await parsePropertyQuery(query);
    const searchResults = await search(userId, parsedFilters);
    return searchResults;
}
export async function marketStatsAgent(query) {
    const parsedFilters = await parsePropertyQuery(query);
    if (!parsedFilters.city) {
        return { response: "City was not provided in the query. Please enter a city name." };
    }
    const city = parsedFilters.city;
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-9/skills/market-analytics/scripts/market_analytics.py', city]);
        let result = '';
        process.stdout.on('data', function (data) {
            result += data.toString();
            console.log(result);
        });
        process.stderr.on('data', (data) => {
            rej(data.toString());
        });
        process.on('close', (code) => {
            if (code === 0)
                res(result.trim());
            else
                rej(`Process exited with code ${code}`);
        });
    });
}
export async function recommendationAgent(query) {
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-9/skills/real-estate-recommendations/scripts/recommendation_engine.py', query]);
        let result = '';
        process.stdout.on('data', function (data) {
            result += data.toString();
            console.log(result);
        });
        process.on('close', (code) => {
            if (code === 0)
                res(result.trim());
            else
                rej(`Process exited with code ${code}`);
        });
    });
}
export async function ragAgent(query) {
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-9/skills/real-estate-rag-agent/scripts/rag_agent.py', query]);
        let result = '';
        process.stdout.on('data', function (data) {
            result += data.toString();
            console.log(result);
        });
        process.on('close', (code) => {
            if (code === 0)
                res(result.trim());
            else
                rej(`Process exited with code ${code}`);
        });
    });
}
// Find a better way to format this response.
export async function formatCombinedResponse(listing, stats) {
    return { response: { listings: listing, stats: stats } };
}
export function convertListingQuery(listing) {
    const features = [];
    if (listing.ViewYN === "1")
        features.push(" scenic view");
    if (listing.PoolPrivateYN === "1")
        features.push(" private pool");
    if (listing.FireplaceYN === "1")
        features.push(" fireplace");
    const featureText = features.length > 0 ? `Features: ${features.join(',')}.` : '';
    return [
        `Property listing #${listing.L_ListingID}:`,
        `${listing.beds} beds, ${listing.baths} baths, ${listing.sqft} sqft ${listing.type} in ${listing.L_City}, CA (${listing.L_Zip}).`,
        `Address: ${listing.L_Address}. Price: $${listing.price.toLocaleString()}. HOA Fee: $${listing.AssociationFee}/mo. Built in ${listing.YearBuilt}.`,
        `Status: ${listing.status} (${listing.DaysOnMarket} days on market).`,
        featureText,
        `Listing Agent: ${listing.LA1_UserFirstName} ${listing.LA1_UserLastName} (${listing.LO1_OrganizationName}).`
    ].filter(Boolean).join(' ');
}
export async function orchestrate(query, userId) {
    if (!userId || !query) {
        return { response: "No userId and/or query was provided! Please provide a userId and/or query!" };
    }
    const intent = await classifyIntent(query);
    switch (intent) {
        case "search":
            const search_res = await propertySearchAgent(query, userId);
            if (search_res.status == "NEED_INFO") {
                return { response: search_res.prompt };
            }
            else if (search_res.data === undefined || search_res.data.length == 0) {
                return { response: "No results were found! Please try another search query." };
            }
            else {
                return { response: JSON.stringify(search_res.data) };
            }
        case "market":
            const market_res = await marketStatsAgent(query);
            return { response: market_res };
        case "recommend":
            const session = getSession(userId);
            if (session.lastResults) {
                const convertedListing = convertListingQuery(session.lastResults?.[0]);
                const rec_res = await recommendationAgent(convertedListing);
                return { response: rec_res };
            }
            else {
                return { response: "Unable to find any previous results. Please perform a search first." };
            }
        case "knowledge":
            const rag_res = await ragAgent(query);
            return { response: rag_res };
        case "mixed": {
            const [listings, stats] = await Promise.all([
                propertySearchAgent(query, userId),
                marketStatsAgent(query)
            ]);
            let listing_res;
            if (listings.status == "NEED_INFO") {
                listing_res = listings.prompt;
            }
            else if (listings.data === undefined || listings.data.length == 0) {
                listing_res = "No results were found! Please try another search query.";
            }
            else {
                listing_res = JSON.stringify(listings.data);
            }
            const combined = formatCombinedResponse(listing_res, stats);
            return combined;
        }
        default:
            return { response: "I'm not sure how to help with that. Try asking about properties or market trends." };
    }
}
if (import.meta.main) {
    const userId = process.argv[2];
    const query = process.argv[3];
    // const limit = process.argv[4] ? Number(process.argv[4]) : 10;
    // const pageNum = process.argv[5] ? Number(process.argv[5]) : 1;
    if (userId && query) {
        const results = await orchestrate(query, userId);
        console.log(results);
    }
    else {
        const results = { response: "No userId and/or query was provided! Please provide a userId and/or query!" };
        console.log(results);
    }
    await closeConnection();
}
