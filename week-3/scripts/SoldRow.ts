interface SoldRow {
    ListingKey: BigInt;
    UnparsedAddress: string;
    City: string;
    CloseDate: string;
    ClosePrice: number;
    OriginalListPrice: number;
    ListPrice: number;
    BedroomsTotal: number;   
    BathroomsTotalInteger: number;   
    LivingArea: number;   
    PropertyType: string;   
    YearBuilt: number;   
    ListAgentFullName: string;   
    ListOfficeName: string;   
    BuyerOfficeName: string;   
} //Check california_sold database to confirm datatypes and handle null values.