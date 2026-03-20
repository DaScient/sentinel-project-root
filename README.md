***

# 🌐 DaScient Sentinel Nexus

**Multi-Domain Battlespace Awareness & OSINT Platform**



## 📡 System Architecture

The platform operates on a decoupled, three-tier cloud architecture ensuring high availability, latency optimization, and secure data pipelines.

1. **The Ingestion Engine (`/ingestion_engine`)**: A Python-based backend that asynchronously harvests real-time data from NASA FIRMS, GDELT, and military RSS feeds. It utilizes Google's Gemini API (The Cognitive Sieve) to extract Geopolitical Entities (GPE), assign threat scores, and map events to a local Order of Battle (ORBAT) registry.
2. **The Distribution Layer (`/distribution-layer`)**: A Cloudflare Worker and KV (Key-Value) store combination that acts as the Global Intelligence State (GIS). It enforces a daily-rotating SHA-256 handshake and provides edge-state failover capabilities.
3. **The Tactical Interface (`/tactical-interface`)**: A WebGL-rendered 3D global HUD built with Globe.gl and Three.js. It features a responsive "Glassmorphism" UI and utilizes Web Workers to parse complex JSON payloads off the main thread, ensuring zero-latency frame rates.



## 🗂️ Repository Structure

```text
sentinel-project-root/
│
├── .github/workflows/
│   └── main.yml                  # CI/CD: 15-minute ingestion pulse & deployment automation
│
├── distribution-layer/
│   ├── index.js                  # Cloudflare Worker: Auth Handshake & Edge API routing
│   └── wrangler.toml             # Cloudflare configuration and KV namespace bindings
│
├── ingestion_engine/
│   ├── nlp_processor.py          # Gemini AI integration, Threat Scoring, and NER logic
│   ├── orbat_db.json             # Baseline adversary unit and coordinate registry
│   ├── pyproject.toml            # Python project metadata and build requirements
│   ├── requirements.txt          # Python dependencies (httpx, polars, geopy, etc.)
│   └── scraper_main.py           # Async multi-source OSINT scraper
│
├── tactical-interface/
│   ├── gl-engine.js              # 3D Globe initialization, camera dynamics, and data sync
│   ├── index.html                # Main application entry point and DOM structure
│   ├── tactical-styles.css       # Glassmorphism UI, typography, and visual aesthetics
│   └── worker-parser.js          # Web Worker for off-main-thread JSON parsing
│
├── .DS_Store                     # macOS custom attributes
├── .gitattributes                # Git configuration
├── LICENSE                       # Project license
└── README.md                     # System documentation
```



## ⚙️ Core Technical Protocols

* **PROTOCOL-ASYNC-FETCH:** Lightning-fast, non-blocking I/O harvesting using Python's `httpx` and data normalization via `Polars`.
* **PROTOCOL-NER-SPATIAL:** AI-driven extraction of geopolitical entities mapped against known adversary footprints within a predefined kilometer radius.
* **PROTOCOL-AUTH-SYNC-HANDSHAKE:** A zero-trust Machine-to-Machine (M2M) validation system. The Ingestion Engine and the Gateway agree on a daily rotating SHA-256 hash derived from a `SECRET_SALT` and the current UTC date.
* **PROTOCOL-EDGE-FAILOVER:** If the ingestion pulse drops, the Cloudflare KV seamlessly serves a "Last Known Good" state or a structured recovery payload to prevent HUD crashing.
* **PROTOCOL-UI-LATENCY:** Heavy computational coordinate parsing and color-mapping are offloaded to `worker-parser.js`, guaranteeing buttery-smooth 60FPS camera panning on the tactical globe.



## 🚀 Deployment & Configuration

### Prerequisites
To deploy Sentinel Nexus, you must provision the following API keys and platform accounts:
* **NASA MODAPS:** For FIRMS (Thermal Anomaly) data.
* **Google AI Studio:** `GEMINI_API_KEY` for the NLP Sieve.
* **Cloudflare:** Account ID, API Token, and a zero-trust `ACCESS_AUDIENCE` (if using Cloudflare Access).
* **GitHub Actions:** To run the automated 15-minute pulse.

### 1. Configure the Gateway (Cloudflare)
Navigate to the `/distribution-layer` and initialize your Edge KV and Worker.
```bash
cd distribution-layer
npm install -g wrangler
wrangler login

# Create the Global State Vault
wrangler kv namespace create NEXUS_STATE

# Add the resulting ID to your wrangler.toml, then upload your secure salt:
wrangler secret put SECRET_SALT

# Deploy to the Edge
wrangler deploy
```

### 2. Configure the Pulse (GitHub Actions)
In your GitHub repository, navigate to **Settings > Secrets and variables > Actions** and set the following repository secrets:
* `NASA_FIRMS_KEY`
* `GEMINI_API_KEY`
* `SALT` *(Must exactly match the SECRET_SALT uploaded to Cloudflare)*

The `.github/workflows/main.yml` will now automatically trigger every 15 minutes, scrape data, process it through Gemini, and push the encrypted payload to your Cloudflare Gateway.

### 3. Launch the Tactical HUD
The `/tactical-interface` requires no build step. It is a native vanilla JS/HTML/CSS stack.
1. Update `GATEWAY_URL` in `gl-engine.js` to point to your live Cloudflare Worker URL.
2. Serve the directory locally using a Python HTTP server or deploy it directly to **GitHub Pages**.
```bash
cd tactical-interface
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```



## 🛠️ Technology Stack

* **Backend:** Python 3.10+, `httpx`, `polars`, `google-generativeai`, `geopy`
* **Edge Routing:** Cloudflare Workers, Cloudflare KV, Cloudflare Access (Zero Trust)
* **Frontend:** HTML5, CSS3 (Glassmorphism), JavaScript (ES6+), Web Workers
* **Visualization:** WebGL, Three.js, Globe.gl
* **CI/CD:** GitHub Actions



*This platform handles simulated and real-time open-source telemetry. Always verify automated threat assessments against official intelligence channels.*
