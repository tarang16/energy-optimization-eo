import { AppAtom } from 'atoms/AppAtom'
import { ModelSkipAtom } from 'atoms/ModelSkipAtom'
import CustomModal from 'components/visuals/common/modal/CustomModal'
import GradeTransitionTable from 'components/visuals/table/GradeTransitionTable/GradeTransitionTable'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { getSopGradesChangeByCaseId } from 'services/ConfigServices'
import classes from './OverViewLegends.module.scss'
import SEUEnergyDistributionTable from 'components/visuals/table/SEUEnergyDistributionTable/SEUEnergyDistributionTable'
export default function OverViewLegends({
  legendWidth = 50,
  setIsModalSkip = () => {},
}) {
  const ctxData = useAtomValue(AppAtom)
  const modelSkipData = useAtomValue(ModelSkipAtom)
  const params = useParams()
  const { caseId } = useOutletContext()
  const [showModelSkipButton, setShowModelSkipButton] = useState(false)
  const [showGradeTransition, setShowGradeTransition] = useState(false)
  const [SEUEnergyDistribution, setSEUEnergyDistribution] = useState(false)
  const [sopGrades, setSopGrades] = useState([])
  useEffect(() => {
    const fetchAndSetData = async () => {
      const result = await getSopGradesChangeByCaseId(caseId)
      const tempData = []
      if (result?.statuscode === 200) {
        result.data.forEach((item) => {
          tempData.push({
            display_name: item.gradeChange,
            tag_name: item.gradeChange,
          })
        })
        setSopGrades(tempData)
      } else {
        setSopGrades(tempData)
      }
    }
    fetchAndSetData()
  }, [caseId])
  useEffect(() => {
    if (
      modelSkipData?.modelSkipStatus &&
      modelSkipData?.modelSkipStatus != 'on'
    ) {
      setShowModelSkipButton(modelSkipData?.modelSkipStatus)
      setIsModalSkip(modelSkipData?.modelSkipStatus)
    } else {
      setShowModelSkipButton(false)
      setIsModalSkip('on')
    }
  }, [modelSkipData?.modelSkipStatus])
  let legendContainerWidth
  if (showModelSkipButton && !['on', 'off'].includes(showModelSkipButton)) {
    legendContainerWidth = `calc(${(legendWidth * 78) / 100 + '%'})`
  } else if (legendWidth === 100) {
    legendContainerWidth = `calc(${legendWidth + '%'})`
  } else {
    legendContainerWidth = `calc(${legendWidth + '%'})`
  }
  const legendContainerMarginLeft = '0'
  const handleShowGradeTransition = () => {
    setShowGradeTransition((prev) => !prev)
  }
  return (
    <>
      <div
        className={`${classes.legendContainer} h-100 d-flex align-items-center overflow-hidden w-100`}
        style={{
          width: `${legendContainerWidth}%`,
          marginLeft: legendContainerMarginLeft,
        }}
        data-static-id='OverViewLegends.js_div_2d7b6d'
      >
        <CustomModal
          show={showGradeTransition}
          title='SOP FOR GRADE TRANSITION'
          hideModal={handleShowGradeTransition}
          size={'lg'}
        >
          <GradeTransitionTable sopGrades={sopGrades} caseId={caseId} />
        </CustomModal>

        <CustomModal
          show={SEUEnergyDistribution}
          title='SEU ENERGY DISTRIBUTION'
          hideModal={() => setSEUEnergyDistribution(false)}
          size={'xl'}
        >
          <SEUEnergyDistributionTable caseId={caseId} />
        </CustomModal>

        <div
          id='overview-legend'
          data-testid='overview-legend'
          className={`${classes.flexContainer} h-100`}
          data-static-id='OverViewLegends.js_div_952e86'
        >
          <div
            className={'d-flex align-items-center'}
            data-static-id='OverViewLegends.js_div_cbc083'
          >
            <span
              className={`text-12-regular text-uppercase primary_gray d-inline-block ${classes.legendsName}`}
              data-static-id='OverViewLegends.js_span_a2badd'
            >
              Legends :
            </span>
            <span
              className={`text-12-regular bg_primary_blue  d-inline-block ${classes.customMargin} ${classes.square}`}
              data-static-id='OverViewLegends.js_span_b8b3dd'
            ></span>
            <span
              className={`text-12-regular bg_primary_orange d-inline-block ${classes.customMargin}  ${classes.square}`}
              data-static-id='OverViewLegends.js_span_b172ee'
            ></span>
            <span
              className={`text-12-regular text-uppercase primary_gray d-inline-block ${classes.legendsName}`}
              data-static-id='OverViewLegends.js_span_7c0c27'
            >
              Actual
            </span>

            <span
              className={`text-12-regular bg_primary_gray_2 ${classes.customMargin} d-inline-block ${classes.square}`}
              data-static-id='OverViewLegends.js_span_ad0c4f'
            ></span>

            <span
              className={`text-12-regular text-uppercase primary_gray d-inline-block ${classes.legendsName}`}
              data-static-id='OverViewLegends.js_span_9aa899'
            >
              Optimum / Predicted
            </span>
          </div>
          {sopGrades?.length > 0 && ctxData?.actualTime && (
            <div
              className={`text-12-bold text-uppercase primary_gray me-0  text_primary_blue cursor-pointer ${classes.SOPlegendsName}`}
              onClick={() => {
                TRACKEVENTOBJ.overview.sopForGridTransitionClick({
                  params,
                  caseData: ctxData?.caseData,
                })
                handleShowGradeTransition()
              }}
              data-static-id='OverViewLegends.js_div_4d4406'
            >
              SOP FOR GRADE TRANSITION
            </div>
          )}
          {/* <div><button className={`text-14-regular text-uppercase ${classes.SEU_energy_btn}`} onClick={() => setSEUEnergyDistribution(true)} >SEU Energy Distribution</button></div> */}
        </div>
      </div>
    </>
  )
}
