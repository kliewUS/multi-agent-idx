import fs from 'fs';
import path from 'path';
import { ListingRow } from "./active_listing_search.js";

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
const FILE_PATH = path.resolve(process.cwd(), 'sessions.json');

/**
 * Loads all sessions from JSON file into memory.
 */
function loadSessionsFromFile(): Map<string, UserSession> {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const data = fs.readFileSync(FILE_PATH, 'utf-8');
            const parsed = JSON.parse(data);
            return new Map(Object.entries(parsed));
        }
    } catch (error) {
        console.error("Failed to load sessions file, initializing empty state:", error);
    }
    return new Map<string, UserSession>();
}

/**
 * Persists current in-memory sessions to JSON file.
 */
function saveSessionsToFile() {
    try {
        const obj = Object.fromEntries(sessions);
        fs.writeFileSync(FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (error) {
        console.error("Failed to save sessions to file:", error);
    }
}

// Load persisted state into memory on startup
const sessions = loadSessionsFromFile();

// const sessions = new Map<string, UserSession>();
export function getSession(userId: string): UserSession {
    if (!sessions.has(userId)) {
        console.log(`${userId} does not exist. Starting conversation.`);
        sessions.set(userId, { conversationStep: 0 });
        saveSessionsToFile();
    }
    return sessions.get(userId)!;
}
export function updateSession(userId: string, updates: Partial<UserSession>) {
    const session = getSession(userId);
    sessions.set(userId, { ...session, ...updates });
    saveSessionsToFile();
}
export function clearSession(userId: string) {
    sessions.delete(userId);
    saveSessionsToFile();
}