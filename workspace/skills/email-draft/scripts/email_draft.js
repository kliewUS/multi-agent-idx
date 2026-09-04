import nodemailer from "nodemailer";
import { getSession, updateSession } from "../../mls-search/scripts/mls_session.js";
import * as dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});
// STEP 1: Draft — never send without approval
export async function draftEmail(to, subject, body) {
    return { draft: { to, subject, body }, status: "pending_approval" };
}
// STEP 2: Send only after explicit human confirmation
export async function sendApprovedEmail(draft) {
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
    if (intent == "email_draft") {
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
            console.log("Current Draft: ");
            console.log(res.draft.body);
            updateSession(userId, res);
            console.log("Drafted email successfully. Please review the draft before approval.");
        }
        else {
            //If no results, just simply return an error response. Don't bother updating the session.
            console.log("There are no Property and/or Market search results found. Please run Property and/or Market search before drafting an email.");
        }
    }
    else if (intent == "email_deny") {
        // If there's no draft, return an error response. Don't bother updating the session.
        if (session.draft && session.status == "pending_approval") {
            updateSession(userId, { status: "denied" });
            console.log("Email Report draft canceled.");
        }
        else {
            console.log("User has no pending draft to deny. Try asking the email agent to draft an email first."); //Will change to response.
        }
    }
    else if (intent == "email_approve") {
        // If there's no draft, return an error response. Don't bother updating the session.
        if (session.draft && session.status == "pending_approval") {
            await sendApprovedEmail(session.draft);
            updateSession(userId, { status: "approved" });
            console.log("Email Report sent!");
        }
        else {
            console.log("User has no pending draft to approve. Try asking the email agent to draft an email first.");
        }
    }
}
