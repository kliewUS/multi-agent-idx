// Note: Make sure to clear out session.json before running these tests.
import { closeConnection } from "../skills/mls-search/scripts/mysql_conn.js";
import { orchestrate } from "../skills/real-estate-orchestrator/scripts/orchestrator.js";
async function testOrchestrate(query, userId) {
    const res = await orchestrate(query, userId);
    console.log(res);
    const hyphenLine = "-".repeat(40);
    console.log(hyphenLine);
}
// Invalid output:
await testOrchestrate("", "");
await testOrchestrate("Find homes in Irvine.", "");
await testOrchestrate("", "+43366704333");
// Search test: 
await testOrchestrate("Find homes in Irvine.", "+43366704333");
await testOrchestrate("Under $1.5M.", "+43366704333");
await testOrchestrate("Condo with at least 3 beds", "+43366704333");
// Market test:
await testOrchestrate("Is it a good time to buy in San Diego?", "+43366704333");
// RAG test:
await testOrchestrate("What does DOM mean?", "+43366704333");
// Recommendation test
await testOrchestrate("Recommend me some homes.", "+43366704333");
// Recommendation with no results
await testOrchestrate("Recommend me some homes.", "+13366704332");
// Mixed test:
await testOrchestrate("Show me 3-bedroom condos in Irvine under $1.5M and tell me if it is a good time to buy there.", "+23366704334");
// Mixed test with missing fields:
await testOrchestrate("Tell me if it is a good time to buy there and find me homes in Irvine.", "+3334470122");
await testOrchestrate("Find me homes in Irvine under $1.5M and tell me if it is a good time to buy there.", "+3334470122");
await testOrchestrate("Find me 3-bedroom condos in Irvine under $1.5M and tell me if it is a good time to buy there.", "+3334470122");
// Irrelevant query test:
await testOrchestrate("Tell me a story about your life.", "+43366704333");
await closeConnection();
