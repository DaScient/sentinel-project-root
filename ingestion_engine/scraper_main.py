import asyncio
import httpx
import polars as pl
from datetime import datetime
import xml.etree.ElementTree as ET
import os

class SentinelScraper:
    def __init__(self):
        self.headers = {"User-Agent": "Sentinel-Nexus-Bot/1.0"}
        self.results = []

    async def fetch_rss(self, client, url):
        try:
            resp = await client.get(url, timeout=10)
            if resp.status_code == 200:
                root = ET.fromstring(resp.text)
                for item in root.findall('.//item'):
                    self.results.append({
                        "timestamp": datetime.now().isoformat(),
                        "source": url,
                        "headline": item.find('title').text,
                        "raw_text": item.find('description').text if item.find('description') is not None else "",
                        "category": "RSS_FEED"
                    })
        except Exception as e:
            print(f"Error fetching RSS {url}: {e}")

    async def fetch_nasa_firms(self, client, api_key):
        # Placeholder for real NASA FIRMS endpoint
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{api_key}/VIIRS_SNPP_NRT/world/1"
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                # Polars can read CSV strings directly
                df_firms = pl.read_csv(resp.content)
                # Map FIRMS data to our schema
                for row in df_firms.to_dicts()[:20]: # Cap at 20 most recent
                    self.results.append({
                        "timestamp": datetime.now().isoformat(),
                        "source": "NASA_FIRMS",
                        "headline": f"Thermal Anomaly detected at {row['latitude']}, {row['longitude']}",
                        "raw_text": str(row),
                        "category": "KINETIC_SIGNAL"
                    })
        except Exception as e:
            print(f"FIRMS Error: {e}")

    async def run(self):
        async with httpx.AsyncClient(headers=self.headers) as client:
            tasks = [
                self.fetch_rss(client, "https://feeds.bbci.co.uk/news/world/rss.xml"),
                self.fetch_nasa_firms(client, os.getenv("NASA_FIRMS_KEY", "DEMO_KEY"))
            ]
            await asyncio.gather(*tasks)
            
            df = pl.DataFrame(self.results)
            df.write_json("latest_ingest.json")
            return df

if __name__ == "__main__":
    scraper = SentinelScraper()
    asyncio.run(scraper.run())
