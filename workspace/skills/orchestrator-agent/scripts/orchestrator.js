// Goals:
// Need to find a way to parse the intent of the query. (Use Agents library but for node.js) (DONE)
// Need to keep track of the userId for the case of MLS search and mixed. This means the API server has to be running. (DONE)
// Need to find a way to call and run python functions. Or we can simply convert the ones in typescript into python if all else fails. (DONE)
// Figure a output template for all agents.
import { parsePropertyQuery } from "../../nlp-parser/scripts/nlp_parser.js";
import { getSession } from "../../mls-search/scripts/mls_session.js";
import { spawn } from 'child_process';
import { search } from "../../mls-search/scripts/active_listing_search.js";
// import { closeConnection } from "../../mls-search/scripts/mysql_conn.js";
export async function classifyIntent(query) {
    // Use Ollama agent to read the query and classify it as one of the intent.
    return new Promise((res, rej) => {
        const process = spawn('python', ['workspace/skills/orchestrator-agent/scripts/intent_query.py', query]);
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
// This will need to reworked, so that we just take in and read a JSON file. We update and record the session id.
// Also account for Missing Fields case.
export async function propertySearchAgent(query, userId) {
    const parsedFilters = await parsePropertyQuery(query);
    const searchResults = await search(userId, parsedFilters);
    // if (searchResults.status == "NEED_INFO") {
    //     return searchResults.prompt;
    // }
    // const res = await fetch("http://localhost:3000/api/search", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({ userId: userId, incomingFilters: parsedFilters })
    // });
    // const results = await res.json();
    // console.log(results);
    console.log(searchResults);
    return searchResults;
}
export async function marketStatsAgent(query) {
    const parsedFilters = await parsePropertyQuery(query);
    if (!parsedFilters.city) {
        return { response: "City was not provided in the query. Please enter a city name." };
    }
    const city = parsedFilters.city;
    // console.log(city);
    return new Promise((res, rej) => {
        const process = spawn('python', ['workspace/skills/market-analytics/scripts/market_analytics.py', city]);
        let result = '';
        process.stdout.on('data', function (data) {
            result += data.toString(); // Potential problem. We may need to turn it into JSON or some other readable format if needed.
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
    // console.log(query);
    return new Promise((res, rej) => {
        const process = spawn('python', ['workspace/skills/real-estate-recommendations/scripts/recommendation_engine.py', query]);
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
        const process = spawn('python', ['workspace/skills/real-estate-rag-agent/scripts/rag_agent.py', query]);
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
    // console.log({listings: listing, stats: stats});
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
// export async function orchestrate(query: string, userId: string, intent: string) {
export async function orchestrate(query, userId) {
    // const intent: any = "test";
    const intent = await classifyIntent(query);
    // console.log(`Current intent: ${intent}`);
    // intent: "search" | "market" | "recommend" | "knowledge" | "mixed"
    // Please note we will need to add the email Draft agent on Week 11.
    // First classify intent using Ollama agent. 
    // Then start up the server and check it's if running.
    switch (intent) {
        case "search":
            // console.log(`Search intent: ${intent}`);
            return await propertySearchAgent(query, userId);
        case "market":
            return await marketStatsAgent(query);
        case "recommend": //Probably will be the last one to deal with
            //Get session to get userId.
            //Grab the lastResults to make the recommendation and call Python to get the recommendation results.
            const session = getSession(userId);
            // console.log(`First Session Results: ${session.conversationStep}`);
            //
            if (session.lastResults) {
                const convertedListing = convertListingQuery(session.lastResults?.[0]);
                return await recommendationAgent(convertedListing);
            }
            else {
                return "Unable to find any previous results. Please perform a search first.";
            }
        // const convertedListing = convertListingQuery(session.lastResults?.[0] as ListingRow)
        // const convertedListing = convertListingQuery(dummyFirstLastResults as ListingRow)
        // console.log(convertListingQuery(dummyFirstLastResults as ListingRow))
        // return;
        // return await recommendationAgent(convertedListing);
        // return await recommendationAgent(session.lastResults?.[0]);
        case "knowledge":
            return await ragAgent(query);
        case "mixed": {
            const [listings, stats] = await Promise.all([
                propertySearchAgent(query, userId),
                marketStatsAgent(query)
            ]);
            // if(listings.status)
            // console.log(`Listing: ${JSON.stringify(listings.data)}`);
            // console.log(`Stats: ${stats}`);
            const combined = formatCombinedResponse(JSON.stringify(listings.data), stats);
            console.log(combined);
            return combined;
        }
        default:
            console.log("I'm not sure how to help with that. Try asking about properties or market trends.");
            // return "I'm not sure how to help with that. Try asking about properties or market trends.";
            return { response: "I'm not sure how to help with that. Try asking about properties or market trends." };
    }
}
// search test
// orchestrate("Find homes in Irvine.", "+43366704333");
// orchestrate("Under $1.5M.", "+43366704333");
// orchestrate("Condo with at least 3 beds", "+43366704333");
// market test
// orchestrate("Is it a good time to buy in San Diego?", "+43366704333");
// rag test
// orchestrate("What does DOM mean?", "+43366704333");
// Recommendation test
// orchestrate("Recommendate me some homes.", "+43366704333");
// mixed test
// orchestrate("Show me 3-bedroom condos in Irvine under $1.5M  and tell me if it's a good time to buy there.", "+23366704334");
// default test
orchestrate("Tell me a story about your life.", "+43366704333");
