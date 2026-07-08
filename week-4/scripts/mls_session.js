const sessions = new Map();
export function getSession(userId) {
    if (!sessions.has(userId)) {
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
