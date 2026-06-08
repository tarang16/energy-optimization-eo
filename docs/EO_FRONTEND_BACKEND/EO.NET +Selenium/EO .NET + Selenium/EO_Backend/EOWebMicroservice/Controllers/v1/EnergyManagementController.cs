using Asp.Versioning;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.EnergyManagement;
using EODomain.Models.Requests;
using Microsoft.AspNetCore.Mvc;


namespace EOWebMicroservice.Controllers.v1
{
    /// <summary>
    /// Controller to host APIs related to configuration
    /// </summary>
    [ApiVersion("1.0")]
    public class EnergyManagementController : BaseController
    {
        private readonly IEnergyManagementServices _energyManagementServices;
       

        /// <summary>
        /// Constructor for ConfigController
        /// </summary>
        /// <param name="energyManagementServices"></param>
      
        public EnergyManagementController(IEnergyManagementServices energyManagementServices)
        {
            _energyManagementServices = energyManagementServices;
            
        }

        /// <summary>
        /// This api is used to get enpi daily trend based on the payload required.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_enpi_daily_trend")]
        public async Task<IActionResult> GetEnpiDailyTrend([FromBody] GetEnpiDailyTrendRequest request)
        {
            var result = await _energyManagementServices.GetEnpiDailyTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// This api is used to get equipment design capacity based on the payload required
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_equipment_design_capacity")]
        public async Task<IActionResult> GetEquipmentDesignCapacity([FromBody] GetEquipmentDesignCapacityRequest request)
        {
            var result = await _energyManagementServices.GetEquipmentDesignCapacity(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// This API is used to get air water stream values based on the payload
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_air_water_steam_trend")]
        public async Task<IActionResult> GetAirWaterSteamValues([FromBody] GetAirWaterSteamValuesRequest request)
        {
            var result = await _energyManagementServices.GetAirWaterSteamValuesAsync(request);

            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch overall significant energy
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_overall_significance_energy")]
        public async Task<IActionResult> GetOverallSignificanceEnergy([FromBody] GetOverallSignificanceEnergyRequest request)
        {
            var result = await _energyManagementServices.GetOverallSignificanceEnergyAsync(request);
            
            

            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }





        
    



    /// <summary>
    /// To fetch energy cost, index energy gap 
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost("get_energy_cost_index_energy_gap_monthly_index")]
        public async Task<IActionResult> GetEnergyCostIndexEnergyGapMonthlyIndex([FromBody] GetEnergyCostIndexEnergyGapMonthlyIndexRequest request)
        {
            var result = await _energyManagementServices.GetEnergyCostIndexEnergyGapMonthlyIndexAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch chilled water/cooling water cost trend
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_cw_energy_cost_trend")]
        public async Task<IActionResult> GetCWEnergyCostTrend([FromBody] GetCWEnergyCostTrendRequest request)
        {
            var result = await _energyManagementServices.GetCWEnergyCostTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To fetch chilled water/cooling water flow rate trend
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_cw_flow_rate_trend")]
        public async Task<IActionResult> GetCWFlowRateTrend([FromBody] GetCWFlowRateTrendRequest request)
        {
            var result = await _energyManagementServices.GetCWFlowRateTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get steam consumption/utilisation trend
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_steam_trend")]
        public async Task<IActionResult> GetSteamTrend([FromBody] GetSteamTrendRequest request)
        {
            var result = await _energyManagementServices.GetSteamTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get compressed air consumption/utilisation trend
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_air_trend")]
        public async Task<IActionResult> GetAirTrend([FromBody] GetAirTrendRequest request)
        {
            var result = await _energyManagementServices.GetAirTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get top tiles data
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_top_tiles_data")]
        public async Task<IActionResult> GetTopSixTilesAsync(GetOverallSignificanceEnergyRequest request)
        {
            var result = await _energyManagementServices.GetTopSixTilesAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get top tiles reconciled data
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_top_tiles_reconciled_data")]
        public async Task<IActionResult> GetTopTileReconciledDataAsync(GetReconciledEnergyRequest request)
        {
            var result = await _energyManagementServices.GetTopTileReconciledDataAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get list of plants associated with affiliate
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_plant_affiliates")]
        public async Task<IActionResult> GetPlantAffiliates([FromBody] GetPlantAffiliatesRequest request)
        {

            var result = await _energyManagementServices.GetPlantAffiliatesAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// To get plant energy air water steam information
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_plant_energy_eci_air_water_steam")]
        public async Task<IActionResult> GetPlantEnergyEciAirWaterSteam([FromBody] GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetPlantEnergyEciAirWaterSteamAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_cw_cost_per_unit_trend")]
        public async Task<IActionResult> GetCwCostPerUnitTrend(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetCwCostPerUnitTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_cw_load_heat_rejection_trend")]
        public async Task<IActionResult> GetCwLoadHeatRejectionTrend(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetCwLoadHeatRejectionTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>

        [HttpPost("get_eci_trend")]
        public async Task<IActionResult> GetEciTrend(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetEciTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>

        [HttpPost("get_specific_energy_category")]
        public async Task<IActionResult> GetSpecificEnergyCategory(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetSpecificEnergyCategoryAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_specific_energy_category_equipment")]
        public async Task<IActionResult> GetSpecificEnergyCategoryEquipment(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetSpecificEnergyCategoryEquipmentAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_specific_energy_category_trend")]
        public async Task<IActionResult> GetSpecificEnergyCategoryEquipmentTrend(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetSpecificEnergyCategoryEquipmentTrendAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_top_six_tiles_plants")]
        public async Task<IActionResult> GetTopTilePlantsData(GetPlantEnergyEciAirWaterSteamRequest request)
        {
            var result = await _energyManagementServices.GetTopTilePlantsDataAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_energy_consumed_specific_energy")]
        public async Task<IActionResult> GetEnergyConsumedSpecificEnergy([FromBody] AffiliatePlantEquipmentAndCategoryTimeRangeRequest request)
        {
            var result = await _energyManagementServices.GetEnergyConsumedSpecificEnergyAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_energy_gap")]
        public async Task<IActionResult> GetEmEnergyGap(AffiliatePlantTimeRangeRequest request)
        {
            var result = await _energyManagementServices.GetEmEnergyGapAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpPost("get_equipment_list")]
        public async Task<IActionResult> GetEquipmentList([FromBody] AffiliateEquipmentCategoryPlantNameListRequest request)
        {
            var result = await _energyManagementServices.GetEquipmentListAsync(request);
            if (result == null)
            {
                return Ok(new Response<Array>(ResponseConstants.EMPTYOK, ResponseConstants.EMPTYOK_MESSAGE, ResponseConstants.EMPTYDATA));
            }
            else
            {
                return Ok(new Response<object>(result));
            }
        }
    }
}
