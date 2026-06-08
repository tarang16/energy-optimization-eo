import json
from energy_kev.assets.boiler import BoilerInput, BoilerHouseInput, BoilerHouse, BoilerHouseOutput
from energy_kev.core.base import AssetConfig

def run_test():
    # Configure 5 boilers with different capacities and constraints
    boilers = {
        "BLR-1": BoilerInput(
            steam_flow_t_h=120.0, steam_pressure_bar=63.0, steam_temperature_c=485.0,
            feedwater_flow_t_h=124.0, feedwater_temperature_c=140.0, fuel_flow_nm3_h=8400.0,
            min_steam_flow_t_h=50.0, max_steam_flow_t_h=150.0, max_fuel_flow_nm3_h=10000.0
        ),
        "BLR-2": BoilerInput(
            steam_flow_t_h=80.0, steam_pressure_bar=63.0, steam_temperature_c=485.0,
            feedwater_flow_t_h=82.0, feedwater_temperature_c=140.0, fuel_flow_nm3_h=5800.0,
            min_steam_flow_t_h=40.0, max_steam_flow_t_h=100.0, max_fuel_flow_nm3_h=7000.0
        ),
        "BLR-3": BoilerInput(
            steam_flow_t_h=40.0, steam_pressure_bar=63.0, steam_temperature_c=485.0,
            feedwater_flow_t_h=41.0, feedwater_temperature_c=140.0, fuel_flow_nm3_h=3000.0,
            min_steam_flow_t_h=50.0, max_steam_flow_t_h=120.0, max_fuel_flow_nm3_h=8000.0
            # Note: steam_flow_t_h is 40.0, which is < min 50.0 (Should trigger violation)
        ),
        "BLR-4": BoilerInput(
            steam_flow_t_h=160.0, steam_pressure_bar=63.0, steam_temperature_c=485.0,
            feedwater_flow_t_h=165.0, feedwater_temperature_c=140.0, fuel_flow_nm3_h=12000.0,
            min_steam_flow_t_h=60.0, max_steam_flow_t_h=150.0, max_fuel_flow_nm3_h=11000.0
            # Note: steam_flow_t_h is 160.0 > max 150.0, fuel is 12000 > max 11000 (Should trigger 2 violations)
        ),
        "BLR-5": BoilerInput(
            steam_flow_t_h=100.0, steam_pressure_bar=63.0, steam_temperature_c=485.0,
            feedwater_flow_t_h=102.0, feedwater_temperature_c=140.0, fuel_flow_nm3_h=7100.0,
            min_steam_flow_t_h=30.0, max_steam_flow_t_h=150.0, max_fuel_flow_nm3_h=9000.0
        )
    }

    # Setup BoilerHouse input with house-level constraints
    house_input = BoilerHouseInput(
        boilers=boilers,
        total_steam_demand_t_h=550.0, # Expected total steam is 120+80+40+160+100 = 500. This is < 550, so should trigger violation
        total_max_fuel_consumption_gj_h=2000.0 # Will be checked against calculated fuel
    )

    # Initialize BoilerHouse
    boiler_house = BoilerHouse(config=AssetConfig(name="MainBoilerHouse", plant="Utilities"))

    # 1. Run Calculations & Check Constraint Violations
    print("--- Running BoilerHouse Calculation ---")
    out = boiler_house._compute(house_input)
    
    print(f"Total Steam Generated: {out.total_steam_generation_t_h:.2f} t/h")
    print(f"Total Fuel Consumed:   {out.total_fuel_consumption_gj_h:.2f} GJ/h")
    print(f"Overall Efficiency:    {out.overall_efficiency_pct:.2f} %\\n")

    print("--- Constraint Violations ---")
    if out.constraint_violations:
        for v in out.constraint_violations:
            print(f"- {v}")
    else:
        print("No constraint violations found.")
        
    # 2. Export to MINLP
    print("\\n--- MINLP Export Data ---")
    minlp_data = boiler_house.to_minlp_boilers(house_input, outputs=out)
    print(json.dumps(minlp_data, indent=2))


if __name__ == "__main__":
    run_test()
