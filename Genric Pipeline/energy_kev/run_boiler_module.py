from energy_kev.assets.boiler import Boiler, BoilerInput

# 1. Provide the input data for the boiler using BoilerInput
inputs = BoilerInput(
    steam_flow_t_h=100.0,
    steam_pressure_bar=40.0,
    steam_temperature_c=350.0,
    feedwater_flow_t_h=102.0,
    feedwater_temperature_c=120.0,
    fuel_flow_nm3_h=8000.0,
    
    # Fuel composition (must sum to ~100)
    fuel_ch4_mol_pct=95.0,
    fuel_c2h6_mol_pct=5.0,
    fuel_c3h8_mol_pct=0.0,
    fuel_c4h10_mol_pct=0.0,
    fuel_h2_mol_pct=0.0,
    fuel_co_mol_pct=0.0,
    fuel_co2_mol_pct=0.0,
    fuel_n2_mol_pct=0.0,
    
    # Flue gas and environment conditions
    flue_o2_pct=3.0,
    stack_temperature_c=150.0,
    ambient_t_c=25.0,
    
    # Heat Exchangers (Economizer)
    eco_fw_inlet_t_c=120.0,
    eco_fw_outlet_t_c=180.0,
    eco_fw_cp_kj_kg_k=4.2,
    eco_flue_inlet_t_c=300.0,
    eco_flue_outlet_t_c=150.0,
    eco_design_ua_kw_k=150.0,
    
    # Desuperheater
    attemperator_spray_t_h=5.0,
    desuperheater_water_t_c=120.0,
    desuperheater_steam_inlet_t_c=380.0,
    desuperheater_steam_outlet_t_c=350.0,
    
    # Losses and misc
    radiation_loss_pct=1.0,
    cbd_flow_m3_h=2.0,
    co2_emission_factor_kg_per_gj=56.1
)

# 2. Instantiate the Boiler asset with a name
boiler = Boiler(name="Main_Utility_Boiler")

# 3. Perform the calculations
# The calculate() method handles validation, runs the math, and safely wraps the output
result = boiler.calculate(inputs)

# 4. Read and display the results
if result.ok:
    print(f"--- Calculation Successful for {result.asset_name} ---")
    
    print("\n[Efficiencies & Losses]")
    print(f"Direct Efficiency:       {result.outputs.get('direct_efficiency_pct', float('nan')):.2f} %")
    print(f"Indirect Efficiency:     {result.outputs.get('indirect_efficiency_pct', float('nan')):.2f} %")
    print(f"Stack Loss:              {result.outputs.get('stack_loss_pct', float('nan')):.2f} %")
    print(f"Radiation Loss:          {result.outputs.get('radiation_loss_pct', float('nan')):.2f} %")
    
    print("\n[Combustion & Fuel]")
    print(f"Fuel LHV:                {result.outputs.get('fuel_lhv_mj_per_nm3', float('nan')):.2f} MJ/Nm3")
    print(f"Excess Air:              {result.outputs.get('excess_air_pct', float('nan')):.2f} %")
    print(f"CO2 Emissions:           {result.outputs.get('co2_t_per_h', float('nan')):.2f} t/h")
    
    print("\n[Energy & Heat Duties]")
    print(f"Total Heat Supply:       {result.outputs.get('total_energy_supply_gj_h', float('nan')):.2f} GJ/h")
    print(f"Useful Heat:             {result.outputs.get('useful_heat_gj_h', float('nan')):.2f} GJ/h")
    print(f"Economizer Duty:         {result.outputs.get('economizer_duty_gj_h', float('nan')):.2f} GJ/h")
    print(f"Air Preheater Duty:      {result.outputs.get('air_preheater_duty_gj_h', float('nan')):.2f} GJ/h")
    print(f"Superheater 1 Duty:      {result.outputs.get('sh1_duty_gj_h', float('nan')):.2f} GJ/h")
    print(f"Superheater 2 Duty:      {result.outputs.get('sh2_duty_gj_h', float('nan')):.2f} GJ/h")
    
    print("\n[Heat Exchanger KPIs]")
    print(f"Economizer UA:           {result.outputs.get('economizer_ua_kw_k', float('nan')):.2f} kW/K")
    print(f"Economizer Approach:     {result.outputs.get('economizer_approach_c', float('nan')):.2f} °C")
    print(f"Economizer Fouling (1/UA):{result.outputs.get('economizer_fouling_resistance_k_kw', float('nan')):.4f} K/kW")
    
    print("\n[Desuperheater Metrics]")
    print(f"Desuperheater Duty:      {result.outputs.get('desuperheater_duty_gj_h', float('nan')):.2f} GJ/h")
    print(f"Desup Temp Drop:         {result.outputs.get('desuperheater_temp_drop_c', float('nan')):.2f} °C")
    
    print("\n[Process Metrics]")
    print(f"Steam-to-Fuel Ratio:     {result.outputs.get('steam_to_fuel_ratio', float('nan')):.2f}")
    print(f"Specific Energy (SEC):   {result.outputs.get('sec_gj_per_t_steam', float('nan')):.2f} GJ/t")
    print(f"CBD Percentage:          {result.outputs.get('cbd_pct', float('nan')):.2f} %")
    
    print("\n[Balances & Deviations]")
    print(f"Mass Balance Dev:        {result.outputs.get('mass_balance_deviation_pct', float('nan')):.2f} %")
    print(f"Energy Balance Dev:      {result.outputs.get('energy_balance_deviation_pct', float('nan')):.2f} %")
else:
    print("--- Calculation Failed ---")
    print("Errors:", result.errors)
