import { closeConnection } from "../../mls-search/scripts/mysql_conn.js";
import { AgentResult, orchestrate } from "./orchestrator.js";

export async function onWhatsAppMessage(message: string, userId: string) {
    try {
        const result = await orchestrate(message, userId);
        return formatForWhatsApp(result as AgentResult);
    } catch (err) {
        console.error("Orchestration error:", err);
        return "Sorry, I hit an issue. Please try again.";
    }
}

function formatForWhatsApp(result: AgentResult): string {
if (result.listings && result.stats) { 
    const listings = result.listings.slice(0,5).map((l: { L_Address: any; L_City: any; price: { toLocaleString: () => any; }; beds: any; baths: any; sqft: any; DaysOnMarket: any; }) =>
        `${l.L_Address}, ${l.L_City}\n` + `$${l.price.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.sqft} sqft\n` + `${l.DaysOnMarket} days on market`).join("\n\n");

    const stats = result.stats.slice(0,6).map((l: { month: any; sales: any; avg_price: { toLocaleString: () => any; }; 
        avg_price_per_sqft: { toLocaleString: () => any; }; avg_dom: any; list_to_close_pct: any; price_change_pct: any; }) =>
        `${l.month}: ${l.sales} sales\n` + `Average Price: $${l.avg_price.toLocaleString()} | Average Price/sqft: $${l.avg_price_per_sqft}/sqft | Average DOM: ${l.avg_dom}\n` 
            + `List-to-Close Percentage: ${l.list_to_close_pct}% | Price Change Percentage: ${l.price_change_pct.toFixed(2)}%`).join("\n\n");

    return `${listings}\n\n${stats}`;
}

if (result.listings) {
    const listings = result.listings.slice(0,5).map((l: { L_Address: any; L_City: any; price: { toLocaleString: () => any; }; beds: any; baths: any; sqft: any; DaysOnMarket: any; }) =>
        `${l.L_Address}, ${l.L_City}\n` + `$${l.price.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.sqft} sqft\n` + `${l.DaysOnMarket} days on market`).join("\n\n");
    
    if(result.response != "Success") {
        return `${listings}\n\n${result.response}`;
    } else {
        return listings;
    }
} 

if (result.stats) {
    const stats = result.stats.slice(0,6).map((l: { month: any; sales: any; avg_price: { toLocaleString: () => any; }; 
        avg_price_per_sqft: { toLocaleString: () => any; }; avg_dom: any; list_to_close_pct: any; price_change_pct: any; }) =>
        `${l.month}: ${l.sales} sales\n` + `Average Price: $${l.avg_price.toLocaleString()} | Average Price/sqft: $${l.avg_price_per_sqft}/sqft | Average DOM: ${l.avg_dom}\n` 
            + `List-to-Close Percentage: ${l.list_to_close_pct}% | Price Change Percentage: ${l.price_change_pct.toFixed(2)}%`).join("\n\n");

    if(result.response != "Success") {
        return `${stats}\n\n${result.response}`;
    } else {
        return stats;
    }
} 

if (result.draft){
    return `${result.response}\n\n${result.draft}`
}

    return result.response;
}

if (import.meta.main) {
    const userId = process.argv[2];
    const query = process.argv[3];
    // const limit = process.argv[4] ? Number(process.argv[4]) : 10;
    // const pageNum = process.argv[5] ? Number(process.argv[5]) : 1;

    if(userId && query){
        const results = await onWhatsAppMessage(query, userId);
        console.log(results);
    } else {
        console.log("No userId and/or query was provided! Please provide a userId and/or query!");
    }    

    await closeConnection();
}