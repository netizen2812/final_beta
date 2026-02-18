import { getIslamicContext } from './src/services/ragService.js';

async function test() {
    try {
        console.log("Testing RAG Context Retrieval...");
        const context = await getIslamicContext("Does bleeding break wudu?", "Hanafi");
        console.log("✅ Context Retrieved Length:", context.length);
        console.log("--- START CONTEXT ---");
        console.log(context.substring(0, 500) + "...");
        console.log("--- END CONTEXT ---");
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

test();
