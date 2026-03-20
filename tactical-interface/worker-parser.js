/**
 * SENTINEL NEXUS: OFFLINE DOMAIN PARSER
 * Offloads heavy coordinate parsing and color calculations from the main thread.
 */

self.onmessage = function(e) {
    const rawData = e.data;
    
    // Failover Protection: Ensure data is an array
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];
    
    let activeThreats = 0;
    const processedPoints = [];

    dataArray.forEach(item => {
        // Normalize coordinates (fallbacks to 0,0 if geocoding failed)
        const lat = parseFloat(item.location?.lat || 0);
        const lng = parseFloat(item.location?.lng || 0);
        const score = parseInt(item.threat_score || 0);

        if (score > 7) activeThreats++;

        // Visual Calculation Logic
        // Threat > 7: Red, larger radius, higher altitude pulse
        // Threat <= 7: Yellow/Cyan, smaller radius, flat altitude
        processedPoints.push({
            ...item,
            lat: lat,
            lng: lng,
            threat_score: score,
            radius: score > 7 ? 0.8 : 0.3,
            color: score > 7 ? 'rgba(255, 60, 60, 0.8)' : 'rgba(0, 242, 255, 0.6)',
            altitude: score > 7 ? (score / 10) * 0.2 : 0.01 // High threats float slightly above the globe
        });
    });

    // Generate Ticker String
    const headlines = processedPoints.map(p => `[LVL ${p.threat_score}] ${p.headline}`).join(" ✦ ");
    const tickerText = `CRITICAL THREATS ACTIVE: ${activeThreats} | LATEST INTEL: ${headlines}`;

    // Transmit finalized data back to the gl-engine
    self.postMessage({
        points: processedPoints,
        tickerText: tickerText
    });
};
