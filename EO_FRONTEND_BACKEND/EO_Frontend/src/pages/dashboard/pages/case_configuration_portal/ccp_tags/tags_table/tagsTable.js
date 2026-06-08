import { CCPTagsAtom } from 'atoms/CCPAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useSetAtom } from 'jotai'
import { useEffect, useMemo, useRef, useState } from 'react'
import useInfiniteScroll from 'react-infinite-scroll-hook'
import { useOutletContext, useParams } from 'react-router-dom'
import { getEOTagsDataByCaseid } from 'services/CCPServices'
import { getDataTypeAndTagType } from 'services/ConfigServices'
import { debounce, getValsBaseOnCondition, showToast } from 'utills/utilities'
import styles from '../TableWithSearch.module.scss'
import DataTable from './Table'
import TableHeader from './tableHeader'
const Headers = [
  {
    title: 'TAG ID',
    field: 'tagID',
  },
  {
    title: 'TAG NAME',
    field: 'tagName',
  },
  {
    title: 'UI DISPLAY NAME',
    field: 'uiDisplayName',
  },
  {
    title: 'UOM',
    field: 'uom',
  },
  {
    title: 'TAG TYPE',
    field: 'tagType',
    showFilter: true,
  },
  {
    title: 'PI NAME/FORMULA',
    field: 'piName',
  },
  {
    title: 'ACTION',
    field: 'action',
  },
]
const TagsTable = ({
  onEditClick,
  onInfoClick,
  onDeleteClick,
  setTagTypes,
  setDataTypes,
  canEdit,
  modelNamesDropDownOptions,
  uomDropDownOptions,
  validationData,
  tooltips,
  refetch,
  setRefetch,
}) => {
  const { caseId } = useOutletContext()
  const setCcpContext = useSetAtom(CCPTagsAtom)
  const [isLoading, setIsLoading] = useState(true)
  const [searchString, setSearchString] = useState('')
  const [tagName, setTagName] = useState('')
  const [modelName, setModelName] = useState('')
  const [originalData, setOriginalData] = useState([])
  const [tagOptions, setTagOptions] = useState([
    {
      display_name: 'ALL',
      tag_name: '',
    },
  ])
  const [modelOptions, setModelOptions] = useState([
    {
      display_name: 'ALL',
      tag_name: '',
    },
  ])
  const params = useParams()
  function combineTags(data) {
    const tagMap = new Map()
    const tempUnquieModels = ['all']
    let tempModelDropDowns = [
      {
        display_name: 'ALL',
        tag_name: '',
      },
    ]
    let tagNameDropDowns = []
    data.forEach((item) => {
      const { tagID, modelName, modelDescription, modelType, ...rest } = item
      tagNameDropDowns.push({
        ...item,
        display_name: item?.description,
        tag_name: item?.tagName,
      })
      if (!tempUnquieModels.includes(modelName)) {
        tempUnquieModels.push(modelName)
        tempModelDropDowns.push({
          display_name: modelName.toUpperCase(),
          tag_name: modelName,
        })
      }
      if (!tagMap.has(tagID)) {
        tagMap.set(tagID, {
          ...rest,
          piName:
            item.tagType === 'pi'
              ? item?.piName
              : (item?.inferredExpression ?? '-'),
          tagID,
          models: [
            {
              modelName,
              modelDescription,
              modelType,
            },
          ],
        })
      } else {
        const existingTag = tagMap.get(tagID)
        existingTag.models.push({
          modelName,
          modelDescription,
          modelType,
        })
      }
    })
    setModelOptions(tempModelDropDowns)
    setCcpContext(tagNameDropDowns)
    return Array.from(tagMap.values())
  }
  const getUniqueTagAndDataType = (data) => {
    const uniqueTagTypes = data?.tag_type || []
    const uniqueDataTypes = data?.tag_data_type || []
    setTagTypes(uniqueTagTypes)
    setDataTypes(uniqueDataTypes)
    const tempDropdownOp = uniqueTagTypes.map((item) => {
      return {
        display_name: item || '-',
        tag_name: item || '-',
      }
    })
    setTagOptions([
      {
        display_name: 'ALL',
        tag_name: '',
      },
      ...tempDropdownOp,
    ])
  }
  const [finalFilteredData, setFinalFilteredData] = useState([])
  const [isLoadingMore, setMoreLoading] = useState(false)
  const [pagecount, setPageCount] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)
  const hasMore = useRef(false)
  const pageSize = 100
  const resetpageNumberAndPageCount = () => {
    hasMore.current = false
    setPageNumber(1)
    setPageCount(1)
  }
  const handleSearchChange = (value) => {
    const searchTerm = getValsBaseOnCondition(
      value?.trim() === '',
      null,
      value.trim(),
    )
    setSearchString(searchTerm)
    resetpageNumberAndPageCount()
    getTagsTableData(searchTerm, false, 1)
  }
  const debouncedSearchChange = useMemo(() => {
    return debounce((value) => handleSearchChange(value))
  }, [handleSearchChange])
  const getTagsTableData = async (
    searchTerm = null,
    callFromScroll = false,
    customPageNumber = 1,
  ) => {
    if (callFromScroll) {
      setMoreLoading(true)
    } else {
      setOriginalData([])
      setFinalFilteredData([])
    }
    try {
      if (!caseId) return
      const {
        data = [],
        pageCount,
        statuscode,
      } = await getEOTagsDataByCaseid(
        caseId,
        searchTerm,
        customPageNumber,
        pageSize,
      )
      if (data?.length > 0 && statuscode === 200) {
        combineTags(data)
        const updatedOriginalData = getValsBaseOnCondition(
          callFromScroll,
          [...originalData, ...data],
          [...data],
        )
        setOriginalData(updatedOriginalData)
        const processedData = data?.filter((item) => {
          const checks = [
            item?.tagID,
            item?.tagName,
            item?.uiDisplayName,
            item?.uom,
          ]
          if (item?.tagType === 'inferred') {
            checks.push(item?.inferredExpression ?? '')
          } else {
            checks.push(item?.piName ?? '')
          }
          return checks
        })
        setFinalFilteredData((prev) =>
          getValsBaseOnCondition(
            callFromScroll,
            [...prev, ...processedData],
            [...processedData],
          ),
        )
        setPageCount(pageCount)
        hasMore.current = true
        setPageNumber((existingPage) => existingPage + 1)
      }
    } catch (error) {
      showToast('err', error)
    } finally {
      setIsLoading(false)
      setMoreLoading(false)
    }
  }
  const [loaderRef] = useInfiniteScroll(
    {
      loading: isLoadingMore,
      hasNextPage: hasMore.current && pageNumber <= pagecount,
      onLoadMore: () => {
        getTagsTableData(searchString, true, pageNumber)
      },
      disabled: !hasMore.current || isLoadingMore,
      rootMargin: '0px 0px 120px 0px',
    },
    // @ts-ignore
    [],
  )
  const getDropDownData = async () => {
    const dropDownData = await getDataTypeAndTagType()
    getUniqueTagAndDataType(dropDownData?.data)
  }
  useEffect(() => {
    getDropDownData()
  }, [])
  useEffect(() => {
    getTagsTableData()
  }, [refetch])
  useEffect(() => {
    const tempData = originalData?.filter((item) => {
      // Match modelName or ALL
      const modelMatches =
        !modelName ||
        modelName === '' ||
        item?.modelName?.toLowerCase() === modelName.toLowerCase()
      // Match tagName or ALL
      const tagMatches =
        !tagName ||
        tagName === '' ||
        item?.tagType?.toLowerCase() === tagName.toLowerCase()
      return modelMatches && tagMatches
    })
    if (tempData?.length > 0) {
      setFinalFilteredData(tempData)
      setIsLoading(false)
    }
  }, [tagName, originalData, modelName])
  return (
    <div
      className={`${styles.ccpMainContainer} h-100 w-100`}
      data-static-id='tagsTable.js_div_239747'
    >
      <div
        className={`${styles.marginLeft} ${styles.ccpContainer}`}
        data-static-id='tagsTable.js_div_96d5f7'
      >
        <TableHeader
          validationData={validationData}
          tooltips={tooltips}
          modelNamesDropDownOptions={modelNamesDropDownOptions}
          uomDropDownOptions={uomDropDownOptions}
          onCellChange={(val) => {
            TRACKEVENTOBJ.CCPTags.onSearch({
              params,
              key: 'CellChange',
              value: val,
            })
            setIsLoading(true)
            debouncedSearchChange(val)
          }}
          modelTypes={modelOptions}
          handleModelChange={(selectedModel) => {
            TRACKEVENTOBJ.CCPTags.modelNamDropDownChange({
              modelName: selectedModel?.tag_name,
              params,
              key: 'CellChange',
            })
            setIsLoading(true)
            setModelName(selectedModel?.tag_name)
          }}
          setRefetch={setRefetch}
          finalFilteredData={finalFilteredData}
        />
      </div>

      <div
        className={`${styles.marginLeft} ${styles.ccpTableContainer} ${styles.loader} h-100`}
        data-static-id='tagsTable.js_div_ab4345'
      >
        <DataTable
          headers={Headers}
          data={finalFilteredData}
          tagTypes={tagOptions}
          handleTagChange={(selectedTag) => {
            TRACKEVENTOBJ.CCPTags.onDropDownChange({
              tagName: selectedTag?.tag_name,
              params,
            })
            setIsLoading(true)
            setTagName(selectedTag?.tag_name)
          }}
          isLoading={isLoading}
          customColumnWidths={[10, 15, 15, 10, 15, 20, 15]}
          onInfoClick={onInfoClick}
          onEditClick={(vals) => {
            TRACKEVENTOBJ.CCPTags.onEditTag(vals)
            onEditClick(vals)
          }}
          onDeleteClick={onDeleteClick}
          canEdit={canEdit}
          leftAlignColumns={[1, 2, 5]}
          isLoadingMore={
            isLoadingMore ||
            (hasMore.current && pageNumber <= pagecount && !isLoading)
          }
          loaderRef={loaderRef}
        />
      </div>
    </div>
  )
}
export default TagsTable
