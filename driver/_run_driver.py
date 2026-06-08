"""Standalone runner for the all-scenarios driver — same logic as the notebook,
runnable from CLI for background execution.

Usage:
  python _run_driver.py baseline power_high fuel_low fuel_10x infeas_3_boilers
  python _run_driver.py --skip-post baseline    # smoke test, optimizer only

Outputs land in scenario_runs/<scenario>/ ; combined report at root.
"""
from __future__ import annotations
import sys, json, shutil, subprocess, time, traceback, argparse
from pathlib import Path
from datetime import datetime
import nbformat
from nbconvert.preprocessors import ExecutePreprocessor

try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

ROOT            = Path(__file__).parent.resolve()
OPT_NB_SRC      = ROOT / 'Optimizer_MINLP.ipynb'
POST_SCRIPT     = ROOT / 'post_process_outputs.py'
RUNS_DIR        = ROOT / 'scenario_runs'
PARAMS_FILE     = ROOT / '_scenario_params.json'
EXECUTE_TIMEOUT = 2700
RUNS_DIR.mkdir(exist_ok=True)

_BASELINE = {'Power_Rate': 13.334, 'Fuel_Rate': 2.04, 'DMW_Rate': 7.34 / 3.75}
_ALL_TURBINES = [
    'BFW_B_Turb_Status', 'BFW_C_Turb_Status', 'BFW_E_Turb_Status',
    'VHP_BFW_B_Turb_Status', 'VHP_BFW_C_Turb_Status',
    'CW_Turbine_A_Status', 'CW_Turbine_B_Status', 'CW_Turbine_G_Status',
    'Air_Compressor_Turbine_A_Status', 'Air_Compressor_Turbine_D_Status',
    'DMW_Turbine_A_Status', 'DMW_Turbine_C_Status',
]
SCENARIO_CONFIGS = {
    'baseline':    {'prices': dict(_BASELINE), 'bound_patches': [], 'description': 'Baseline'},
    'power_low':   {'prices': {**_BASELINE, 'Power_Rate': _BASELINE['Power_Rate']*0.85}, 'bound_patches': []},
    'power_high':  {'prices': {**_BASELINE, 'Power_Rate': _BASELINE['Power_Rate']*1.15}, 'bound_patches': []},
    'power_vhigh': {'prices': {**_BASELINE, 'Power_Rate': _BASELINE['Power_Rate']*1.30}, 'bound_patches': []},
    'power_vlow':  {'prices': {**_BASELINE, 'Power_Rate': _BASELINE['Power_Rate']*0.70}, 'bound_patches': []},
    'fuel_low':    {'prices': {**_BASELINE, 'Fuel_Rate':  _BASELINE['Fuel_Rate']*0.85}, 'bound_patches': []},
    'fuel_high':   {'prices': {**_BASELINE, 'Fuel_Rate':  _BASELINE['Fuel_Rate']*1.15}, 'bound_patches': []},
    'fuel_vhigh':  {'prices': {**_BASELINE, 'Fuel_Rate':  _BASELINE['Fuel_Rate']*1.30}, 'bound_patches': []},
    'fuel_vlow':   {'prices': {**_BASELINE, 'Fuel_Rate':  _BASELINE['Fuel_Rate']*0.70}, 'bound_patches': []},
    'dmw_low':     {'prices': {**_BASELINE, 'DMW_Rate':   _BASELINE['DMW_Rate']*0.85}, 'bound_patches': []},
    'dmw_high':    {'prices': {**_BASELINE, 'DMW_Rate':   _BASELINE['DMW_Rate']*1.15}, 'bound_patches': []},
    'fuel_10x':    {'prices': {**_BASELINE, 'Fuel_Rate': _BASELINE['Fuel_Rate']*10.0}, 'bound_patches': [],
                    'description': 'Stress: Fuel at 10x'},
    'negative_power': {'prices': {**_BASELINE, 'Power_Rate': -5.0}, 'bound_patches': [],
                    'description': 'Stress: grid pays plant'},
    'power_40':      {'prices': {**_BASELINE, 'Power_Rate': 40.0}, 'bound_patches': [],
                    'description': 'Power rate at $40/MWh (~3x baseline)'},
    'power_50':      {'prices': {**_BASELINE, 'Power_Rate': 50.0}, 'bound_patches': [],
                    'description': 'Power rate at $50/MWh (~3.75x baseline)'},
    'power_55':      {'prices': {**_BASELINE, 'Power_Rate': 55.0}, 'bound_patches': [],
                    'description': 'Power rate at $55/MWh (~4.1x baseline)'},
    'power_60':      {'prices': {**_BASELINE, 'Power_Rate': 60.0}, 'bound_patches': [],
                    'description': 'Power rate at $60/MWh (~4.5x baseline)'},
    'power_100':     {'prices': {**_BASELINE, 'Power_Rate': 100.0}, 'bound_patches': [],
                    'description': 'Power rate at $100/MWh (~7.5x baseline)'},
    'power_200':     {'prices': {**_BASELINE, 'Power_Rate': 200.0}, 'bound_patches': [],
                    'description': 'Power rate at $200/MWh (~15x baseline)'},
    'power_500':     {'prices': {**_BASELINE, 'Power_Rate': 500.0}, 'bound_patches': [],
                    'description': 'Power rate at $500/MWh (~37.5x baseline)'},
    'power_350':     {'prices': {**_BASELINE, 'Power_Rate': 350.0}, 'bound_patches': [],
                    'description': 'Power rate at $350/MWh'},
    'power_400':     {'prices': {**_BASELINE, 'Power_Rate': 400.0}, 'bound_patches': [],
                    'description': 'Power rate at $400/MWh'},
    'infeas_3_boilers': {'prices': dict(_BASELINE),
        'bound_patches': [{'tag_name': f'BLR_{i}_Status', 'lower': 0.0, 'upper': 0.0} for i in (1,2,3)],
        'description': 'Infeasibility: BLR_1/2/3 forced offline'},
    'infeas_all_turbines': {'prices': dict(_BASELINE),
        'bound_patches': [{'tag_name': t, 'lower': 0.0, 'upper': 0.0} for t in _ALL_TURBINES],
        'description': 'Infeasibility: all turbines off'},
    'infeas_1_boiler': {'prices': dict(_BASELINE),
        'bound_patches': [{'tag_name': 'Total_Boilers_Running', 'lower': 1.0, 'upper': 1.0}],
        'description': 'Infeasibility: 1 boiler'},
}

