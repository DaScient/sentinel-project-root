// --- CONFIGURATION ---
const GATEWAY_URL = "https://sentinel-nexus-gateway.aristocles24.workers.dev/tactical";
const REFRESH_INTERVAL_MS = 60000; // Poll every 60 seconds

// --- INITIALIZE GLOBE ---
const elem = document.getElementById('globeViz');
const world = Globe()(elem)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#00f2ff')
    .atmosphereAltitude(0.15)
    
    // Point Aesthetics
    .pointRadius('radius')
    .pointColor('color')
    .pointAltitude('altitude')
    .pointLabel(d => `
        <div style="background: rgba(0,0,0,0.8); padding: 8px; border: 1px solid #00f2ff; font-family: Courier New; border-radius: 4px;">
            <b>[LVL ${d.threat_score}] ${d.adversary_unit}</b><br>
            <i>${d.gpe}</i>
        </div>
    `)
    .onPointClick(d => updateTargetPanel(d));

// --- CAMERA DYNAMICS ---
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.5;
world.pointOfView({ lat: 35.0, lng: 35.0, altitude: 2.5 }); // Default: Centered on EMEA

// --- DATA INGESTION & ZERO-TRUST SYNC ---
async function syncTacticalState() {
    try {
        // 'include' ensures the Cloudflare Access JWT cookie is sent if the user is authenticated
        const response = await fetch(GATEWAY_URL, { 
            method: 'GET',
            credentials: 'include' 
        });

        if (!response.ok) throw new Error(`Gateway HTTP Error: ${response.status}`);
        
        const rawData = await response.json();
        
        // Pass payload to Web Worker to prevent UI freezing
        const parserWorker = new Worker('worker-parser.js');
        parserWorker.postMessage(rawData);
        
        parserWorker.onmessage = (e) => {
            const { points, tickerText } = e.data;
            world.pointsData(points);
            
            // Update UI Elements
            document.getElementById('connection-dot').classList.add('online');
            document.getElementById('status-indicator').innerText = "SYSTEM ONLINE // STATE SYNCED";
            document.getElementById('intel-ticker').innerText = tickerText;
        };

    } catch (error) {
        console.error("SYNC_FAILURE:", error);
        document.getElementById('connection-dot').classList.remove('online');
        document.getElementById('status-indicator').innerText = "CONNECTION LOST // AWAITING RECOVERY";
    }
}

// --- DOM INTERACTION ---
function updateTargetPanel(data) {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('hidden');
    
    document.getElementById('intel-headline').innerText = data.headline || "CLASSIFIED EVENT";
    document.getElementById('intel-score').innerText = data.threat_score || "0";
    document.getElementById('intel-gpe').innerText = data.gpe || "UNKNOWN REGION";
    document.getElementById('intel-unit').innerText = data.adversary_unit || "UNIDENTIFIED FORCE";
    document.getElementById('intel-intent').innerText = data.intent || "No intent data available.";
    document.getElementById('intel-source').innerText = data.source || "NEXUS_CORE";

    // Dynamic coloring based on threat
    const scoreElem = document.getElementById('intel-score');
    scoreElem.style.color = data.threat_score > 7 ? 'var(--alert-red)' : 'var(--alert-yellow)';
}

window.closePanel = () => {
    document.getElementById('detail-panel').classList.add('hidden');
};

// --- UTC CLOCK TICKER ---
setInterval(() => {
    const now = new Date();
    document.getElementById('utc-clock').innerText = now.toISOString().substring(11, 19) + " UTC";
}, 1000);

// --- IGNITION ---
syncTacticalState();
setInterval(syncTacticalState, REFRESH_INTERVAL_MS);
