"""
direct_hierarchy_sensor_map.py
───────────────────────────────
Show exactly which hierarchy sensor IDs correspond to which pipeline attributes
by checking what's in the PEEO pi_tags sheet for each boiler's hierarchy sensors.

This reveals: the hierarchy HAS the right sensors, but under different PEEO names.
"""
import pandas as pd, sys
sys.stdout.reconfigure(encoding="utf-8")

HIDX = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv"
WB   = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\Boiler_PEEO_Tags.xlsx"
CFG  = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\boiler_pipeline\local_trigger\inputs\pipeline_input_configs.xlsx"

hier = pd.read_csv(HIDX)
pi   = pd.read_excel(WB, sheet_name="pi_tags")
sm   = pd.read_excel(CFG, sheet_name="Sensors_Mapping")

pi["pi_tags"]    = pi["pi_tags"].astype(str).str.strip()
pi["short name"] = pi["short name"].astype(str).str.strip()

h_pi = hier[hier["has_pi_sensor"]==True].copy()
h_pi["pi_sensors"] = h_pi["pi_sensors"].astype(str).str.strip()

# PEEO lookup
sensor_to_short = dict(zip(pi["pi_tags"], pi["short name"]))
sensor_to_val   = dict(zip(pi["pi_tags"], pi["value"]))

h_pi["peeo_short"] = h_pi["pi_sensors"].map(sensor_to_short).fillna("")
h_pi["peeo_value"] = h_pi["pi_sensors"].map(sensor_to_val)
h_pi["in_peeo"]    = h_pi["peeo_short"] != ""

# Filter to boiler-relevant sensors (by element_path keyword or attribute keyword)
boiler_kw = ["boiler","blr","furnace","steam","fuel","flue","stack","combustion",
              "desuperheater","bfw","cbd","economizer","arrazi","ambient","humidity","humidity"]
mask = h_pi["element_path"].str.lower().str.contains("|".join(boiler_kw), na=False) | \
       h_pi["attribute_name"].str.lower().str.contains("|".join(boiler_kw), na=False) | \
       h_pi["element_type"].str.lower().str.contains("|".join(boiler_kw), na=False)

boiler_h = h_pi[mask | h_pi["in_peeo"]].copy()

print("=== HIERARCHY SENSORS RELEVANT TO BOILER (incl. all with PEEO match) ===")
print(boiler_h[["element_path","element_type","attribute_name","pi_sensors","peeo_short","peeo_value"]].to_string(index=False))

# Pipeline Sensors_Mapping: what pipeline needs vs what PEEO has
print("\n=== PIPELINE Sensors_Mapping vs PEEO short names ===")
print("Pipeline attribute | Pipeline sensor_name | PEEO has it? | Notes")
sm["sensor_name"]  = sm["sensor_name"].astype(str).str.strip()
sm["attribute"]    = sm["attribute"].astype(str).str.strip()
sm["element_path"] = sm["element_path"].astype(str).str.strip()
short_set = set(pi["short name"])
for _, r in sm[sm["element_path"].isin(["BLR_1","plant","nan"])].iterrows():
    in_peeo = r["sensor_name"] in short_set
    sensor_id = dict(zip(pi["short name"], pi["pi_tags"])).get(r["sensor_name"], "")
    in_hier  = sensor_id in set(h_pi["pi_sensors"])
    print(f"  {r['element_path']:6} | {r['attribute']:25} | {r['sensor_name']:40} | in_PEEO={in_peeo} | sensor_id={sensor_id or 'N/A'} | in_hierarchy={in_hier}")