INJECTION_CELL_SRC = r'''# ── SCENARIO PARAM INJECTION (driver-inserted) ─────────────────────────────
import json as _json, os as _os
_PP = _os.path.join(_os.getcwd(), '_scenario_params.json')
if _os.path.exists(_PP):
    with open(_PP, 'r', encoding='utf-8') as _f: _PARAMS = _json.load(_f)
    print(f'  >>> SCENARIO INJECTION: {_PARAMS.get("scenario","?")}')
    # Prices live in the 'inferred' sheet as literal-number formulas
    # (e.g. Power_Rate.formula_expression = '13.334000'). Patch those.
    _BFR=2.04; _FCB=2.15
    _prices = _PARAMS.get('prices') or {}
    if _prices:
        _df_inf = cfg['inferred']
        for _tag, _val in _prices.items():
            _m = _df_inf['tag_name'].astype(str).str.strip() == _tag
            if not _m.any():
                print(f'    skip price (tag missing in inferred): {_tag}')
                continue
            _df_inf.loc[_m, 'formula_expression'] = f'{float(_val):.6f}'
        # Recompute Fuel_Cost_in_MMBTU consistent with EO_Report_Generator
        if 'Fuel_Rate' in _prices:
            _fcm = _prices['Fuel_Rate'] * _FCB / _BFR
            _m = _df_inf['tag_name'].astype(str).str.strip() == 'Fuel_Cost_in_MMBTU'
            if _m.any():
                _df_inf.loc[_m, 'formula_expression'] = f'{float(_fcm):.6f}'
        cfg['inferred'] = _df_inf
        print(f'    prices applied via inferred-formula override: {_prices}')
    _patches = _PARAMS.get('bound_patches') or []
    if _patches:
        _df_v = cfg['variables']; _n=0
        for _p in _patches:
            _t = _p.get('tag_name','')
            _m = _df_v['tag_name'].astype(str).str.strip() == _t
            if not _m.any():
                print(f'    skip (tag missing): {_t}'); continue
            if _p.get('lower') is not None:
                _lo = float(_p['lower'])
                _df_v.loc[_m,'lower_bound_value']=_lo
                _df_v.loc[_m,'lower_bound_expression']=f'{_lo}'
            if _p.get('upper') is not None:
                _up = float(_p['upper'])
                _df_v.loc[_m,'upper_bound_value']=_up
                _df_v.loc[_m,'upper_bound_expression']=f'{_up}'
            _n+=1
        cfg['variables']=_df_v
        print(f'    bound patches: {_n}/{len(_patches)}')
else:
    print('  >>> No _scenario_params.json — running canonical')
'''

