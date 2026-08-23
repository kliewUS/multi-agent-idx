// Note: Make sure to clear out session.json before running these tests.
import { closeConnection } from "../skills/mls-search/scripts/mysql_conn.js";
import { onWhatsAppMessage } from "../skills/real-estate-orchestrator/scripts/whatsapp_interface.js";
async function testWhatsApp(query, userId) {
    const res = await onWhatsAppMessage(query, userId);
    console.log(res);
    const hyphenLine = "-".repeat(40);
    console.log(hyphenLine);
}
// Invalid output:
await testWhatsApp("", "");
await testWhatsApp("Find homes in Irvine.", "");
await testWhatsApp("", "+43366704333");
// Search test: 
await testWhatsApp("Find homes in Irvine.", "+43366704333");
await testWhatsApp("Under $1.5M.", "+43366704333");
await testWhatsApp("Condo with at least 3 beds", "+43366704333");
// Market test:
await testWhatsApp("Is it a good time to buy in San Diego?", "+43366704333");
// RAG test:
await testWhatsApp("What does DOM mean?", "+43366704333");
// Recommendation test
await testWhatsApp("Recommend me some homes.", "+43366704333");
// Recommendation with no results
await testWhatsApp("Recommend me some homes.", "+13366704332");
// Mixed test:
await testWhatsApp("Show me 3-bedroom condos in Irvine under $1.5M and tell me if it is a good time to buy there.", "+23366704334");
// Mixed test with missing fields:
await testWhatsApp("Tell me if it is a good time to buy there and find me homes in Irvine.", "+3334470122");
await testWhatsApp("Find me homes in Irvine under $1.5M and tell me if it is a good time to buy there.", "+3334470122");
await testWhatsApp("Find me 3-bedroom condos in Irvine under $1.5M and tell me if it is a good time to buy there.", "+3334470122");
// Irrelevant query test:
await testWhatsApp("Tell me a story about your life.", "+43366704333");
await closeConnection();
