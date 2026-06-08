import pandas as pd, sys
sys.stdout.reconfigure(encoding="utf-8")

HIDX = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source\_hierarchy_index.csv"
WB   = r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\Boiler_PEEO_Tags.xlsx"

hier = pd.read_csv(HIDX)
pi   = pd.read_excel(WB, sheet_name="pi_tags")

# All hierarchy sensors with PI
h_pi = hier[hier["has_pi_sensor"]==True][["element_path","element_type","attribute_name","pi_sensors","uom"]].copy()
h_pi["pi_sensors"] = h_pi["pi_sensors"].astype(str).str.strip()

# PEEO lookup: sensor_id -> (short_name, value)
pi["pi_tags"]    = pi["pi_tags"].astype(str).str.strip()
pi["short name"] = pi["short name"].astype(str).str.strip()
sensor_to_short  = dict(zip(pi["pi_tags"], pi["short name"]))
sensor_to_val    = dict(zip(pi["pi_tags"], pi["value"]))

# Enrich hierarchy with PEEO data
h_pi["peeo_short_name"] = h_pi["pi_sensors"].map(sensor_to_short).fillna("NOT_IN_PEEO")
h_pi["peeo_value"]      = h_pi["pi_sensors"].map(sensor_to_val)
h_pi["in_peeo"]         = h_pi["peeo_short_name"] != "NOT_IN_PEEO"

print("=== FULL HIERARCHY with PEEO sensor lookup ===")
print(h_pi.to_string(index=False))

print(f"\nTotal hierarchy PI sensors : {len(h_pi)}")
print(f"Found in PEEO pi_tags      : {h_pi['in_peeo'].sum()}")
print(f"NOT in PEEO                : {(~h_pi['in_peeo']).sum()}")
