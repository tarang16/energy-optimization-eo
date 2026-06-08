import csv
import json
import os
from collections import defaultdict
from energy_kev.assets.boiler import BoilerInput, BoilerHouseInput, BoilerHouse
from energy_kev.core.base import AssetConfig

def run_from_csv(csv_path: str):
    print(f"Loading data from {csv_path}...\n")
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    house_props = {}
    boilers_data = defaultdict(dict)

    # 1. Read CSV
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            asset = row['asset_name'].strip()
            key = row['key'].strip()
            
            try:
                val = float(row['value'].strip())
            except ValueError:
                val = float("nan")

            if asset == "HOUSE":
                house_props[key] = val
            else:
                boilers_data[asset][key] = val

    # 2. Convert raw data into BoilerInput dataclasses
    boilers_dict = {}
    for b_id, b_props in boilers_data.items():
        boilers_dict[b_id] = BoilerInput(**b_props)
        
    # 3. Setup house-level inputs
    house_input = BoilerHouseInput(
        boilers=boilers_dict,
        total_steam_demand_t_h=house_props.get("total_steam_demand_t_h", float("nan")),
        total_max_fuel_consumption_gj_h=house_props.get("total_max_fuel_consumption_gj_h", float("nan"))
    )
    
    # 4. Initialize and Run BoilerHouse
    boiler_house = BoilerHouse(config=AssetConfig(name="MappedBoilerHouse", plant="Utilities"))
    
    print("--- Running BoilerHouse Calculation ---")
    out = boiler_house._compute(house_input)
    
    print(f"Total Steam Generated: {out.total_steam_generation_t_h:.2f} t/h")
    print(f"Total Fuel Consumed:   {out.total_fuel_consumption_gj_h:.2f} GJ/h")
    print(f"Overall Efficiency:    {out.overall_efficiency_pct:.2f} %")
    print(f"Overall SEC:           {out.overall_sec_gj_per_t_steam:.2f} GJ/t")
    
    print("\n--- Individual Boiler Efficiencies ---")
    for b_id, b_out in out.boiler_outputs.items():
        print(f"[{b_id}] Direct Eff: {b_out.boiler_efficiency_pct:.2f}% | LHV: {b_out.fuel_lhv_mj_per_nm3:.2f} MJ/Nm3 | SEC: {b_out.sec_gj_per_t_steam:.2f} GJ/t")

    print("\n--- Constraint Violations ---")
    if out.constraint_violations:
        for v in out.constraint_violations:
            print(f"- {v}")
    else:
        print("No constraint violations found.")
        
    # 5. Export to CSV (Inputs + Outputs)
    output_csv_path = csv_path.replace("input.csv", "output.csv")
    print(f"\nExporting results to {output_csv_path}...")
    
    with open(output_csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['asset_name', 'key', 'value'])
        
        # Write HOUSE inputs
        for k, v in house_props.items():
            writer.writerow(['HOUSE', k, v])
            
        # Write HOUSE outputs
        writer.writerow(['HOUSE', 'total_steam_generation_t_h', out.total_steam_generation_t_h])
        writer.writerow(['HOUSE', 'total_fuel_consumption_gj_h', out.total_fuel_consumption_gj_h])
        writer.writerow(['HOUSE', 'overall_efficiency_pct', out.overall_efficiency_pct])
        writer.writerow(['HOUSE', 'overall_sec_gj_per_t_steam', out.overall_sec_gj_per_t_steam])
        if out.constraint_violations:
            writer.writerow(['HOUSE', 'constraint_violations', " | ".join(out.constraint_violations)])
            
        # Write BOILER inputs and outputs
        for b_id, b_inp in boilers_data.items():
            # Inputs
            for k, v in b_inp.items():
                writer.writerow([b_id, k, v])
            
            # Outputs
            if b_id in out.boiler_outputs:
                b_out = out.boiler_outputs[b_id]
                writer.writerow([b_id, 'fuel_lhv_mj_per_nm3', b_out.fuel_lhv_mj_per_nm3])
                writer.writerow([b_id, 'total_energy_supply_gj_h', b_out.total_energy_supply_gj_h])
                writer.writerow([b_id, 'useful_heat_gj_h', b_out.useful_heat_gj_h])
                writer.writerow([b_id, 'boiler_efficiency_pct', b_out.boiler_efficiency_pct])
                writer.writerow([b_id, 'indirect_efficiency_pct', b_out.indirect_efficiency_pct])
                writer.writerow([b_id, 'sec_gj_per_t_steam', b_out.sec_gj_per_t_steam])
                writer.writerow([b_id, 'mass_balance_deviation_pct', b_out.mass_balance_deviation_pct])
                writer.writerow([b_id, 'energy_balance_deviation_pct', b_out.energy_balance_deviation_pct])
                writer.writerow([b_id, 'economizer_duty_gj_h', b_out.economizer_duty_gj_h])
                writer.writerow([b_id, 'economizer_ua_kw_k', b_out.economizer_ua_kw_k])
                writer.writerow([b_id, 'economizer_approach_c', b_out.economizer_approach_c])
                writer.writerow([b_id, 'economizer_fouling_factor', b_out.economizer_fouling_factor])
                writer.writerow([b_id, 'economizer_fouling_resistance_k_kw', b_out.economizer_fouling_resistance_k_kw])
                writer.writerow([b_id, 'sh1_duty_gj_h', b_out.sh1_duty_gj_h])
                writer.writerow([b_id, 'sh1_ua_kw_k', b_out.sh1_ua_kw_k])
                writer.writerow([b_id, 'sh1_approach_c', b_out.sh1_approach_c])
                writer.writerow([b_id, 'sh1_fouling_factor', b_out.sh1_fouling_factor])
                writer.writerow([b_id, 'sh1_fouling_resistance_k_kw', b_out.sh1_fouling_resistance_k_kw])
                writer.writerow([b_id, 'sh2_duty_gj_h', b_out.sh2_duty_gj_h])
                writer.writerow([b_id, 'sh2_ua_kw_k', b_out.sh2_ua_kw_k])
                writer.writerow([b_id, 'sh2_approach_c', b_out.sh2_approach_c])
                writer.writerow([b_id, 'sh2_fouling_factor', b_out.sh2_fouling_factor])
                writer.writerow([b_id, 'sh2_fouling_resistance_k_kw', b_out.sh2_fouling_resistance_k_kw])
                writer.writerow([b_id, 'desuperheater_duty_gj_h', b_out.desuperheater_duty_gj_h])
                writer.writerow([b_id, 'desuperheater_temp_drop_c', b_out.desuperheater_temp_drop_c])
        
    print("\n--- MINLP Export Data ---")
    minlp_data = boiler_house.to_minlp_boilers(house_input, outputs=out)
    print(json.dumps(minlp_data, indent=2))


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, "boilerhouse_input.csv")
    run_from_csv(csv_path)
