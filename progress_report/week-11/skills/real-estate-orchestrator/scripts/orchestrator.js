// Goals for Week 11:
// Connect email to nodemailer. (DONE)
// Test it individually in the main method. (DONE)
// Test the new intent cases. (DONE)
// Add email cases in orchestartor and test it out on CLI via the interface. (DONE)
// Test it out on CLI (DONE), OpenClaw, and WhatsApp.
import { parsePropertyQuery } from "../../nlp-parser/scripts/nlp_parser.js";
import { getSession, updateSession } from "../../mls-search/scripts/mls_session.js";
import { spawn } from 'child_process';
import { search } from "../../mls-search/scripts/active_listing_search.js";
import { closeConnection } from "../../mls-search/scripts/mysql_conn.js";
import { draftEmail, sendApprovedEmail } from "../../email-draft/scripts/email_draft.js";
export async function classifyIntent(query) {
    // Use Ollama agent to read the query and classify it as one of the intent.
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-11/skills/real-estate-orchestrator/scripts/intent_query.py', query]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/real-estate-orchestrator/scripts/intent_query.py', query]);
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
        return "City was not provided in the query. Please enter a city name.";
    }
    const city = parsedFilters.city;
    return new Promise((res, rej) => {
        const process = spawn('python', ['progress_report/week-11/skills/market-analytics/scripts/market_analytics.py', city]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/market-analytics/scripts/market_analytics.py', city]);
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
        const process = spawn('python', ['progress_report/week-11/skills/real-estate-recommendations/scripts/recommendation_engine.py', query]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/real-estate-recommendations/scripts/recommendation_engine.py', query]);
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
        const process = spawn('python', ['progress_report/week-11/skills/real-estate-rag-agent/scripts/rag_agent.py', query]);
        // const process = spawn('/Users/kyuliew/.openclaw/workspace/venv/bin/python3', ['skills/real-estate-rag-agent/scripts/rag_agent.py', query]);
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
export async function emailDraftAgent(userId) {
    const session = getSession(userId);
    let body = "";
    const result = session.lastResults;
    const resultStats = session.lastMarketResults;
    if (result) {
        const listings = result.slice(0, 5).map((l) => `${l.L_Address}, ${l.L_City}\n` + `$${l.price.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.sqft} sqft\n` + `${l.DaysOnMarket} days on market`).join("\n\n");
        body = body.concat(`Property Listings Report for ${session.city}:\n${listings}`);
    }
    if (resultStats) {
        const stats = resultStats.slice(0, 6).map((l) => `${l.month}: ${l.sales} sales\n` + `Average Price: $${l.avg_price.toLocaleString()} | Average Price/sqft: $${l.avg_price_per_sqft}/sqft | Average DOM: ${l.avg_dom}\n`
            + `List-to-Close Percentage: ${l.list_to_close_pct}% | Price Change Percentage: ${l.price_change_pct.toFixed(2)}%`).join("\n\n");
        if (result) {
            body = body.concat(`\n\nMarket Report for ${session.city}:\n${stats}`);
        }
        else {
            body = body.concat(`Market Report for ${session.city}:\n${stats}`);
        }
    }
    //Override existing draft if there one already.
    if (body) {
        const res = await draftEmail(process.env.EMAIL_USER, "IDX Real Estate Report", body); //listing string is placeholder.
        updateSession(userId, res);
        return { response: "Drafted email successfully. Please review the draft before approval.", draft: res.draft.body };
    }
    else {
        //If no results, just simply return an error response. Don't bother updating the session.
        return { response: "There are no Property and/or Market search results found. Please run Property and/or Market search before drafting an email." };
    }
}
export async function emailDenyAgent(userId) {
    const session = getSession(userId);
    // If there's no draft, return an error response. Don't bother updating the session.
    if (session.draft && session.status == "pending_approval") {
        updateSession(userId, { status: "denied" });
        return { response: "Email Report draft canceled." };
    }
    else {
        return { response: "You do not have a pending draft to deny. Try drafting an email first." };
    }
}
export async function emailApproveAgent(userId) {
    const session = getSession(userId);
    // If there's no draft, return an error response. Don't bother updating the session.
    if (session.draft && session.status == "pending_approval") {
        await sendApprovedEmail(session.draft);
        updateSession(userId, { status: "approved" });
        return { response: "Email Report sent!" };
    }
    else {
        return { response: "You do not have a pending draft to approve. Try drafting an email first." };
    }
}
// Find a better way to format this response. Also don't stringify JSON for the interface.
export async function formatCombinedResponse(userId, listing, stats) {
    const res = { response: "" };
    if (typeof listing == "string"
        && (typeof stats == "string"
            && (stats == "No market analytics results were found. Please try another city search query."
                || stats == "City was not provided in the query. Please enter a city name."))) {
        res.response = "No results were found on both property search and market analytics. Please try another search query.";
    }
    else if (typeof listing == "string") {
        res.response = listing;
        res.stats = JSON.parse(stats);
        updateSession(userId, { lastMarketResults: JSON.parse(stats) });
    }
    else if (typeof stats == "string"
        && (stats == "No market analytics results were found. Please try another city search query."
            || stats == "City was not provided in the query. Please enter a city name.")) {
        res.response = stats;
        res.listings = listing;
    }
    else {
        res.response = "Success";
        res.listings = listing;
        res.stats = JSON.parse(stats);
        updateSession(userId, { lastMarketResults: JSON.parse(stats) });
    }
    return res;
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
    // export async function orchestrate(query: string, userId: string): AgentResult  {
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
                return { response: "No property search results were found! Please try another search query." };
            }
            else {
                // return { response: JSON.stringify(search_res.data) }; //Change this, so we always have a response field and listing goest in separate kv pair.
                return { response: "Success", listings: search_res.data }; //Change this, so we always have a response field and listing goest in separate kv pair.
            }
        case "market":
            const market_res = await marketStatsAgent(query);
            if (typeof market_res == "string"
                && (market_res == "No market analytics results were found. Please try another city search query."
                    || market_res == "City was not provided in the query. Please enter a city name.")) {
                return { response: market_res };
            }
            updateSession(userId, { lastMarketResults: JSON.parse(market_res) });
            // return { response: market_res }; //Change this, so that stats goes in separa kv pair.
            return { response: "Success", stats: JSON.parse(market_res) }; //Change this, so that stats goes in separa kv pair. Make sure to parse the df result as JSON.
        case "recommend":
            const session = getSession(userId);
            if (session.lastResults && session.lastResults.length > 0) {
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
                listing_res = "No property search results were found! Please try another search query.";
            }
            else {
                listing_res = listings.data;
            }
            const combined = formatCombinedResponse(userId, listing_res, stats); //Reformat response format to match with other agents.
            return combined;
        }
        case "email_draft":
            const draft_res = await emailDraftAgent(userId);
            return draft_res;
        case "email_deny":
            const deny_res = await emailDenyAgent(userId);
            return deny_res;
        case "email_approve":
            const approve_res = await emailApproveAgent(userId);
            return approve_res;
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
