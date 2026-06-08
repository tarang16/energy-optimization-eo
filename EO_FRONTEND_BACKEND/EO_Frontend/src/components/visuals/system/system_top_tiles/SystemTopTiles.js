import active_deviations from 'assets/sabic_icons/system_pages_top_kpi/active_deviations.svg'
import Loader from 'components/ui/loader/Loader'
import CardTopTiles from 'components/visuals/cards/CardTopTiles'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { get_system_toptile_data } from 'services/CurrentServices'
import { formatWithUnit, valueFormatter } from 'utills/utilities'
import co2Icon from 'assets/sabic_icons/lading_pages_top_kpis/co2.svg'
import energyIcon from 'assets/sabic_icons/lading_pages_top_kpis/energy_efficient_lightbulb.svg'
import goodElectricalIcon from 'assets/sabic_icons/lading_pages_top_kpis/good_electrical_performance.svg'
import CaseUnderProgress from 'components/ui/case_under_progress/CaseUnderProgress'
import styles from './SystemTopTiles.module.scss'
export default function SystemTopTiles({ caseId, actualTime, category }) {
  const [isLoading, setIsLoading] = useState(true)
  const [kpiData, setKpiData] = useState('')
  function systemDataToKpiData(system) {
    if (!system || Array.isArray(system) || Object.keys(system).length <= 0) {
      system = {
        energyBillEfficiency: '-',
        opportunityEnergyBills: '-',
        energyEfficiency: '-',
        opportunityTotalEnergyConsumption: '-',
        carbonNeutralityIndex: '-',
        opportunityCo2: '-',
        deviationActive: '-',
        deviationOverdue: '-',
      }
    }
    return [
      {
        image: goodElectricalIcon,
        kpi1_line1: 'ENERGY BILL EFFICIENCY LOSS',
        kpi1_line2: '',
        kpi1_unit: system?.energyBillEfficiencyUom?.toUpperCase() || '%',
        kpi2_line1: 'OPPORTUNITY IN ENERGY BILLS',
        kpi2_line2: '',
        kpi2_unit: system?.opportunityEnergyBillsUom?.toUpperCase() || '$/Hr',
        key: 'count_affiliate',
        kpi1_value: valueFormatter(system?.energyBillEfficiency),
        kpi2_value: formatWithUnit(
          valueFormatter(system?.opportunityEnergyBills),
        ),
        category: 'energy',
        tag_1: 'energy_bill_efficiency',
        tag_2: 'opportunity_energy_bills',
        display_name_1: 'ENERGY BILL EFFICIENCY (%)',
        display_name_2: 'OPPORTUNITY IN ENERGY BILLS ($/Hr)',
        trendLibrary: 'timeseries',
        id: 'system-energy-bill-efficiency',
        stateProcess: system.stateProcess,
        constrainProcess: system.constrainProcess,
      },
      {
        image: co2Icon,
        kpi1_line1: 'EXCESS CO<sub>2</sub> EMISSION',
        kpi1_line2: '',
        kpi1_unit: system?.carbonNeutralityIndexUom?.toUpperCase() || '%',
        kpi2_line1: 'REDUCTION OPPORTUNITY IN CO{SUB(2)} EMISSIONS',
        kpi2_line2: '',
        kpi2_unit: system?.opportunityCo2Uom?.toUpperCase() || 'MT/HR',
        key: 'count_plant',
        kpi1_value: valueFormatter(system?.carbonNeutralityIndex),
        kpi2_value: formatWithUnit(valueFormatter(system?.opportunityCo2)),
        category: 'environment',
        tag_1: 'Carbon_Neutrality_Index',
        tag_2: 'opportunity_co2',
        display_name_1: 'EXCESS CO{SUB(2)} EMISSION',
        display_name_2: 'REDUCTION OPPORTUNITY IN CO{SUB(2)} EMISSIONS (MT/HR)',
        trendLibrary: 'timeseries',
        id: 'system-energy-intensity-index',
        stateEnvironment: system.stateEnvironment,
        constrainEnvironment: system.constrainEnvironment,
      },
      {
        image: energyIcon,
        kpi1_line1: `ENERGY CONTRIBUTION TO SEEC <sub>(BASELINE)</sub>`,
        kpi1_line2: '',
        kpi1_unit: system?.seecGainUom?.toUpperCase() || 'GJ/HR',
        kpi2_line1: `POTENTIAL ENERGY CONTRIBUTION TO SEEC {SUB((ACTUAL))}`,
        kpi2_line2: '',
        kpi2_unit: system?.seecEnpiUom?.toUpperCase() || 'GJ/HR',
        key: 'seec_gains',
        kpi1_value: formatWithUnit(valueFormatter(system?.seecGain)),
        kpi2_value: formatWithUnit(valueFormatter(system?.seecEnpi)),
        category: 'seec',
        tag_1: 'seec_gain',
        tag_2: 'seec_enpi',
        display_name_1: 'ENERGY CONTRIBUTION TO SEEC (BASELINE)',
        display_name_2: 'POTENTIAL ENERGY CONTRIBUTION TO SEEC (ACTUAL)',
        trendLibrary: 'timeseries',
        id: 'seec-gain',
        stateEnergy: system.stateEnergy,
        constrainEnergy: system.constrainEnergy,
      },
      {
        image: active_deviations,
        kpi1_line1: 'ACTIVE DEVIATION',
        kpi1_line2: '',
        kpi1_unit: '',
        kpi2_line1: 'OVERDUE DEVIATION',
        kpi2_line2: '',
        kpi2_unit: '',
        key: 'deviation_active',
        kpi1_value: parseInt(system?.deviationActive),
        kpi2_value: parseInt(system?.deviationOverdue),
        category: 'deviation',
        tag_1: '',
        tag_2: '',
        trendLibrary: null,
        id: 'system-active-deviation',
      },
    ]
  }
  useEffect(() => {
    const tempActualTime = moment(actualTime)
    get_system_toptile_data(caseId, tempActualTime)
      .then((obj) => {
        if (
          obj &&
          Object.keys(obj).includes('data') &&
          !Array.isArray(obj.data) &&
          Object.keys(obj.data).length > 0
        ) {
          const tempData = obj.data
          const system = systemDataToKpiData(tempData)
          setKpiData(system)
        } else {
          const system = systemDataToKpiData([])
          setKpiData(system)
        }
      })
      .finally(() => setIsLoading(false))
  }, [actualTime])
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div
          id='system-top-tiles'
          className={`d-flex ${styles.container}`}
          data-static-id='SystemTopTiles.js_div_3358c9'
        >
          {kpiData && Array.isArray(kpiData) && actualTime ? (
            <>
              {kpiData.map((kipobj, index, id) => (
                <div
                  id={kipobj?.id}
                  key={kipobj.category}
                  className={`${styles.toptiles_container_box}`}
                  data-static-id='SystemTopTiles.js_div_3a9d08'
                >
                  <CardTopTiles
                    data={kipobj}
                    category={category}
                    caseId={caseId}
                    actualTime={actualTime}
                  />
                </div>
              ))}
            </>
          ) : (
            <CaseUnderProgress />
          )}
        </div>
      )}
    </>
  )
}
