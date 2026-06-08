export const handleAffiliateChangeDropDown = (
  selectedAffiliate,
  mapData,
  setSelectedData,
  showAllOption,
) => {
  const plants = mapData[selectedAffiliate?.tag_name]?.affiliate_plants ?? []
  const allOption = {
    display_name: 'All',
    tag_name: plants
      .filter((t) => t.plant_id)
      .map((x) => x.plant_id)
      .join(','),
  }
  const allPlants =
    showAllOption && plants?.length
      ? [...plants.slice(0, 1), allOption, ...plants.slice(1)]
      : plants
  setSelectedData((pre) => ({
    ...pre,
    selectedAffiliate: selectedAffiliate,
    plants: allPlants,
    systems: [],
    caseId: '',
  }))
}
export const handlePlantChangeDropDown = (
  selectedPlant,
  mapData,
  setSelectedData,
  showAllOption,
) => {
  setSelectedData((pre) => ({
    ...pre,
    selectedPlant: selectedPlant,
    systems: showAllOption
      ? []
      : mapData[pre.selectedAffiliate.tag_name][selectedPlant.tag_name],
    caseId: '',
  }))
}
export const handleSystemChangeDropDown = async (
  selectedSystem,
  setSelectedData,
) => {
  const caseId = selectedSystem.case_id
  setSelectedData((pre) => ({
    ...pre,
    caseId: caseId,
    selectedSystem: selectedSystem,
  }))
}
export const makeObjForNewAffiliate = ({
  obj,
  affiliate,
  plant,
  system,
  element,
  UserAllowedPlants,
  CorporateUser,
  affiliateDropDownArray = [],
}) => {
  const PlantId = element?.plant_id
  if (CorporateUser || UserAllowedPlants.includes(PlantId)) {
    obj[affiliate] = {
      [plant]: [
        {
          display_name: 'Choose any Case',
          tag_name: 'Choose any Case',
        },
        {
          display_name: system,
          tag_name: system,
          ...element,
        },
      ],
      uniquePlants: [plant],
      affiliate_plants: [
        {
          display_name: 'Choose any Plant',
          tag_name: 'Choose any Plant',
        },
        {
          display_name: plant,
          tag_name: plant,
          ...element,
        },
      ],
    }
    affiliateDropDownArray.push({
      display_name: affiliate,
      tag_name: affiliate,
      ...element,
    })
  }
  return obj
}
export const makeObjForNewPlant = (
  obj,
  affiliate,
  plant,
  element,
  UserAllowedPlants,
  CorporateUser,
) => {
  const PlantId = element?.plant_id
  if (CorporateUser || UserAllowedPlants.includes(PlantId)) {
    obj[affiliate] = {
      ...obj[affiliate],
      uniquePlants: [...obj[affiliate].uniquePlants, plant],
      affiliate_plants: [
        ...(obj[affiliate].affiliate_plants || []),
        {
          display_name: plant,
          tag_name: plant,
          ...element,
        },
      ],
      [plant]: [
        {
          display_name: 'Choose any Case',
          tag_name: 'Choose any Case',
        },
      ],
    }
  }
  return obj
}
export const makeObjForNewSystem = (obj, affiliate, plant, system, element) => {
  obj[affiliate] = {
    ...obj[affiliate],
    [plant]: [
      ...(obj[affiliate][plant] || []),
      {
        display_name: system,
        tag_name: system,
        ...element,
      },
    ],
  }
  return obj
}

// utilities/processAffiliateData.js
export const processAffiliateData = (ctxData, token) => {
  const workflowClaimsApi = token?.decodedToken?.workflowClaimsApi
  const UserAllowedAffiliates = token?.affiliateList
  const UserAllowedPlants = token?.plantList
  const CorporateUser = token?.isCorporate
  let affiliateDropDownArray = [
    {
      display_name: 'Choose any Affiliate',
      tag_name: 'Choose any Affiliate',
    },
  ]
  let obj = {}
  ctxData?.caseData.forEach((element) => {
    const affiliate = element.affiliate
    const plant = element.plant
    const plantId = element?.plant_id
    const system = element.system
    const affiliate_code = element.affiliate_code
    if (
      CorporateUser ||
      (UserAllowedAffiliates?.includes(affiliate_code) &&
        workflowClaimsApi.includes(plantId))
    ) {
      if (affiliate in obj) {
        if (!obj[affiliate].uniquePlants.includes(plant)) {
          obj = makeObjForNewPlant(
            obj,
            affiliate,
            plant,
            element,
            UserAllowedPlants,
            CorporateUser,
          )
        }
        obj = makeObjForNewSystem(obj, affiliate, plant, system, element)
      } else {
        obj = makeObjForNewAffiliate({
          obj,
          affiliate,
          plant,
          system,
          element,
          UserAllowedPlants,
          CorporateUser,
          affiliateDropDownArray,
        })
      }
    }
  })
  return {
    obj,
    affiliateDropDownArray,
  }
}
