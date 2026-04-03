/**
 * Daily.co Room Provisioning Service
 * Auto-creates and manages video call rooms via the Daily.co REST API.
 */

const DAILY_API_URL = 'https://api.daily.co/v1';

/**
 * Create a Daily.co room for a batch.
 * Room names are derived from the batch ID for deterministic mapping.
 * @param {string} batchId - MongoDB ObjectId of the batch
 * @param {string} batchName - Human-readable batch name (used as room label)
 * @returns {string|null} The room name, or null if API key not configured
 */
export async function createDailyRoom(batchId, batchName) {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
        console.warn("[Daily.co] DAILY_API_KEY not set — skipping room creation. Video calls will fail.");
        return null;
    }

    // Use a deterministic room name so we can find it later
    const roomName = `tarbiyah-${batchId}`;

    try {
        // Check if room already exists
        const checkRes = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (checkRes.ok) {
            console.log(`[Daily.co] Room "${roomName}" already exists`);
            return roomName;
        }

        // Create new room
        const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                name: roomName,
                properties: {
                    // Room settings optimized for Tarbiyah classes
                    max_participants: 30,
                    enable_chat: true,
                    enable_screenshare: true,
                    enable_knocking: false,
                    start_video_off: false,
                    start_audio_off: true,
                    // No expiration — persistent room for recurring batch classes
                    exp: null
                }
            })
        });

        if (!createRes.ok) {
            const errBody = await createRes.text();
            console.error(`[Daily.co] Room creation failed (${createRes.status}):`, errBody);
            return null;
        }

        const room = await createRes.json();
        console.log(`[Daily.co] Room created: ${room.name} (URL: ${room.url})`);
        return room.name;

    } catch (error) {
        console.error("[Daily.co] Room creation error:", error.message);
        return null;
    }
}

/**
 * Delete a Daily.co room (for cleanup when batch is deleted/archived).
 * @param {string} roomName - The Daily.co room name
 */
export async function deleteDailyRoom(roomName) {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey || !roomName) return;

    try {
        await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        console.log(`[Daily.co] Room "${roomName}" deleted`);
    } catch (error) {
        console.error("[Daily.co] Room deletion error:", error.message);
    }
}

/**
 * Configure Daily.co webhooks via API (since the dashboard doesn't have a webhook UI).
 * Should be called once on server startup.
 * @param {string} backendUrl - The public URL of the backend (e.g., https://final-beta.onrender.com)
 */
export async function setupDailyWebhook(backendUrl) {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
        console.log("[Daily.co] DAILY_API_KEY not set — skipping webhook setup");
        return;
    }

    const webhookUrl = `${backendUrl}/api/live/webhook/daily`;

    try {
        // List existing webhooks
        const listRes = await fetch(`${DAILY_API_URL}/webhooks`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (listRes.ok) {
            const data = await listRes.json();
            const webhooks = data.data || [];
            const alreadyExists = webhooks.some(w => w.url === webhookUrl);
            
            if (alreadyExists) {
                console.log(`[Daily.co] Webhook already configured: ${webhookUrl}`);
                return;
            }
        }

        // Create new webhook
        const createRes = await fetch(`${DAILY_API_URL}/webhooks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                url: webhookUrl,
                event_types: [
                    'meeting.started',
                    'meeting.ended',
                    'participant.joined',
                    'participant.left'
                ]
            })
        });

        if (createRes.ok) {
            console.log(`[Daily.co] Webhook registered: ${webhookUrl}`);
        } else {
            const errBody = await createRes.text();
            console.warn(`[Daily.co] Webhook setup failed (${createRes.status}):`, errBody);
        }

    } catch (error) {
        console.error("[Daily.co] Webhook setup error:", error.message);
    }
}
