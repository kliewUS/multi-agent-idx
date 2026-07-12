import express from "express";
import { search } from "./active_listing_search.js";
const app = express();
app.use(express.json());
// Takes in userId, incomingFilters, pageNum, limit to perform a property search using a POST api endpoint.
app.post("/api/search", async (req, res) => {
    try {
        const { userId, incomingFilters, pageNum = 1, limit = 10 } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "userId is missing." });
        }
        const workflowResponse = await search(userId, incomingFilters, Number(pageNum), Number(limit));
        return res.json(workflowResponse);
    }
    catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MLS Search Service running on http://localhost:${PORT}`);
});
