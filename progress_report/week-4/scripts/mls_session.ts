import { ListingRow } from "../../week-3/scripts/active_listing_search.js";

export interface UserSession {
    city?: string;
    maxPrice?: number;
    beds?: number;
    baths?: number;
    sqft?: number;    
    type?: string;
    pool?: string;
    hasView?: string;   
    maxhoaPrice?: number;      
    lastResults?: ListingRow[];
    conversationStep: number;
}
const sessions = new Map<string, UserSession>();
export function getSession(userId: string): UserSession {
    if (!sessions.has(userId)) {
        console.log(`${userId} does not exist. Starting conversation.`);
        sessions.set(userId, { conversationStep: 0 });
    }
    return sessions.get(userId)!;
}
export function updateSession(userId: string, updates: Partial<UserSession>) {
    const session = getSession(userId);
    sessions.set(userId, { ...session, ...updates });
}
export function clearSession(userId: string) {
    sessions.delete(userId);
}