def _find_ingestion(nb):
    for i,c in enumerate(nb.cells):
        if c.cell_type!='code': continue
        s = ''.join(c.source) if isinstance(c.source,list) else c.source
        if 'TASK 1' in s and 'DATA INGESTION' in s: return i
    raise RuntimeError('ingestion cell not found')

def prepare_optimizer_nb(scenario_dir: Path) -> Path:
    nb = nbformat.read(str(OPT_NB_SRC), as_version=4)
    inj = nbformat.v4.new_code_cell(source=INJECTION_CELL_SRC); inj.metadata={}
    nb.cells.insert(_find_ingestion(nb)+1, inj)
    out = scenario_dir/'optimizer.ipynb'
    nbformat.write(nb, str(out))
    return out

def _latest(pat):
    ps = sorted(ROOT.glob(pat), key=lambda p:p.stat().st_mtime, reverse=True)
    return ps[0] if ps else None

def _snapshot(scenario_dir: Path, started: float):
    captured={}
    p = _latest('output/*_output_v3.xlsx')
    if p and p.stat().st_mtime>=started:
        d=scenario_dir/p.name; shutil.copy2(p,d); captured['optimizer_xlsx']=str(d)
    csv_dir = ROOT/'tables_from_db'/'outputs'
    if csv_dir.exists():
        sub=scenario_dir/'tables_from_db_outputs'; sub.mkdir(exist_ok=True)
        for csv in csv_dir.glob('*.csv'):
            if csv.stat().st_mtime>=started: shutil.copy2(csv, sub/csv.name)
        captured['csv_dir']=str(sub)
    for pat in ('step_validation_*.xlsx','python_vs_db_parity_*.xlsx',
                'optimizer_qc_report_*.xlsx','run_metadata_*.json'):
        p=_latest(pat)
        if p and p.stat().st_mtime>=started:
            shutil.copy2(p, scenario_dir/p.name)
            captured.setdefault('reports',[]).append(p.name)
    return captured

def _parse_model_output(scenario_dir: Path):
    import pandas as pd
    out={'baseline_obj':float('nan'),'optimum_obj':float('nan'),
         'saving':float('nan'),'saving_pct':float('nan'),'objective_tag':None,
         'switchover_count':0,'switchovers':[]}
    csv = scenario_dir/'tables_from_db_outputs'/'model_output.csv'
    if not csv.exists(): return out
    try:
        df = pd.read_csv(csv)
        # try to merge tag names from tag.csv if present
        tag_csv = ROOT/'tables_from_db'/'tag.csv'
        if 'tag_name' not in df.columns and tag_csv.exists():
            tdf = pd.read_csv(tag_csv)
            if {'tag_id','tag_name'}.issubset(tdf.columns):
                df = df.merge(tdf[['tag_id','tag_name']], on='tag_id', how='left')
        if {'actual','optimum'}.issubset(df.columns):
            if 'tag_name' in df.columns:
                # Prefer the canonical 'Objective_2' tag from feature_file objective sheet
                obj2 = df[df['tag_name'].astype(str) == 'Objective_2']
                if not obj2.empty:
                    row = obj2.iloc[0]
                    out['objective_tag']='Objective_2'
                    out['baseline_obj']=float(row['actual']); out['optimum_obj']=float(row['optimum'])
                else:
                    cand = df[df['tag_name'].astype(str).str.contains('Objective', case=False, na=False)]
                    if not cand.empty:
                        row = cand.iloc[cand['actual'].abs().argmax()]
                        out['objective_tag']=str(row['tag_name'])
                        out['baseline_obj']=float(row['actual']); out['optimum_obj']=float(row['optimum'])
            if pd.isna(out['baseline_obj']):
                row = df.iloc[df['actual'].abs().fillna(0).argmax()]
                out['baseline_obj']=float(row.get('actual',float('nan')))
                out['optimum_obj']=float(row.get('optimum',float('nan')))
            # Switchovers: count *_Status tags where round(actual)!=round(optimum)
            if 'tag_name' in df.columns:
                stat = df[df['tag_name'].astype(str).str.endswith('_Status')]
                stat = stat.dropna(subset=['actual','optimum'])
                sw=[]
                for _,r in stat.iterrows():
                    a=int(round(float(r['actual']))); o=int(round(float(r['optimum'])))
                    if a!=o: sw.append({'tag':r['tag_name'],'actual':a,'optimum':o,
                                        'direction':'ON' if o>a else 'OFF'})
                out['switchovers']=sw; out['switchover_count']=len(sw)
        if not (pd.isna(out['baseline_obj']) or pd.isna(out['optimum_obj'])):
            sv=out['baseline_obj']-out['optimum_obj']; out['saving']=sv
            if abs(out['baseline_obj'])>1e-6: out['saving_pct']=sv/out['baseline_obj']*100
    except Exception as e:
        out['parse_error']=str(e)
    return out

