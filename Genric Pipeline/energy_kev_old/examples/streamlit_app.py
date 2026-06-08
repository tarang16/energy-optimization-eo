"""
Streamlit dashboard demo.

Run:
    streamlit run energy_kev/examples/streamlit_app.py

Tabs:
    1. Live KEVs    — per-asset dashboard with current KEVs / SEC
    2. Plant SEC    — plant-level rollups (energy GJ/h, CO2 t/h, SEC GJ/t)
    3. Configure    — toggle which assets are active in the calculation set
"""
from __future__ import annotations

import json
import streamlit as st  # type: ignore

from energy_kev.examples.run_demo import build_plant, example_inputs


st.set_page_config(page_title="Energy KEV Dashboard", layout="wide")
st.title("Energy KEV Dashboard — petrochemical complex")

if "plant" not in st.session_state:
    st.session_state.plant = build_plant()
    st.session_state.inputs = example_inputs()

plant = st.session_state.plant
inputs = st.session_state.inputs

tab_kev, tab_plant, tab_cfg = st.tabs(["Live KEVs", "Plant SEC", "Configure"])

with tab_cfg:
    st.subheader("Active assets")
    chosen = st.multiselect(
        "Select asset modules to include",
        options=[a.config.name for a in plant.assets],
        default=[a.config.name for a in plant.assets],
    )
    plant.assets = [a for a in plant.assets if a.config.name in chosen]

with tab_kev:
    result = plant.run(inputs)
    cols = st.columns(2)
    for i, r in enumerate(result.asset_results):
        with cols[i % 2]:
            st.markdown(f"### {r.asset_class} — {r.asset_name}")
            if r.ok:
                st.json({"KEVs": r.kevs, "SEC": r.sec}, expanded=False)
            else:
                st.error("\n".join(r.errors))

with tab_plant:
    result = plant.run(inputs)
    st.subheader("Plant-level rollup")
    st.metric("Total energy input (GJ/h)",
              f"{result.rollups.get('total_energy_input_gj_h', 0):.2f}")
    st.metric("Total CO2 (t/h)",
              f"{result.rollups.get('total_co2_t_h', 0):.2f}")
    st.metric("Plant SEC (GJ/t)",
              f"{result.rollups.get('plant_sec_gj_per_t', 0):.3f}")
    st.metric("Plant CO2 intensity (t/t)",
              f"{result.rollups.get('plant_co2_intensity_t_per_t', 0):.4f}")
    st.json(result.to_dict(), expanded=False)
