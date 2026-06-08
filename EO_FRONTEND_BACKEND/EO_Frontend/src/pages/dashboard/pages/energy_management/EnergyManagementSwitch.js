import { useParams } from 'react-router-dom'
import { EM_TILE_OBJ } from './EnergyManagement.functions'
export default function EnergyManagementSwitch() {
  const params = useParams()
  const renderedComponent = EM_TILE_OBJ[params?.key]
  return (
    <>
      {renderedComponent ? (
        renderedComponent
      ) : (
        <h1 data-static-id='EnergyManagementSwitch.js_h1_f6370e'>
          Invalid Url.
        </h1>
      )}
    </>
  )
}
