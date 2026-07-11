const sessions = new Map();
export function getSession(userId) {
    if (!sessions.has(userId)) {
        console.log(`${userId} does not exist. Starting conversation.`);
        sessions.set(userId, { conversationStep: 0 });
    }
    return sessions.get(userId);
}
export function updateSession(userId, updates) {
    const session = getSession(userId);
    sessions.set(userId, { ...session, ...updates });
}
export function clearSession(userId) {
    sessions.delete(userId);
}
export async function checkSessionInfo(userId, currentSession) {
    if (!currentSession.city) {
        updateSession(userId, { conversationStep: 0 });
        console.log(JSON.stringify({
            status: "NEED_INFO",
            missingField: "city",
            prompt: "Which city are you looking to find homes in?"
        }));
        // await closeConnection();
        // process.exit(0);
    }
    if (!currentSession.maxPrice) {
        updateSession(userId, { conversationStep: 1 });
        console.log(JSON.stringify({
            status: "NEED_INFO",
            missingField: "maxPrice",
            prompt: "What is your maximum budget for this property?"
        }));
        // await closeConnection();
        // process.exit(0);
    }
    if (!currentSession.beds) {
        updateSession(userId, { conversationStep: 2 });
        console.log(JSON.stringify({
            status: "NEED_INFO",
            missingField: "beds",
            prompt: "How many bedrooms do you need?"
        }));
        // await closeConnection();
        // process.exit(0);
    }
    // if (!currentSession.baths) {
    //     console.log(JSON.stringify({
    //         status: "NEED_INFO",
    //         missingField: "baths",
    //         prompt: "How many bathrooms do you need?"
    //     }));
    //     await closeConnection();
    //     process.exit(0);
    // }
    if (!currentSession.type) {
        updateSession(userId, { conversationStep: 3 });
        console.log(JSON.stringify({
            status: "NEED_INFO",
            missingField: "type",
            prompt: "What type of property are you looking for? (e.g., House, Condo, Townhouse)"
        }));
        // await closeConnection();
        // process.exit(0);
    }
}