def run_scenario(name: str, skip_post: bool=False) -> dict:
    cfg_s = SCENARIO_CONFIGS[name]
    sdir = RUNS_DIR/name; sdir.mkdir(exist_ok=True)
    started = time.time()
    print(f'\n{"#"*72}\n# SCENARIO: {name}\n#   prices={cfg_s["prices"]}')
    if cfg_s.get('bound_patches'): print(f'#   bound_patches={len(cfg_s["bound_patches"])}')
    print('#'*72)
    PARAMS_FILE.write_text(json.dumps({'scenario':name,'prices':cfg_s['prices'],
        'bound_patches':cfg_s.get('bound_patches',[])}, indent=2), encoding='utf-8')
    nb_path = prepare_optimizer_nb(sdir)
    print(f'  patched optimizer: {nb_path.relative_to(ROOT)}')
    t0=time.time(); opt_status='ok'
    try:
        nb = nbformat.read(str(nb_path), as_version=4)
        ep = ExecutePreprocessor(timeout=EXECUTE_TIMEOUT, kernel_name='python3')
        ep.preprocess(nb, {'metadata':{'path':str(ROOT)}})
        nbformat.write(nb, str(nb_path))
        print(f'  optimizer OK ({round(time.time()-t0,1)}s)')
    except Exception as e:
        opt_status='failed'
        print(f'  optimizer FAILED ({round(time.time()-t0,1)}s): {e}')
        try: nbformat.write(nb, str(nb_path))
        except Exception: pass
    opt_seconds = round(time.time()-t0,1)
    post_status='skipped'; post_seconds=0.0
    if not skip_post:
        t1=time.time()
        try:
            r = subprocess.run([sys.executable, str(POST_SCRIPT)], cwd=str(ROOT),
                               capture_output=True, text=True, timeout=900)
            post_seconds=round(time.time()-t1,1)
            if r.returncode==0:
                post_status='ok'; print(f'  post_process OK ({post_seconds}s)')
            else:
                post_status='failed'
                print(f'  post_process FAILED rc={r.returncode}: {(r.stderr or "")[-500:]}')
        except subprocess.TimeoutExpired:
            post_status='timeout'; post_seconds=round(time.time()-t1,1)
            print(f'  post_process TIMEOUT')
        except Exception as e:
            post_status='error'; print(f'  post_process ERROR: {e}')
    captured=_snapshot(sdir, started)
    parsed=_parse_model_output(sdir)
    try: PARAMS_FILE.unlink()
    except FileNotFoundError: pass
    res = {'scenario':name,'description':cfg_s.get('description',''),
           'power_rate':cfg_s['prices'].get('Power_Rate'),
           'fuel_rate':cfg_s['prices'].get('Fuel_Rate'),
           'dmw_rate':cfg_s['prices'].get('DMW_Rate'),
           'n_bound_patches':len(cfg_s.get('bound_patches',[])),
           'optimizer_status':opt_status,'optimizer_seconds':opt_seconds,
           'post_status':post_status,'post_seconds':post_seconds,
           'captured':captured, **parsed,'scenario_dir':str(sdir)}
    # write a per-scenario result.json for resilience
    (sdir/'result.json').write_text(json.dumps(res,default=str,indent=2),encoding='utf-8')
    print(f'  baseline=${parsed["baseline_obj"]:.2f}  optimum=${parsed["optimum_obj"]:.2f}  '
          f'saving=${parsed["saving"]:.2f}  switchovers={parsed["switchover_count"]}')
    return res

