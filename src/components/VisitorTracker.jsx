import { useEffect } from 'react';
import axios from 'axios';

/**
 * Silent component that tracks visitor activity.
 * Generates a unique visitorId and sends a heartbeat to the server.
 */
const VisitorTracker = () => {
  useEffect(() => {
    // 1. Get or create visitorId
    let visitorId = localStorage.getItem('xorya_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('xorya_visitor_id', visitorId);
    }

    // 2. Heartbeat function
    const sendHeartbeat = async () => {
      try {
        // Find base URL (assume same host as current, but port 3001 for server if dev)
        // Or better, use a relative path if it's proxied, or a default.
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:3001' 
          : window.location.origin;

        await axios.post(`${baseUrl}/api/admin/track`, { visitorId });
      } catch (err) {
        // Fail silently
        // console.warn('Tracker heartbeat failed');
      }
    };

    // 3. Initial heartbeat
    sendHeartbeat();

    // 4. Periodic heartbeat (every 45 seconds)
    const interval = setInterval(sendHeartbeat, 45000);

    return () => clearInterval(interval);
  }, []);

  return null; // Invisible component
};

export default VisitorTracker;
