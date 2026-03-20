import google.generativeai as genai
import json
import os
import polars as pl
from geopy.distance import geodesic

class CognitiveSieve:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-1.5-pro')

        # Get the directory where the script actually lives
        base_dir = os.path.dirname(os.path.abspath(__file__))
        orbat_path = os.path.join(base_dir, 'orbat_db.json')
        
        with open(orbat_path, 'r') as f:
            self.orbat = json.load(f)

    def calculate_proximity(self, event_lat, event_lng):
        closest_unit = "Unknown/Local"
        min_dist = float('inf')
        
        for unit in self.orbat['units']:
            unit_loc = (unit['last_known_coord']['lat'], unit['last_known_coord']['lng'])
            dist = geodesic((event_lat, event_lng), unit_loc).km
            if dist < unit['radius_km'] and dist < min_dist:
                min_dist = dist
                closest_unit = unit['designation']
        
        return closest_unit

    def process_intel(self, raw_data_path="latest_ingest.json"):
        with open(raw_data_path, 'r') as f:
            data = json.load(f)
        
        fused_intel = []
        for entry in data:
            prompt = f"Analyze this military OSINT: {entry['headline']}. Extract GPE (Geopolitical Entity) and rate threat 1-10. Format: JSON {{'gpe': 'name', 'score': int, 'intent': 'summary'}}"
            
            try:
                response = self.model.generate_content(prompt)
                # Clean the response to ensure it's valid JSON
                clean_json = response.text.replace('```json', '').replace('```', '').strip()
                analysis = json.loads(clean_json)
                
                # Manual entry for demonstration - in production, get lat/lng via geopy
                lat, lng = 0.0, 0.0 
                
                entry.update({
                    "gpe": analysis['gpe'],
                    "threat_score": analysis['score'],
                    "intent": analysis['intent'],
                    "adversary_unit": self.calculate_proximity(lat, lng)
                })
                fused_intel.append(entry)
            except Exception as e:
                print(f"AI Processing Error: {e}")

        with open('fused_state.json', 'w') as f:
            json.dump(fused_intel, f)

if __name__ == "__main__":
    sieve = CognitiveSieve()
    sieve.process_intel()
