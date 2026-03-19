const GATEWAY_URL = "https://your-worker.workers.dev/tactical";

// Initialize Globe
const world = Globe()
    (document.getElementById('globeViz'))
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .pointColor(d => d.threat_score > 7 ? '#ff3c3c' : '#00f2ff')
    .pointRadius(0.5)
    .pointsMerge(true)
    .onPointClick(d => showIntel(d))
    .pointLabel(d => `[THREAT LEVEL ${d.threat_score}]`);

// Data Persistence / Sync
async function syncTacticalState() {
    try {
        const response = await fetch(GATEWAY_URL);
        const data = await response.json();
        
        // Pass to Web Worker for parsing to keep UI fluid
        const worker = new Worker('worker-parser.js');
        worker.postMessage(data);
        
        worker.onmessage = (e) => {
            world.pointsData(e.data);
            document.getElementById('status-indicator').innerText = `LAST SYNC: ${new Date().toLocaleTimeString()}`;
        };
    } catch (err) {
        console.error("Link Terminated: ", err);
        document.getElementById('status-indicator').innerText = "CONNECTION LOST - FAILOVER ACTIVE";
    }
}

function showIntel(d) {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('hidden');
    
    document.getElementById('intel-headline').innerText = d.headline;
    document.getElementById('intel-score').innerText = d.threat_score;
    document.getElementById('intel-gpe').innerText = d.gpe;
    document.getElementById('intel-unit').innerText = d.adversary_unit;
    document.getElementById('intel-intent').innerText = d.intent;
    document.getElementById('intel-source').innerText = d.source;
}

function closePanel() {
    document.getElementById('detail-panel').classList.add('hidden');
}

// Initial Sync & 5-minute Auto-Refresh
syncTacticalState();
setInterval(syncTacticalState, 300000);
