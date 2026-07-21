import { getSession, updateSession } from "../../week-4/scripts/mls_session.js";
// import { getSession, updateSession, UserSession } from "./mls_session.js";
import { query } from "./mysql_conn.js";
export async function searchActiveListings(filters, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let sql = `
    SELECT
        L_ListingID, L_DisplayId, L_Address, L_City, L_Zip,
        L_SystemPrice AS price, L_Keyword2 AS beds, LM_Dec_3 AS baths,
        LM_Int2_3 AS sqft, L_Type_ AS type, L_Status AS status,
        LMD_MP_Latitude AS lat, LMD_MP_Longitude AS lng,
        YearBuilt, AssociationFee, DaysOnMarket,
        PoolPrivateYN, ViewYN, FireplaceYN, PhotoCount,
        LA1_UserFirstName, LA1_UserLastName, LO1_OrganizationName
    FROM rets_property WHERE L_Status = "Active"
    `;
    const params = [];
    if (filters.city) {
        sql += " AND L_City = ?";
        params.push(filters.city);
    }
    if (filters.maxPrice) {
        sql += " AND L_SystemPrice <= ?";
        params.push(filters.maxPrice);
    }
    if (filters.beds) {
        sql += " AND L_Keyword2 >= ?";
        params.push(filters.beds);
    }
    if (filters.baths) {
        sql += " AND LM_Dec_3 >= ?";
        params.push(filters.baths);
    }
    if (filters.sqft) {
        sql += " AND LM_Int2_3 >= ?";
        params.push(filters.sqft);
    }
    if (filters.type) {
        sql += " AND L_Type_ = ?";
        params.push(filters.type);
    }
    if (filters.pool) {
        sql += " AND PoolPrivateYN = ?";
        params.push(filters.pool);
    }
    if (filters.hasView) {
        sql += " AND ViewYN = ?";
        params.push(filters.hasView);
    }
    if (filters.maxhoaPrice) {
        sql += " AND AssociationFee <= ?";
        params.push(filters.maxhoaPrice);
    }
    sql += " ORDER BY L_SystemPrice ASC LIMIT ? OFFSET ?";
    params.push(limit.toString(), offset.toString());
    return query(sql, params);
}
export async function search(userId, incomingFilters, pageNum, limit) {
    if (!userId) {
        return "UserId is missing!";
    }
    // Filters out any null or blank values to ensure we are updating only fields in the current turn.
    const extractedFields = Object.fromEntries(Object.entries(incomingFilters || {}).filter(([_, value]) => value !== undefined && value !== null && value !== ""));
    // console.log(`Extracted Fields: ${JSON.stringify(extractedFields, null, 2)}`);
    //Update the session to include the new extracted fields and set our current sessions.
    updateSession(userId, extractedFields);
    const activeSession = getSession(userId);
    // console.log(`Current User Id: ${userId}`);
    // console.log(`Current Session: ${JSON.stringify(activeSession, null, 2)}`);            
    // Check if it's missing these fields. If it is, prompt the user for more info and set the status to NEED_INFO.
    const steps = [
        { field: 'city', step: 0, prompt: 'Which city are you looking to find homes in?' },
        { field: 'maxPrice', step: 1, prompt: 'What is your maximum budget for this property?' },
        { field: 'beds', step: 2, prompt: 'How many bedrooms do you need?' },
        { field: 'type', step: 3, prompt: 'What type of property are you looking for? (e.g., House, Condo, Townhouse)' }
    ];
    const missingStep = steps.find(s => !activeSession?.[s.field]);
    if (missingStep) {
        updateSession(userId, { conversationStep: missingStep.step });
        return {
            status: "NEED_INFO",
            missingField: missingStep.field,
            prompt: missingStep.prompt
        };
    }
    // Retrieve the results by calling SQL to query the rets_property table.
    const results = await searchActiveListings(activeSession, Number(pageNum), Number(limit));
    // Update our session and set our last results. Return a SUCCESS response.
    updateSession(userId, {
        conversationStep: 4,
        lastResults: results
    });
    console.table(results, ['L_Address', 'L_City', 'L_Zip', 'price', 'beds', 'baths', 'sqft', 'type', 'lat', 'lng', 'YearBuilt', 'AssociationFee', 'DaysOnMarket', 'PhotoCount']);
    return {
        status: "SUCCESS",
        count: results.length,
        data: results
    };
}
