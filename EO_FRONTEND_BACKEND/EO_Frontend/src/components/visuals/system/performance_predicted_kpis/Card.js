import { getCardComponent } from '../process_critical_parameters/ProcessCriticalParameters'
const Card = ({
  id,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  kipobj,
  category,
  caseId,
  actualTime,
  odsData,
  isPerformance,
}) => {
  const handleDragStart = (e) => {
    onDragStart(e, id)
  }
  const handleDragOver = (e) => {
    e.preventDefault()
    onDragOver(e)
  }
  const handleDrop = (e) => {
    onDrop(e, id)
  }
  const baseNumber = isPerformance ? 3 : 2
  return (
    <div
      key={kipobj.tagName}
      className={'h-100 px-1 py-1'}
      style={{
        width: `calc(100% / ${baseNumber})`,
      }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid={`card-${id}`}
      data-static-id='Card.js_div_3c4ffc'
    >
      {getCardComponent(kipobj, category, caseId, actualTime, odsData, false)}
    </div>
  )
}
export default Card
