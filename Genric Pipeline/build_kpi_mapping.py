"""
Build the KPI -> inferred-tag MAPPING SHEET (intelligent matching).

For every UI KPI in the SEU export, find the inferred tag that computes it by
scoring all 4269 inferred tags on four signals:
  1. input-overlap  : tag's dependency leaves vs the KPI's mapped PI inputs
  2. concept tokens  : KPI-name keywords (efficiency/SEC/CO2/...) vs tag-name tokens
  3. category        : inferred `Category` column vs the KPI concept
  4. instance        : tag references the right instance (number/letter/heater idx)

Then verify each match resolves through EO_PI_Database (value computes, no missing leaves).

Output: Data/source/KPI_Inferred_Mapping.xlsx
"""
from __future__ import annotations
import re, openpyxl
from collections import defaultdict
from pathlib import Path
from openpyxl import Workbook
from kpi_engine import KPIEngine, REF

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
EXPORT = Path(r"C:\Users\tnigam\Downloads\system_kpis_all_2026-06-04 (2).xlsx")

# KPI concept -> token set that should appear in the matching tag name/category
CONCEPTS = {
    "indirect efficiency": {"efficiency", "eff", "indirect", "net_efficiency", "net"},
    "thermal efficiency":  {"efficiency", "eff", "thermal", "net_efficiency"},
    "isentropic efficiency": {"isentropic", "efficiency", "eff"},
    "boiler efficiency":   {"efficiency", "eff", "boiler"},
    "sec":                 {"sp_en", "sec", "specific", "spec_en"},
    "fuel input":          {"duty", "fuel", "energy", "input", "fired"},
    "co2 emissions":       {"co2", "carbon", "emiss", "formed", "load"},
    "co2":                 {"co2", "carbon", "emiss", "formed"},
    "delivered power":     {"power", "delivered", "kw", "shaft"},
    "exhaust stage power": {"power", "exhaust", "stage"},
    "condensing stage power": {"power", "condensing", "stage"},
    "extraction stage power": {"power", "extraction", "stage"},
    "condensing stage efficiency": {"efficiency", "eff", "condensing"},
    "extraction stage efficiency": {"efficiency", "eff", "extraction"},
    "steam rate":          {"steam", "rate", "steam_rate"},
    "duty":                {"duty", "heat", "energy"},
    "heat recovered":      {"duty", "heat", "recovered", "energy"},
    "power":               {"power", "kw"},
}


# equipment -> substrings that appear in that equipment's inferred tag names
EQUIP_SUBS = {
    "Furnace":                       ["furn", "_h_111", "cracker"],
    "Fuel Fired Boiler":             ["boiler", "blr", "_bo_71", "fd_fan"],
    "Backpressure Turbine":          ["turbine", "bfw_", "_bac", "air_compressor_turb", "cw_turb", "fd_turb", "dmw_turb"],
    "Extraction-Condensing Turbine": ["turbine", "cgc", "extraction", "condensing", "_ect"],
    "Steam Exchanger":               ["exchanger", "_shx", "reboiler", "_to_c_", "_to_e_"],
    "Feed Preheater":                ["preheat", "fph", "feed_preheat", "saturator"],
}


