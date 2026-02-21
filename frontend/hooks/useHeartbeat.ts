import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const useHeartbeat = () => {
    const { getToken, isSignedIn } = useAuth();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const sendHeartbeat = async () => {
            if (!isSignedIn) return;
            try {
                const token = await getToken();
                if (!token) return;

                await axios.post(`${API_BASE}/api/users/heartbeat`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Heartbeat failed", err);
            }
        };

        if (isSignedIn) {
            sendHeartbeat(); // Initial ping
            intervalRef.current = setInterval(sendHeartbeat, 30000); // Every 30s
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSignedIn, getToken]);
};
