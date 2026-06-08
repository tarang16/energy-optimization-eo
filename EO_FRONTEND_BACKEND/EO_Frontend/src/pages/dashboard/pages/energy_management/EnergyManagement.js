import { AppAtom } from 'atoms/AppAtom'
import EmTopTiles from 'components/visuals/common/EmTopTile/EmTopTiles'
import CustomMultiSelect from 'components/visuals/dropdown/multi_select/CustomMultiSelect'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { Outlet, useOutletContext, useParams } from 'react-router-dom'
import {
  getPlantAffiliates,
  getTopTilesData,
} from 'services/EnergyManagementService'
import { EM_TOP_TILES_INITIAL_DATA } from './EnergyManagement.functions'
import styles from './EnergyManagement.module.scss'
export default function EnergyManagement() {
  const [DPStartDate, setDPStartDate] = useState(
    moment().subtract('1', 'y').toDate(),
  )
  const [DPEndDate, setDPEndDate] = useState(moment().toDate())
  const [dateRange, setDateRange] = useState([DPStartDate, DPEndDate])
  const [isLoading, setIsLoading] = useState(false)
  const [plantList, setPlantList] = useState([])
  const [selectedPlants, setSelectedPlants] = useState([])
  const { affiliateId } = useOutletContext()
  const [topTilesData, setTopTilesData] = useState(EM_TOP_TILES_INITIAL_DATA)
  const plantChanged = useMemo(() => {
    return [selectedPlants, dateRange]
  }, [selectedPlants, dateRange])
  const params = useParams()
  const appContext = useAtomValue(AppAtom)
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      let tempPlantList = await getPlantAffiliates(affiliateId)
      tempPlantList = tempPlantList?.data?.sort((a, b) =>
        a?.plantName?.localeCompare(b?.plantName),
      )
      if (tempPlantList?.length > 0) {
        setPlantList([
          {
            id: 'all',
            name: 'ALL',
          },
          ...(tempPlantList?.map((obj) => ({
            id: obj?.plantName,
            name: obj?.plantName,
          })) ?? []),
        ])
      } else {
        setPlantList([])
      }
      setIsLoading(false)
    })()
  }, [affiliateId])
  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      const tempPlants = selectedPlants?.map((obj) => obj?.id)
      const isAllSelected = selectedPlants.length === plantList.length - 1
      const resp = await getTopTilesData(
        dateRange[0],
        dateRange[1],
        affiliateId,
        isAllSelected ? ['all'] : tempPlants,
      )
      if (resp?.data) {
        const respObj = resp?.data
        setTopTilesData((p) =>
          p?.map((obj, index) => ({
            ...obj,
            value: respObj[obj.api_key],
            targetVal: obj?.targetValKey ? respObj[obj?.targetValKey] : null,
            tooltipdatakey: respObj,
            reconciledVal: respObj[obj?.reconciledKey],
            reconciled: index < 2 ? isAllSelected : obj?.reconciled,
          })),
        )
      }
      setIsLoading(false)
    })()
  }, [plantChanged])
  return (
    <div
      className={`${styles.energyManagementContainer} h-100 h-100`}
      data-static-id='EnergyManagement.js_div_d2e77e'
    >
      <div
        id='filter-container '
        className={` ${styles.filterContainer} w-50 d-flex align-items-center justify-content-end`}
        data-static-id='EnergyManagement.js_div_5be0ba'
      >
        <div
          id='plant-filter'
          data-testid='plant-filter'
          className={`${styles.selectBoxWrapper} me-2 d-flex align-items-center h-100`}
          data-static-id='EnergyManagement.js_div_d82f49'
        >
          <span
            className={`${styles.labelText} text-12-bold text_primary_gray me-2`}
            data-static-id='EnergyManagement.js_span_421da7'
          >
            PLANTS :{' '}
          </span>
          <CustomMultiSelect
            options={plantList}
            setFunction={(e) => {
              TRACKEVENTOBJ.energyManagement.selectedValue(
                {
                  params,
                  caseData: appContext.caseData,
                },
                e,
              )
              setSelectedPlants(e)
            }}
          />
        </div>
        <span
          className='text-12-bold text_primary_gray me-2'
          data-static-id='EnergyManagement.js_span_36b379'
        >
          TIME :{' '}
        </span>
        <div
          id='start-date-filter'
          data-testid='start-date-filter'
          className={`customDatePicker  ${isLoading ? styles.cursorDefault : styles.cursorPointer}  ${styles.datePickerOuterContainer} h-100 text-13-bold me-2`}
          data-static-id='EnergyManagement.js_div_000fc0'
        >
          <DatePicker
            className={`text-14-regular text_primary_gray `}
            calendarClassName='custom-calendar'
            dateFormat={'dd-MMM-yyyy'}
            selected={DPStartDate}
            maxDate={DPEndDate}
            onChange={(dt) => {
              TRACKEVENTOBJ.energyManagement.handleStartDateChange(
                {
                  params,
                  caseData: appContext.caseData,
                },
                dt,
              )
              setDPStartDate(dt)
              setDateRange([dt, DPEndDate])
            }}
            disabled={isLoading}
            popperClassName={styles.popupClass}
            popperPlacement='bottom-end'
          />
        </div>
        <div
          id='end-date-filter'
          data-testid='end-date-filter'
          className={`customDatePicker ${styles.DatePickerEM} ${isLoading ? styles.cursorDefault : styles.cursorPointer} ${styles.datePickerOuterContainer} h-100 text-12-bold`}
          data-static-id='EnergyManagement.js_div_d1e0e2'
        >
          <DatePicker
            className='text-14-regular text_primary_gray'
            dateFormat={'dd-MMM-yyyy'}
            selected={DPEndDate}
            minDate={DPStartDate}
            maxDate={moment().toDate()}
            onChange={(dt) => {
              TRACKEVENTOBJ.energyManagement.handleEndDateChange(
                {
                  params,
                  caseData: appContext.caseData,
                },
                dt,
              )
              setDPEndDate(dt)
              setDateRange([DPStartDate, dt])
            }}
            disabled={isLoading}
            popperClassName={styles.popupClass}
            popperPlacement='bottom-end'
          />
        </div>
      </div>
      <div
        className={`${styles.energyManagementContainer__content} position-relative`}
        data-static-id='EnergyManagement.js_div_61698e'
      >
        <div
          id='tiles-container'
          data-testid='tiles-container'
          className={`${styles.energyManagementTopKPI}`}
          data-static-id='EnergyManagement.js_div_44124f'
        >
          <EmTopTiles data={topTilesData} />
        </div>
        <div
          id='contents-container'
          data-testid='contents-container'
          className={`w-100 ${styles.energyManagementBottomContainer}`}
          data-static-id='EnergyManagement.js_div_fb5e9e'
        >
          <Outlet
            context={{
              selectedPlants: selectedPlants?.map((obj) => obj?.id)?.join(','),
              caseId: affiliateId,
              dateRange,
            }}
          />
        </div>
      </div>
    </div>
  )
}
