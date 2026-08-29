import nodemailer from "nodemailer";
import { getSession, updateSession } from "../../mls-search/scripts/mls_session.js";
import * as dotenv from 'dotenv';

dotenv.config();

export interface EmailDraft {
    to?: string;
    subject?: string;
    body?: string;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

// STEP 1: Draft — never send without approval
export async function draftEmail(to: string, subject: string, body: string) {
    return { draft: { to, subject, body }, status: "pending_approval" };
}
// STEP 2: Send only after explicit human confirmation
export async function sendApprovedEmail(draft: EmailDraft): Promise<void> {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: draft.to,
        subject: draft.subject,
        text: draft.body,
    });
}

if (import.meta.main) {
    const userId = process.argv[2];
    const intent = process.argv[3];

    const session = getSession(userId);

    if(intent == "email_draft"){
        let body = "";
        const result = session.lastResults;
        const resultStats = session.lastMarketResults;

        if (result) {
            const listings = result.slice(0,5).map((l: { L_Address: any; L_City: any; price: { toLocaleString: () => any; }; beds: any; baths: any; sqft: any; DaysOnMarket: any; }) =>
                `${l.L_Address}, ${l.L_City}\n` + `$${l.price.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.sqft} sqft\n` + `${l.DaysOnMarket} days on market`).join("\n\n");
            
            body = body.concat(`Property Listings Report for ${session.city}:\n${listings}`);
        }

        if (resultStats) {
            const stats = resultStats.slice(0,6).map((l: { month: any; sales: any; avg_price: { toLocaleString: () => any; }; 
                avg_price_per_sqft: { toLocaleString: () => any; }; avg_dom: any; list_to_close_pct: any; price_change_pct: any; }) =>
                `${l.month}: ${l.sales} sales\n` + `Average Price: $${l.avg_price.toLocaleString()} | Average Price/sqft: $${l.avg_price_per_sqft.toLocaleString()}/sqft | Average DOM: ${l.avg_dom}\n` 
                    + `List-to-Close Percentage: ${l.list_to_close_pct}% | Price Change Percentage: ${l.price_change_pct.toFixed(2)}%`).join("\n\n");
            
            if(result){
                body = body.concat(`\n\nMarket Report for ${session.city}:\n${stats}`);            
            }else{
                body = body.concat(`Market Report for ${session.city}:\n${stats}`);            
            }
        }

        //Override existing draft if there one already.
        if(body){
            const res = await draftEmail(process.env.EMAIL_USER as string, "IDX Real Estate Report", body); //listing string is placeholder.
            console.log("Current Draft: ")
            console.log(res.draft.body);
            updateSession(userId, res);
            console.log("Drafted email successfully. Please review the draft before approval.")
        } else {
            //If no results, just simply return an error response. Don't bother updating the session.
            console.log("There are no Property and/or Market search results found. Please run Property and/or Market search before drafting an email.")
        }
    } else if (intent == "email_deny"){
        // If there's no draft, return an error response. Don't bother updating the session.
        if(session.draft && session.status == "pending_approval" ){
            updateSession(userId, { status: "denied" });
            console.log("Email Report draft canceled.")
        } else {
            console.log("User has no pending draft to deny. Try asking the email agent to draft an email first."); //Will change to response.
        }
    } else if (intent == "email_approve"){
        // If there's no draft, return an error response. Don't bother updating the session.
        if(session.draft && session.status == "pending_approval" ){
            await sendApprovedEmail(session.draft);
            updateSession(userId, { status: "approved" });
            console.log("Email Report sent!")
        } else {
            console.log("User has no pending draft to approve. Try asking the email agent to draft an email first.");
        }
    }


}

//Main method. 
// Three different intent: email_draft, email_approve, email_deny
// Call getsessionId (Done in orchestrator), but for main method call it here. If no lastResults, then skip printing it out. Grab city and run the marketAgent to get results.
// If lastResults and marketAgent returns no results. Then send error message saying. There's nothing to print out here. 
//If email field doesn't not exist or is a empty JSON object, create a draft and save it to session of the userId (Field name = email).
//If response = approved. Then update email.status via updateSession and send the email. Then delete/set to empty JSON object in email afterwards. 
//If response = denied, then simply delete/set to empty JSON object in email field. 