import express from "express";
import { checkSessionInfo, getSession, updateSession } from "../../week-4/scripts/mls_session.js";
import { closeConnection, query } from "./mysql_conn.js";

export interface ListingRow {
  L_ListingID: string;
  L_DisplayId: string;
  L_Address: string;
  L_City: string;
  L_Zip: string;
  price: number;
  beds: number;
  baths: number; //Decimal converts to string to prevent loss of precision.
  sqft: number;
  type: string;
  status: string;
  lat: number;
  lng: number;
  YearBuilt: number;
  AssociationFee: number;
  DaysOnMarket: string;
  PoolPrivateYN: string;
  ViewYN: string;
  FireplaceYN: string;
  PhotoCount: number;
  LA1_UserFirstName: string;
  LA1_UserLastName: string;
  LO1_OrganizationName: string;
} 

export interface PropertyFilters { //Move this to another class?
    city: string;
    maxPrice: number;
    beds: number;
    baths: number;
    sqft: number;
    type: string;
    pool: string;
    hasView: string;   
    maxhoaPrice: number;   
}


export async function searchActiveListings(filters: PropertyFilters, page = 1, 
limit = 10) {
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
    const params: any[] = [];
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

    // params.push(limit, offset);
    params.push(limit.toString(), offset.toString());
    return query<ListingRow>(sql, params);
}

// const json = process.argv[2];
// const userId = process.argv[3];
// const pageNum = process.argv[4] ? Number(process.argv[4]) : 1;
// const limit = process.argv[5] ? Number(process.argv[5]) : 10;

// let propertyFilter: Partial<PropertyFilters> = {};

const app = express();
app.use(express.json()); // Allows parsing JSON bodies

app.post("/api/search", async (req, res) => {
    try {
        const { userId, incomingFilters, pageNum = 1, limit = 10 } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "Missing required userId parameter." });
        }

        const extractedFields = Object.fromEntries(
            Object.entries(incomingFilters || {}).filter(
                ([_, value]) => value !== undefined && value !== null && value !== ""
                )
            );

            console.log(`Extracted Fields: ${JSON.stringify(extractedFields, null, 2)}`)
            updateSession(userId, extractedFields);
            const activeSession = getSession(userId);
            console.log(`Current User Id: ${userId}`);
            console.log(`Current Session: ${JSON.stringify(activeSession, null, 2)}`);            

            if(!activeSession.city){
                updateSession(userId, { conversationStep: 0 });
                return res.json({
                    status: "NEED_INFO",
                    missingField: "city",
                    prompt: "Which city are you looking to find homes in?"                    
                })
            }

            if(!activeSession.maxPrice){
                updateSession(userId, { conversationStep: 1 });
                return res.json({
                    status: "NEED_INFO",
                    missingField: "maxPrice",
                    prompt: "What is your maximum budget for this property?"                    
                })
            }

            if(!activeSession.beds){
                updateSession(userId, { conversationStep: 2 });
                return res.json({
                    status: "NEED_INFO",
                    missingField: "beds",
                    prompt: "How many bedrooms do you need?"                    
                })
            }

            if(!activeSession.type){
                updateSession(userId, { conversationStep: 3 });
                return res.json({
                    status: "NEED_INFO",
                    missingField: "city",
                    prompt: "What type of property are you looking for? (e.g., House, Condo, Townhouse)"                    
                })
            }
            
            const results = await searchActiveListings(activeSession as PropertyFilters, Number(pageNum), Number(limit));
                
            updateSession(userId, { 
                conversationStep: 4, 
                lastResults: results 
            });

            console.table(results, ['L_Address', 'L_City', 'L_Zip', 'price', 'beds', 'baths', 'sqft', 'type', 'lat', 'lng', 'YearBuilt', 'AssociationFee', 'DaysOnMarket', 'PhotoCount']);

            return res.json({
                status: "SUCCESS",
                count: results.length,
                data: results
            });

    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// try {
//     if(json){
//         propertyFilter = JSON.parse(json);
//     }
// } catch (error){
//     if (error instanceof Error){
//         console.error("Invalue JSON string passed: ", error.message)
//     } else {
//         console.error("An unknown error occurred", error)
//     }
//     process.exit(1);
// }

// Call getSession here. If no session exist, 
// If no price is given, prompt to ask for price - ie: if (!session.maxPrice) { askForBudget() }
// If no type is provided, ask for preferences.
// If no beds are provided, ask for beds.
// If specifics provided, make sure to update the session where needed. 
// Somehow we need to map the type to the preferences. So we may to grab the typeMapper. Should be taken care of by the parser.

// As note, make sure to update the MLS skill to account for multi-turn conversation.

// const extractedFields = Object.fromEntries(
//     Object.entries(propertyFilter).filter(([_, value]) => value !== undefined && value !== null && value !== '')
// );

// updateSession(userId, extractedFields);
// const currentSession = getSession(userId);
// console.log(`Current User Id: ${userId}`);
// console.log(`Current Session: ${JSON.stringify(currentSession, null, 2)}`);

// checkSessionInfo(userId, currentSession);

// const results = await searchActiveListings(currentSession as PropertyFilters, pageNum, limit);
// // const results = await searchActiveListings(propertyFilter, pageNum, limit);

// console.table(results, ['L_Address', 'L_City', 'L_Zip', 'price', 'beds', 'baths', 'sqft', 'type', 'lat', 'lng', 'YearBuilt', 'AssociationFee', 'DaysOnMarket', 'PhotoCount']);

// updateSession(userId, { conversationStep: 4, lastResults: results });

// console.log(JSON.stringify({
//     status: "SUCCESS",
//     count: results.length,
//     data: results
// }));

// await closeConnection(); 

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MLS Search Service running continuously on http://localhost:${PORT}`);
});