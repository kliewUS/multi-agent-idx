// Goals for Week 10:
// Output: {response: "Message", listings?: [{id_key: "1234", ...}], stats?: [{month: "3", ...}] }
// Adjust outputs for Property Search, so that it gives a JSON object to interface. (DONE)
// Adjust outputs for Market Analytics, so that it also gives a JSON object to interface. (DONE)
// Adjust outputs for Mixed Search, so that it's more consistent with interface layout. (DONE)
// Test all cases again on CLI (DONE), OpenClaw and WhatsApp.

// Goals for Week 11 and 12:
// Connect email to nodemailer. 
// Add email case in orchestartor.
// Test it out on CLI, OpenClaw, and WhatsApp.

import { parsePropertyQuery } from "../../nlp-parser/scripts/nlp_parser.js";
import { getSession } from "../../mls-search/scripts/mls_session.js";
import { spawn } from 'child_process';
import { ListingRow, search } from "../../mls-search/scripts/active_listing_search.js";
import { closeConnection } from "../../mls-search/scripts/mysql_conn.js";

export interface AgentResult {
    response: string;
    listings?: any;
    stats?: any;
}

export async function classifyIntent(query: string) {
    // Use Ollama agent to read the query and classify it as one of the intent.
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-10/skills/real-estate-orchestrator/scripts/intent_query.py', query]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/real-estate-orchestrator/scripts/intent_query.py', query]);

        let result = ''
        process.stdout.on('data', function(data) {
            result += data.toString();
            console.log(result);
        });

        process.on('close', (code) => {
            if (code === 0) res(result.trim());
            else rej(`Process exited with code ${code}`);
        });                
    });
}

export async function propertySearchAgent(query: string, userId: string) {
    const parsedFilters = await parsePropertyQuery(query);

    const searchResults = await search(userId, parsedFilters);

    return searchResults;    
}

export async function marketStatsAgent(query: string) { //Figure out a way to convert the result of market_analytics from DF to JSON object.
    const parsedFilters = await parsePropertyQuery(query);

    if (!parsedFilters.city){
        return "City was not provided in the query. Please enter a city name.";
    }

    const city = parsedFilters.city;
    
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-10/skills/market-analytics/scripts/market_analytics.py', city]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/market-analytics/scripts/market_analytics.py', city]);

        let result = ''
        process.stdout.on('data', function(data) {
            result += data.toString();
            console.log(result);
        });

        process.stderr.on('data', (data) => {
            rej(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) res(result.trim());
            else rej(`Process exited with code ${code}`);
        });                
    });
}

export async function recommendationAgent(query: string) { //Find a way to clean up the output "+" and "\n"
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-10/skills/real-estate-recommendations/scripts/recommendation_engine.py', query]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/real-estate-recommendations/scripts/recommendation_engine.py', query]);

        let result = ''
        process.stdout.on('data', function(data) {
            result += data.toString();
            console.log(result);
        });

        process.on('close', (code) => {
            if (code === 0) res(result.trim());
            else rej(`Process exited with code ${code}`);
        });                
    });
}

export async function ragAgent(query: string) {
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-10/skills/real-estate-rag-agent/scripts/rag_agent.py', query]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/real-estate-rag-agent/scripts/rag_agent.py', query]);

        let result = ''
        process.stdout.on('data', function(data) {
            result += data.toString();
            console.log(result);
        });

        process.on('close', (code) => {
            if (code === 0) res(result.trim());
            else rej(`Process exited with code ${code}`);
        });                
    });
}

// Find a better way to format this response. Also don't stringify JSON for the interface.
export async function formatCombinedResponse(listing: any, stats: any) {
    const res: AgentResult = { response: "" };

    if (typeof listing == "string" 
        && (typeof stats == "string" 
        && (stats == "No market analytics results were found. Please try another city search query." 
        || stats == "City was not provided in the query. Please enter a city name."))){

        res.response = "No results were found on both property search and market analytics. Please try another search query.";
    } else if (typeof listing == "string") {
        res.response = listing;
        res.stats = JSON.parse(stats as string);
    } else if (typeof stats == "string" 
        && (stats == "No market analytics results were found. Please try another city search query." 
        || stats == "City was not provided in the query. Please enter a city name.")) {

        res.response = stats;
        res.listings = listing;
    } else {
        res.response = "Success";
        res.listings = listing;
        res.stats = JSON.parse(stats as string);
    }

    return res;
}

export function convertListingQuery(listing: ListingRow) {
  const features = [];
  if (listing.ViewYN === "1") features.push(" scenic view");
  if (listing.PoolPrivateYN === "1") features.push(" private pool");
  if (listing.FireplaceYN === "1") features.push(" fireplace");

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

export async function orchestrate(query: string, userId: string)  {
// export async function orchestrate(query: string, userId: string): AgentResult  {
     if(!userId || !query){
        return { response: "No userId and/or query was provided! Please provide a userId and/or query!" };
     }

    const intent = await classifyIntent(query);

    switch (intent) {
        case "search":
            const search_res = await propertySearchAgent(query, userId);

            if (search_res.status == "NEED_INFO") {
                return { response: search_res.prompt };
            } else if (search_res.data === undefined || search_res.data.length == 0) {
                return { response: "No property search results were found! Please try another search query." };
            } else {
                // return { response: JSON.stringify(search_res.data) }; //Change this, so we always have a response field and listing goest in separate kv pair.
                return { response: "Success", listings: search_res.data }; //Change this, so we always have a response field and listing goest in separate kv pair.
            }

        case "market":
            const market_res = await marketStatsAgent(query);

            if (typeof market_res 
                && (market_res == "No market analytics results were found. Please try another city search query." 
                || market_res == "City was not provided in the query. Please enter a city name.")){

                return { response: market_res };
            }

            // return { response: market_res }; //Change this, so that stats goes in separa kv pair.
            return { response: "Success", stats: JSON.parse(market_res as string) }; //Change this, so that stats goes in separa kv pair. Make sure to parse the df result as JSON.
        case "recommend": 
            const session = getSession(userId);
            if (session.lastResults && session.lastResults.length > 0) {
                const convertedListing = convertListingQuery(session.lastResults?.[0] as ListingRow);
                const rec_res = await recommendationAgent(convertedListing);

                return { response: rec_res }; 
            } else {
                return { response: "Unable to find any previous results. Please perform a search first." };
            }
        case "knowledge":
            const rag_res = await ragAgent(query);

            return {response: rag_res };
        case "mixed": {
            
            const [listings, stats] = await Promise.all([
                propertySearchAgent(query, userId),
                marketStatsAgent(query)
            ]);

            let listing_res;

            if (listings.status == "NEED_INFO") {
                listing_res = listings.prompt;
            } else if (listings.data === undefined || listings.data.length == 0) {
                listing_res = "No property search results were found! Please try another search query.";
            } else {
                listing_res = listings.data;
            }

            const combined = formatCombinedResponse(listing_res, stats); //Reformat response format to match with other agents.

            return combined;
        }
        default:
            return { response: "I'm not sure how to help with that. Try asking about properties or market trends." };
    }
}

// May not be needed, since we have the interface. But keep it around just in case.
if (import.meta.main) {
    const userId = process.argv[2];
    const query = process.argv[3];
    // const limit = process.argv[4] ? Number(process.argv[4]) : 10;
    // const pageNum = process.argv[5] ? Number(process.argv[5]) : 1;

    if(userId && query){
        const results = await orchestrate(query, userId);
        console.log(results);
    } else {
        const results = { response: "No userId and/or query was provided! Please provide a userId and/or query!" };
        console.log(results);
    }    

    await closeConnection();

}