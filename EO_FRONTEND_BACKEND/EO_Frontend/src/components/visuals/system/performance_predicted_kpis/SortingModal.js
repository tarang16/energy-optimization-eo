import { AppAtom } from 'atoms/AppAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { saveKpiOrderByKey } from 'services/FavoriteService'
import { uuid4 } from 'utills/utilities'
import infoIcon from '../../../../assets/sabic_icons/common/timeinfo_blue.svg'
import Card from './Card'
import styles from './SortingModal.module.scss'
const CardContainer = ({
  data = [],
  category,
  caseId,
  actualTime,
  odsData,
  maxBoxesInRow,
  isPerformance,
  setShowModal,
  setType,
  type,
  setRefetch,
  originalData,
}) => {
  const ctxData = useAtomValue(AppAtom)
  const caseData = ctxData?.caseData || []
  const [cards, setCards] = useState(data)
  const [loading, setLoading] = useState(false)
  const params = useParams()
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('card_id', id)
  }
  const handleDragOver = (e) => {
    e.preventDefault()
  }
  const handleDrop = (e, droppedCardId) => {
    const draggedCardId = e.dataTransfer?.getData('card_id')
    const draggedIndex = cards.findIndex(
      (card) => card.id === parseInt(draggedCardId),
    )
    const droppedIndex = cards.findIndex((card) => card.id === droppedCardId)
    const updatedCards = [...cards]
    const draggedCard = updatedCards[draggedIndex]
    updatedCards[draggedIndex] = updatedCards[droppedIndex]
    updatedCards[droppedIndex] = draggedCard
    setCards(updatedCards)
  }
  const numRows = Math.ceil(cards.length / (isPerformance ? 3 : 2))
  const getCardsForRow = (rowIndex) => {
    const start = rowIndex * (isPerformance ? 3 : 2)
    const end = start + (isPerformance ? 3 : 2)
    return cards.slice(start, end)
  }
  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '1.5vmin',
    marginTop: '.2vmin',
  }
  const rowStyle = {
    display: 'flex',
    justifyContent: 'start',
    gap: '1vmin',
    height: '14vmin',
    marginBottom: '2vmin',
  }
  const handleSubmitSorting = async () => {
    setLoading(true)
    const data = {
      key: caseId,
      parameter: `${type.toLowerCase()}_kpi`,
      data: cards.map((x, index) => ({
        kpi: x.tagName,
        order: index + 1,
      })),
    }
    const res = await saveKpiOrderByKey(data)
    if (res?.statuscode === 200) {
      setLoading(false)
      setRefetch(true)
      setShowModal(false)
      setType('')
      TRACKEVENTOBJ.sortingModal.applyKPISorting({
        params,
        caseData,
        type,
      })
    }
  }
  const handleDefaultSortingClick = () => {
    setCards(originalData)
  }
  return (
    <div
      className={`${styles.kpi_sorting_parent} w-100 h-100`}
      data-static-id='SortingModal.js_div_d8777b'
    >
      <div
        className={`${styles.topContainer}`}
        data-static-id='SortingModal.js_div_7c9b23'
      >
        <img
          alt=''
          src={infoIcon}
          className={`me-2 ${styles.infoIocn}`}
          data-static-id='SortingModal.js_img_6b125f'
        />
        <span
          className='text-14-regular text_primary_blue'
          data-static-id='SortingModal.js_span_61abb7'
        >
          Drag KPI cards to Arrange
        </span>
      </div>
      <div
        className={`kpiSortingModalGlobal ${styles.kpi_Sorting_container}`}
        style={containerStyle}
        data-static-id='SortingModal.js_div_903e10'
      >
        {[...Array(numRows)].map((_, rowIndex) => (
          <div
            className={'w-100'}
            key={uuid4()}
            style={rowStyle}
            data-static-id='SortingModal.js_div_afe267'
          >
            {getCardsForRow(rowIndex).map((card) => (
              <Card
                key={card.id}
                id={card.id}
                text={card.text}
                draggable='true'
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                kipobj={card}
                category={category}
                caseId={caseId}
                actualTime={actualTime}
                odsData={odsData}
                maxBoxesInRow={maxBoxesInRow}
                isPerformance={isPerformance}
              />
            ))}
          </div>
        ))}
      </div>
      <div
        className='d-flex justify-content-between align-items-center'
        data-static-id='SortingModal.js_div_d0fc37'
      >
        <div data-static-id='SortingModal.js_div_827691'>
          <span
            className={'text-14-regular text_primary_blue cursor-pointer'}
            onClick={handleDefaultSortingClick}
            data-static-id='SortingModal.js_span_870ab8'
          >
            Default Sorting
          </span>
        </div>
        <div
          className={`${styles.buttonContainer}`}
          data-static-id='SortingModal.js_div_24f59f'
        >
          <button
            className={`text-14-bold ${styles.applyBtn}`}
            data-testid='applyBtn'
            onClick={() => {
              handleSubmitSorting()
            }}
            disabled={loading}
            data-static-id='SortingModal.js_button_290f30'
          >
            Apply Sorting
          </button>
          <button
            className={`text-14-bold ${styles.cancelBtn}`}
            data-testid='cancelBtn'
            onClick={() => {
              setShowModal(false)
              setType('')
            }}
            disabled={loading}
            data-static-id='SortingModal.js_button_c0cbc2'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
export default CardContainer
