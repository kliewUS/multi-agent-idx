import { closeConnection, query } from "./mysql_conn.js";
export async function getSoldComps(city, months = 12) {
    const sql = `
        SELECT
            ListingKey, UnparsedAddress, City, CloseDate, ClosePrice,
            OriginalListPrice, ListPrice, DaysOnMarket,
            BedroomsTotal, BathroomsTotalInteger, LivingArea,
            PropertyType, PropertySubType, YearBuilt,
            ListAgentFullName, ListOfficeName, BuyerOfficeName
        FROM california_sold
        WHERE City = ?
            AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            AND PropertyType = "Residential"
        ORDER BY CloseDate DESC
        LIMIT 10
    `;
    return query(sql, [city, months]); //Need to make a new SoldRow class.
}
const json = process.argv[2];
const months = process.argv[3] ? Number(process.argv[3]) : 12;
let queryFilter;
try {
    queryFilter = JSON.parse(json);
}
catch (error) {
    if (error instanceof Error) {
        console.error("Invalue JSON string passed: ", error.message);
    }
    else {
        console.error("An unknown error occurred", error);
    }
}
if (queryFilter.city) {
    const results = await getSoldComps(queryFilter.city, months);
    console.table(results, [
        'UnparsedAddress', 'City', 'CloseDate',
        'ClosePrice', 'OriginalListPrice', 'ListPrice',
        'DaysOnMarket', 'BedroomsTotal', 'BathroomsTotalInteger',
        'LivingArea', 'PropertySubType', 'YearBuilt'
    ]);
    await closeConnection();
}
