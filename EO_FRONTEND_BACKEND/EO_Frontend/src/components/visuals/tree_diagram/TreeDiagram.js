import { useEffect, useState } from 'react'
import styles from './TreeDiagram.module.scss'
import TreeDiagramCard from './TreeDiagramCard'
import TreeDiagramGapCard from './TreeDiagramGapCard'
import { AppAtom } from 'atoms/AppAtom'
import Loader from 'components/ui/loader/Loader'
import { useAtomValue } from 'jotai'
import moment from 'moment'
import { useOutletContext } from 'react-router-dom'
import { getTreeDiagramByCaseId } from 'services/CurrentServices'
import { groupBy } from 'utills/utilities'
export default function TreeDiagram({
  category,
  treeDiagramModal,
  setTreeDiagramModal,
}) {
  const ctxData = useAtomValue(AppAtom)
  const [isLoading, setIsLoading] = useState(true)
  const [levelData, setlevelData] = useState([])
  const { caseId } = useOutletContext()
  useEffect(() => {
    ;(async () => {
      if (treeDiagramModal?.[category]) {
        setIsLoading(false)
        setlevelData(treeDiagramModal[category])
      } else {
        const resp = await getTreeDiagramByCaseId(
          caseId,
          moment(ctxData?.actualTime),
          category,
        )
        if (Array.isArray(resp?.data)) {
          const groupedData = groupBy(resp.data, (item) => item.level)
          setlevelData(groupedData)
          setTreeDiagramModal((preval) => {
            return {
              ...treeDiagramModal,
              [category]: groupedData,
            }
          })
        } else {
          setlevelData([])
        }
        setIsLoading(false)
      }
    })()
  }, [])
  return (
    <div
      className={styles.tree_diagram_card}
      data-static-id='TreeDiagram.js_div_d43e9c'
    >
      <div className='w-100 h-100' data-static-id='TreeDiagram.js_div_a0431b'>
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {Object.entries(levelData).length !== 0 ? (
              Object.entries(levelData).map((key, nlevels) => {
                return (
                  <div
                    key={key[0]}
                    className='w-100 d-flex'
                    style={{
                      gap: '3vmin',
                    }}
                    data-static-id='TreeDiagram.js_div_c7a955'
                  >
                    {key[1].map((levels, index) => {
                      return levels.level?.toLowerCase() == 'level1' ? (
                        <TreeDiagramGapCard
                          data={levels}
                          levelData={Object.entries(levelData)}
                          nlevels={nlevels}
                          key={levels.caseID}
                        />
                      ) : (
                        <TreeDiagramCard
                          data={levels}
                          nlevelline={
                            nlevels == Object.entries(levelData).length - 1
                          }
                          levelData={Object.entries(levelData)}
                          nlevels={nlevels}
                          key={levels.caseID}
                        />
                      )
                    })}
                  </div>
                )
              })
            ) : (
              <p
                className='text-14-regular text-center'
                data-static-id='TreeDiagram.js_p_8b0a00'
              >
                Not applicable for this case.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