def write_combined(results, errors):
    import xlsxwriter
    ts=datetime.now().strftime('%Y%m%d_%H%M%S')
    path = ROOT/f'eo_all_scenarios_{ts}.xlsx'
    wb = xlsxwriter.Workbook(str(path))
    f=lambda d:wb.add_format(d)
    F={'title':f({'bold':1,'font_size':16,'font_color':'#1F3864'}),
       'header':f({'bold':1,'bg_color':'#D6E4F0','border':1,'align':'center'}),
       'label':f({'bold':1,'bg_color':'#F2F2F2','border':1}),
       'text':f({'border':1}),'value':f({'border':1,'num_format':'#,##0.00'}),
       'value4':f({'border':1,'num_format':'#,##0.0000'}),
       'pct':f({'border':1,'num_format':'0.00%'}),'int':f({'border':1,'num_format':'0'}),
       'green':f({'bold':1,'bg_color':'#E2EFDA','font_color':'#375623','border':1,'num_format':'#,##0.00'}),
       'red':f({'bold':1,'bg_color':'#FCE4D6','font_color':'#9C0006','border':1,'num_format':'#,##0.00'}),
       'note':f({'italic':1,'font_color':'#595959','font_size':9})}
    ws=wb.add_worksheet('Summary')
    ws.set_column(0,0,20); ws.set_column(1,1,30); ws.set_column(2,15,14)
    ws.write(0,0,'EO All-Scenarios Driver — Summary',F['title'])
    ws.write(1,0,f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}',F['note'])
    cols=['Scenario','Description','Opt','Post','Power','Fuel','DMW',
          'Baseline $/hr','Optimum $/hr','Saving $/hr','Saving %','Annual $M/yr',
          'Switchovers','Opt sec','Post sec']
    for c,h in enumerate(cols): ws.write(3,c,h,F['header'])
    r=4
    for res in results:
        ws.write(r,0,res.get('scenario',''),F['label'])
        ws.write(r,1,res.get('description',''),F['text'])
        os_=str(res.get('optimizer_status','?'))
        ws.write(r,2,os_, F['green'] if os_=='ok' else F['red'])
        ws.write(r,3,str(res.get('post_status','?')),F['text'])
        def w(col,key,fmt):
            v=res.get(key)
            if v is None or (isinstance(v,float) and v!=v): ws.write(r,col,'',F['text'])
            else: ws.write(r,col,float(v),fmt)
        w(4,'power_rate',F['value4']); w(5,'fuel_rate',F['value4']); w(6,'dmw_rate',F['value4'])
        w(7,'baseline_obj',F['value']); w(8,'optimum_obj',F['value'])
        sv=res.get('saving')
        if sv is None or (isinstance(sv,float) and sv!=sv): ws.write(r,9,'',F['text'])
        else: ws.write(r,9,float(sv), F['green'] if float(sv)>=0 else F['red'])
        spct=res.get('saving_pct')
        if spct is None or (isinstance(spct,float) and spct!=spct): ws.write(r,10,'',F['text'])
        else: ws.write(r,10,float(spct)/100,F['pct'])
        ann=(float(sv)*8760/1e6) if (sv is not None and not(isinstance(sv,float) and sv!=sv)) else None
        if ann is None: ws.write(r,11,'',F['text'])
        else: ws.write(r,11,ann,F['value4'])
        w(12,'switchover_count',F['int'])
        w(13,'optimizer_seconds',F['value']); w(14,'post_seconds',F['value'])
        r+=1
    if errors:
        we=wb.add_worksheet('Errors')
        we.set_column(0,0,20); we.set_column(1,1,80)
        we.write(0,0,'Errors',F['title'])
        we.write(2,0,'Scenario',F['header']); we.write(2,1,'Error',F['header'])
        for ri,e in enumerate(errors,3):
            we.write(ri,0,e['scenario'],F['label']); we.write(ri,1,e['error'],F['text'])
    wb.close()
    return path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('scenarios', nargs='+')
    ap.add_argument('--skip-post', action='store_true')
    args = ap.parse_args()
    bad = [s for s in args.scenarios if s not in SCENARIO_CONFIGS]
    if bad: raise SystemExit(f'Unknown scenarios: {bad}\nAvailable: {list(SCENARIO_CONFIGS)}')
    results=[]; errors=[]; t0=time.time()
    for s in args.scenarios:
        try: results.append(run_scenario(s, skip_post=args.skip_post))
        except Exception as e:
            errors.append({'scenario':s,'error':str(e),'traceback':traceback.format_exc()})
            print(f'\n>>> {s}: DRIVER ERROR — {e}')
            results.append({'scenario':s,'optimizer_status':'driver_error','error':str(e),
                            'description':SCENARIO_CONFIGS[s].get('description','')})
    print(f'\n\nTotal: {(time.time()-t0)/60:.1f} min  '
          f'OK: {sum(1 for r in results if r.get("optimizer_status")=="ok")}/{len(args.scenarios)}')
    path = write_combined(results, errors)
    print(f'Combined: {path.name}')
    print(f'\nResults summary:')
    for r in results:
        sv=r.get('saving'); ss=f'${float(sv):.2f}' if sv is not None and not(isinstance(sv,float) and sv!=sv) else 'n/a'
        print(f'  {r["scenario"]:<22} OPT={r.get("optimizer_status","?"):<12} '
              f'POST={r.get("post_status","?"):<10} saving={ss:<10} '
              f'switchovers={r.get("switchover_count",0)}')

if __name__ == '__main__': main()
