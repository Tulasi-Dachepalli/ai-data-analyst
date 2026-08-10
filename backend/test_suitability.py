import sys
import os
import json
import pandas as pd
import traceback

# Add python_service path to import detector module
sys.path.append(os.path.abspath("../python_service"))

from forecasting.detector import analyze_forecasting_suitability

def main():
    print("Loading temp_dataset.json...")
    with open("temp_dataset.json", "r") as f:
        data = json.load(f)
    
    rows = data.get("rows", [])
    print(f"Loaded {len(rows)} rows.")
    
    df = pd.DataFrame(rows)
    
    print("Running suitability analysis...")
    try:
        results = analyze_forecasting_suitability(df)
        print("\n🟢 SUCCESS! Suitability analysis completed successfully:")
        print(json.dumps(results, indent=2))
    except Exception as e:
        print("\n🔴 FAILED! Python suitability analysis threw an exception:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
