"""
Match each SEU KPI to its inferred formula by INPUT-TAG FINGERPRINT.

For each KPI in the SEU export:
  inputs I = generic names (via PI_Database) of the KPI's mapped PI tags
For each inferred tag T:
  leaves L = transitive PI-DB leaves of T
Score by F1 of (I vs L): the KPI-level inferred tag is the one whose calculation
is built FROM the KPI's inputs (high recall) and not much else (high precision).

This is the user's method: the input-tag set identifies the calculation.
"""
from __future__ import annotations
import openpyxl
from collections import defaultdict
from pathlib import Path
from openpyxl import Workbook
from kpi_engine import KPIEngine

ROOT = Path(r"C:\Users\tnigam\Desktop\Python EO\Genric Pipeline\Data\source")
EXPORT = Path(r"C:\Users\tnigam\Downloads\system_kpis_all_2026-06-04 (2).xlsx")


def main():
    eng = KPIEngine(ROOT / "PI_Database_EO.xlsx", ROOT / "feature_file_eo_v9_unified.xlsx")
    pdb = openpyxl.load_workbook(ROOT / "PI_Database_EO.xlsx", data_only=True, read_only=True)["master_pi"]
    pi2name = {str(r[1]).strip(): str(r[0]).strip() for r in list(pdb.iter_rows(values_only=True))[1:] if r[1]}

    ex = openpyxl.load_workbook(EXPORT, data_only=True, read_only=True)["SEU KPIs"]
    rows = list(ex.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r and r[0] == "Plant")
    h = {v: i for i, v in enumerate(rows[hi]) if v}; ci = lambda k: h[k]

    # per (element,instance,kpi) -> set of generic input names
    kin = defaultdict(set)
    for r in rows[hi + 1:]:
        if not r or not r[ci("KPI Name")] or not r[ci("Element")]:
            continue
        key = (str(r[ci("Element")]).strip(), str(r[ci("Instance")]).strip(), str(r[ci("KPI Name")]).strip())
        if r[ci("PI Tag")]:
            for tok in str(r[ci("PI Tag")]).split():
                nm = pi2name.get(tok.strip())
                if nm:
                    kin[key].add(nm)

    # precompute leaves for all inferred tags (cache via engine)
    leafsets = {t: eng.leaves(t) for t in eng.formulas}

    import re
    def toks(s): return {x for x in re.split(r"[^a-z0-9]+", str(s).lower()) if x}
    CONCEPT = {  # KPI-name keyword -> tokens that the KPI-level tag should carry
        "efficiency": {"efficiency", "eff", "percent"}, "indirect": {"indirect"},
        "isentropic": {"isentropic", "efficiency", "percent"},
        "sec": {"sp_en", "spec_en", "sec"}, "fuel input": {"duty", "energy", "fuel"},
        "co2": {"co2"}, "power": {"power", "kw"}, "steam rate": {"steam", "rate"},
        "duty": {"duty", "energy"},
    }
    def concept_tokens(kpi):
        low = kpi.lower(); out = set()
        for k, v in CONCEPT.items():
            if all(w in low for w in k.split()): out |= v
        return out

    out = Workbook(); ws = out.active; ws.title = "kpi_by_inputs"
    ws.append(["Element", "Instance", "KPI", "BestTag", "Recall", "ConceptHit", "Value", "Confidence"])

    summary = defaultdict(lambda: {"n": 0, "high": 0})
    for (elem, inst, kpi), I in sorted(kin.items()):
        if not I:
            continue
        ctoks = concept_tokens(kpi)
        # candidates: tag uses most of the KPI's inputs AND resolves to a value
        cands = []
        for t, L in leafsets.items():
            rec = len(I & L) / len(I)
            if rec < 0.5:
                continue
            v = eng.eval(t)
            if v is None:
                continue
            chit = len(ctoks & toks(t)) > 0
            prec = len(I & L) / len(L) if L else 0
            cands.append((chit, prec, rec, t, v))
        if not cands:
            ws.append([elem, inst, kpi, None, 0, False, None, "none"]); summary[elem]["n"] += 1; continue
        # prefer concept-matching, then specificity (precision), then recall
        cands.sort(key=lambda x: (x[0], x[1], x[2]), reverse=True)
        chit, prec, rec, tag, val = cands[0]
        conf = "HIGH" if chit else "low (no concept-tag; likely intermediate/needs composition)"
        ws.append([elem, inst, kpi, tag, round(rec, 2), chit,
                   round(val, 3) if isinstance(val, float) else val, conf])
        s = summary[elem]; s["n"] += 1
        if chit:
            s["high"] += 1

    out.save(ROOT / "KPI_By_InputFingerprint.xlsx")
    print(f"{'Equipment':<32}{'KPIs':>6}{'HIGH-confidence (input+concept)':>32}")
    for e, s in sorted(summary.items()):
        print(f"{e:<32}{s['n']:>6}{s['high']:>32}")
    print(f"\nWrote {ROOT / 'KPI_By_InputFingerprint.xlsx'}")


if __name__ == "__main__":
    main()
