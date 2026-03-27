const testFetch = async () => {
    const key = "AIzaSyArpcreraul4RRXnhn1n8lceEAa-nD00CQ";
    // Using gemini-pro-latest which was in the list
    const urls = [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${key}`,
    ];

    for (const url of urls) {
        try {
            console.log(`🚀 Testing URL: ${url.replace(key, "HIDDEN")}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "hi" }] }]
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log("✅ Success!");
                console.log("📝 Data:", JSON.stringify(data.candidates[0].content.parts[0].text));
            } else {
                console.log(`❌ Failed (${response.status}):`, JSON.stringify(data, null, 2));
            }
        } catch (err) {
            console.error("💥 Error:", err.message);
        }
    }
};

testFetch();
