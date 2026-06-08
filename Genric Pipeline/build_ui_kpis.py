"""
Output ONLY the KPIs defined in the SEU sheet (system_kpis_all export).

Takes the unique (Plant, Network, Element, Instance, KPI Name) from the export and
computes each via the right source through the one generic engine:
  Furnace / Boiler  -> curated map (kpi_map)
  Turbines          -> composed / named-inferred (seu_mappings)
  Steam Exchanger   -> SQL registry duty
Anything without a formula is left blank with status MAPPED_NO_FORMULA.

Output: Data/source/SEU_Sheet_KPIs.xlsx
"""
from __future__ import annotations
import re, openpyxl
from string import ascii_lowercase
from pathlib import Path
from openpyxl import Workbook
from seu_engine import SEUEngine
import seu_mappings as M
import kpi_map as KM

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
EXPORT = Path(r"C:\Users\tnigam\Downloads\system_kpis_all_2026-06-04 (2).xlsx")
OUT = ROOT / "SEU_Sheet_KPIs.xlsx"


def _norm(s):                       # normalise (CO₂ -> co2, strip non-alnum)
    return re.sub(r"[^a-z0-9]+", "", str(s).lower().replace("₂", "2"))


def letter_idx(instance):
    t = instance.strip().split()[-1]
    return (ascii_lowercase.index(t) + 1) if len(t) == 1 and t in ascii_lowercase else None


def main():
    se = SEUEngine(); M.apply(se)

    # SQL exchanger duties (by registry unit) for Steam Exchanger duty KPIs
    exch_duty = {r["seu_name"]: se.eval_expr(r.get("actual_duty_expression_gjph", ""))
                 for r in se.seus if r["seu_category"] in ("Exchanger", "Reboiler")}

    # curated metric lookup (normalised label -> tag spec) for furnace/boiler
    cur = {}
    for equip in ("Furnace", "Fuel Fired Boiler"):
        for lbl, vs in KM.CURATED[equip]["kpis"].items():
            cur[(equip, _norm(lbl))] = vs

    def resolve(plant, elem, inst, kpi):
        metric = kpi.split(" - ")[-1]
        # Furnace / Boiler -> curated
        idx = letter_idx(inst)
        if elem in ("Furnace", "Fuel Fired Boiler") and idx:
            vs = cur.get((elem, _norm(metric)))
            if vs is not None:
                v, src = KM.value_for(se.eng, vs, idx)
                return v, src or "curated"
        # Turbines -> composed / named
        if "Turbine" in elem:
            tag = M.turbine_tag(plant, inst, metric)
            if tag:
                return se.eng.eval(tag), f"tag:{tag}"
        # Steam Exchanger duty: registry HAS the formulas, but each UI instance must be
        # tied to a specific E-xxxx unit first (per-instance identity not yet confirmed).
        # Left blank to avoid assigning one duty to all — honest over false coverage.
        return None, ""

    # unique UI KPIs
    ws = openpyxl.load_workbook(EXPORT, data_only=True, read_only=True)["SEU KPIs"]
    rows = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r and r[0] == "Plant")
    h = {v: i for i, v in enumerate(rows[hi]) if v}; ci = lambda k: h[k]
    seen = set(); uniq = []
    for r in rows[hi + 1:]:
        if not r or not r[ci("KPI Name")] or not r[ci("Element")]:
            continue
        key = (str(r[ci("Plant")]).strip(), str(r[ci("Network")]).strip(),
               str(r[ci("Element")]).strip(), str(r[ci("Instance")]).strip(),
               str(r[ci("KPI Name")]).strip())
        if key not in seen:
            seen.add(key); uniq.append(key)

    out = Workbook(); o = out.active; o.title = "seu_sheet_kpis"
    o.append(["Plant", "Network", "Element", "Instance", "KPI Name", "Value", "Source", "Status"])
    n_val = 0
    for plant, net, elem, inst, kpi in uniq:
        v, src = resolve(plant, elem, inst, kpi)
        if v is not None:
            n_val += 1
        o.append([plant, net, elem, inst, kpi,
                  round(v, 3) if isinstance(v, float) else v, src,
                  "CALCULATED" if v is not None else "no formula"])
    out.save(OUT)
    print(f"Wrote {OUT}")
    print(f"  unique UI KPIs: {len(uniq)} | calculated: {n_val} | blank: {len(uniq) - n_val}")
    # per-element
    from collections import defaultdict
    agg = defaultdict(lambda: [0, 0])
    for plant, net, elem, inst, kpi in uniq:
        v, _ = resolve(plant, elem, inst, kpi)
        agg[elem][0] += 1; agg[elem][1] += (v is not None)
    print("\n  per element (calculated/total):")
    for e, (t, c) in sorted(agg.items()):
        print(f"    {e:<32}{c}/{t}")


if __name__ == "__main__":
    main()
