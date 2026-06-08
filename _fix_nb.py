
import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
nb_path = "C:/Users/tnigam/Desktop/Python EO/reports/EO_Report_Generator.ipynb"
nb = json.loads(open(nb_path, encoding="utf-8").read())
def _get(c): return c["source"] if isinstance(c["source"], str) else "".join(c["source"])

# Fix 1: paths
src10 = _get(nb["cells"][10])
old = "ROOT         = Path(".").resolve()
FEATURE_FILE = str(ROOT / "feature_file_eo_v7_unified.xlsx")
OUTPUT_DIR   = ROOT / "output"
DB_DIR       = ROOT / "tables_from_db""
new = "ROOT         = Path(".").resolve()
SOURCE_DIR   = ROOT.parent / "source"
FEATURE_FILE = str(SOURCE_DIR / "feature_file_eo_v7_unified.xlsx")
OUTPUT_DIR   = ROOT / "output"
DB_DIR       = SOURCE_DIR / "tables_from_db""
print("old found:", old in src10)
nb["cells"][10]["source"] = src10.replace(old, new)

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)
print("done")