def tokens(s: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", str(s).lower()) if t}


def concept_tokens(kpi_name: str) -> set[str]:
    low = kpi_name.lower()
    best = set()
    for key, toks in CONCEPTS.items():
        if all(w in low for w in key.split()):
            best |= toks
    return best or tokens(kpi_name)


def instance_keys(instance: str) -> set[str]:
    """Possible instance identifiers a tag might use: number, letter, A/B..."""
    m = re.search(r"\b([a-z])\b\s*$", instance.lower())
    keys = set()
    if m:
        letter = m.group(1)
        num = ord(letter) - ord("a") + 1
        keys |= {letter, letter.upper(), str(num), f"_{letter}_", f"_{letter.upper()}_"}
        keys |= {str(1110 + num), str(100 + num), str(num).zfill(2)}  # heater-style indices
    return keys


def load_export():
    wb = openpyxl.load_workbook(EXPORT, data_only=True, read_only=True)["SEU KPIs"]
    rows = list(wb.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r and r[0] == "Plant")
    h = {v: i for i, v in enumerate(rows[hi]) if v}
    ci = lambda k: h[k]
    kpis = defaultdict(lambda: {"inputs": set()})
    for r in rows[hi + 1:]:
        if not r or not r[ci("KPI Name")] or not r[ci("Element")]:
            continue
        key = (str(r[ci("Plant")]).strip(), str(r[ci("Element")]).strip(),
               str(r[ci("Instance")]).strip(), str(r[ci("KPI Name")]).strip())
        if r[ci("PI Tag")]:
            for tok in str(r[ci("PI Tag")]).split():
                kpis[key]["inputs"].add(tok.strip())
    return kpis


def main():
    eng = KPIEngine(ROOT / "PI_Database_EO.xlsx", ROOT / "feature_file_eo_v9_unified.xlsx")
    # category map
    cwb = openpyxl.load_workbook(ROOT / "feature_file_eo_v9_unified.xlsx", data_only=True, read_only=True)["inferred"]
    cat = {str(r[0]).strip(): str(r[2]) for r in list(cwb.iter_rows(values_only=True))[1:] if r[0]}
    pidb = openpyxl.load_workbook(ROOT / "PI_Database_EO.xlsx", data_only=True, read_only=True)["master_pi"]
    pi2name = {str(r[1]).strip(): str(r[0]).strip() for r in list(pidb.iter_rows(values_only=True))[1:] if r[1]}

    tag_tokens = {t: tokens(t) | tokens(cat.get(t, "")) for t in eng.formulas}
    kpis = load_export()

    out = Workbook(); ws = out.active; ws.title = "kpi_mapping"
    ws.append(["Plant", "Element", "Instance", "KPI Name", "Matched Inferred Tag",
               "Score", "Value", "Resolves", "InputCoverage", "MissingLeaves"])

    for (plant, elem, inst, kpi), info in sorted(kpis.items()):
        inputs = {pi2name[t] for t in info["inputs"] if t in pi2name}
        ctoks = concept_tokens(kpi)
        ikeys = instance_keys(inst)
        subs = EQUIP_SUBS.get(elem, [])
        def has_equip(t):
            return any(s in t.lower() for s in subs)
        # 1) equipment family, 2) shares an input, 3) GATE on concept token present
        pool = [t for t in eng.formulas if has_equip(t)] or list(eng.formulas)
        pool = [t for t in pool if eng.leaves(t) & inputs]
        concept_pool = [t for t in pool if ctoks & tag_tokens[t]]
        pool = concept_pool or pool
        best = (-1, None)
        for tag in pool:
            cov = len(eng.leaves(tag) & inputs) / max(len(inputs), 1)
            concept = len(ctoks & tag_tokens[tag]) / max(len(ctoks), 1)
            inst_hit = 1.0 if (ikeys & tokens(tag)) else 0.0
            score = 3.0 * concept + 1.0 * cov + 2.0 * inst_hit
            if score > best[0]:
                best = (score, tag)
        score, tag = best
        val = eng.eval(tag) if tag else None
        miss = len(eng.leaves(tag) - set(eng.values)) if tag else 0
        cov = len((eng.leaves(tag) & inputs)) / max(len(inputs), 1) if tag else 0
        ws.append([plant, elem, inst, kpi, tag, round(score, 2),
                   round(val, 3) if isinstance(val, float) else val,
                   "Y" if (val is not None and miss == 0) else "N",
                   round(cov, 2), miss])

    out.save(ROOT / "KPI_Inferred_Mapping.xlsx")
    print(f"Wrote {ROOT / 'KPI_Inferred_Mapping.xlsx'}  ({len(kpis)} KPIs mapped)")


if __name__ == "__main__":
    main()
