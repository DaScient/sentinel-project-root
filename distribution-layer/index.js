/**
 * Sentinel Nexus: Distribution Layer Worker
 * Implements SHA-256 Daily Rotating Handshake
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // 1. HELPER: Generate the expected Daily Token
    const getExpectedToken = async () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dataToHash = env.SECRET_SALT + today;
      const msgUint8 = new TextEncoder().encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // 2. ENDPOINT: /ingest (POST) - Secure Data Update
    if (url.pathname === "/ingest" && method === "POST") {
      const authHeader = request.headers.get("Authorization");
      const expectedToken = await getExpectedToken();

      if (!authHeader || !authHeader.includes(expectedToken)) {
        return new Response("Unauthorized: Handshake Failed", { status: 401 });
      }

      try {
        const payload = await request.json();
        // Store as a string in KV with a 24-hour expiration (86400 seconds)
        // This ensures stale data doesn't persist if the pulse stops.
        await env.NEXUS_STATE.put("LATEST_INTEL", JSON.stringify(payload), { expirationTtl: 86400 });
        
        return new Response(JSON.stringify({ status: "State Updated", timestamp: Date.now() }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response("Invalid JSON Payload", { status: 400 });
      }
    }

    // 3. ENDPOINT: /tactical (GET) - HUD Data Fetch
    if (url.pathname === "/tactical" && method === "GET") {
      const data = await env.NEXUS_STATE.get("LATEST_INTEL");

      const responseBody = data ? data : JSON.stringify({
        status: "FAILOVER",
        message: "Using Last Known Good state. Check Ingestion Pulse.",
        data: [] 
      });

      return new Response(responseBody, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow GitHub Pages/Tactical HUD
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, max-age=60" // Cache for 1 minute at the edge
        },
      });
    }

    // Default Fallback
    return new Response("Sentinel Nexus Gateway: Active", { status: 200 });
  },
};
