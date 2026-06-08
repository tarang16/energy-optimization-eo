using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.EnergyManagement;
using EODomain.Models.Requests;
using EOInfrastructure.Services;
using EOWebMicroservice.Controllers.v1;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Diagnostics.CodeAnalysis;
using Xunit;


namespace UnitTestEODashboard.Tests
{

    [ExcludeFromCodeCoverage]
    public  class EnergyManagementTests
    {
        private readonly EnergyManagementServices emServicesMock;
        private readonly Mock<IEnergyManagementRepository> emRepositoryMock;
        private readonly Mock<IAccountServices> accountServicesMock;
        private readonly EnergyManagementController controller;
        public EnergyManagementTests()
        {
            emRepositoryMock = new Mock<IEnergyManagementRepository>();
            emServicesMock = new EnergyManagementServices(emRepositoryMock.Object);            
            accountServicesMock = new Mock<IAccountServices>();
           
            controller = new EnergyManagementController(emServicesMock);
        }

        #region GetEnpiDailyTrend
        [Fact]
        public async Task GetEnpiDailyTrendReturnOkWhenDataFound()
        {
            // Arrange
            GetEnpiDailyTrendRequest request = new GetEnpiDailyTrendRequest
            {
                equipmentList=It.IsAny<string>(),
                equipmentCategoryList = It.IsAny<string>()
            };

            List<GetEnpiDailyTrendResponse> response = new List<GetEnpiDailyTrendResponse>() {
                new GetEnpiDailyTrendResponse
                {
                    kpiDate= It.IsAny<DateTime>(),
                    differenceValues=It.IsAny<Decimal>(),
                    negativeSumValues=It.IsAny<Decimal>(),
                    positiveSumValues = It.IsAny<Decimal>()
                }
            };

            //Set ups
            emRepositoryMock
                .Setup(r => r.GetEnpiDailyTrendAsync(request))
                .ReturnsAsync(response);

            // Act
            var result = await controller.GetEnpiDailyTrend(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var okResponse = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetEnpiDailyTrendReturnOkWhenNoDataFound()
        {
            // Arrange
            GetEnpiDailyTrendRequest request = new GetEnpiDailyTrendRequest
            {
                equipmentList = It.IsAny<string>(),
                equipmentCategoryList = It.IsAny<string>()
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEnpiDailyTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetEnpiDailyTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetEquipmentDesignCapacity
        [Fact]
        public void GetEquipmentDesignCapacityReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetEquipmentDesignCapacityRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                category = It.IsAny<string>(),
                eDate = It.IsAny<DateTime>(),
                equipment = It.IsAny<string>(),
                plantNameList = It.IsAny<string>(),
            };
            var mockDesignCapacity = new List<Dictionary<string, object>>()
            {
                new Dictionary<string, object> { { "key1", 123.456 }, { "key2", "value" } },
                new Dictionary<string, object> { { "key3", 789.123 }, { "key4", "another value" } }
            };
            emRepositoryMock.Setup(x => x.GetEquipmentDesignCapacity(request))
                            .ReturnsAsync(mockDesignCapacity);

            emRepositoryMock.Setup(x => x.GetKevStateUomAsync(It.IsAny<string>()))
                            .ReturnsAsync(new object());
                 
            // Act
            var result = controller.GetEquipmentDesignCapacity(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetEquipmentDesignCapacityReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetEquipmentDesignCapacityRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                category = It.IsAny<string>(),
                eDate = It.IsAny<DateTime>(),
                equipment = It.IsAny<string>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEquipmentDesignCapacity(request))
                        .ReturnsAsync(null);

           

            // Act
            var result = controller.GetEquipmentDesignCapacity(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetAirWaterSteamValues
        [Fact]  
        public void GetAirWaterSteamValuesReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetAirWaterSteamValuesRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetAirWaterSteamValuesAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetAirWaterSteamValues(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetAirWaterSteamValuesReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetAirWaterSteamValuesRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetAirWaterSteamValuesAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetAirWaterSteamValues(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetOverallSignificanceEnergy
        [Fact]
        public void GetOverallSignificanceEnergyReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetOverallSignificanceEnergyRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetOverallSignificanceEnergyAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetOverallSignificanceEnergy(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetOverallSignificanceEnergyReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetOverallSignificanceEnergyRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetOverallSignificanceEnergyAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetOverallSignificanceEnergy(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetEnergyCostIndexEnergyGapMonthlyIndex
        [Fact]
        public void GetEnergyCostIndexEnergyGapMonthlyIndexReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetEnergyCostIndexEnergyGapMonthlyIndexRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetEnergyCostIndexEnergyGapMonthlyIndexAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetEnergyCostIndexEnergyGapMonthlyIndex(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetEnergyCostIndexEnergyGapMonthlyIndexReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetEnergyCostIndexEnergyGapMonthlyIndexRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEnergyCostIndexEnergyGapMonthlyIndexAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetEnergyCostIndexEnergyGapMonthlyIndex(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetCWEnergyCostTrend
        [Fact]
        public void GetCWEnergyCostTrendReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetCWEnergyCostTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetCWEnergyCostTrendAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetCWEnergyCostTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetCWEnergyCostTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetCWEnergyCostTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetCWEnergyCostTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetCWEnergyCostTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetCWFlowRateTrend
        [Fact]
        public void GetCWFlowRateTrendOkWhenDataFound()
        {
            // Arrange
            var request = new GetCWFlowRateTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetCWFlowRateTrendAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetCWFlowRateTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetCWFlowRateTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetCWFlowRateTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetCWFlowRateTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetCWFlowRateTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetSteamTrend
        [Fact]
        public void GetSteamTrendOkWhenDataFound()
        {
            // Arrange
            var request = new GetSteamTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetSteamTrendAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetSteamTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetSteamTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetSteamTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetSteamTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetSteamTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetAirTrend
        [Fact]
        public void GetAirTrendOkWhenDataFound()
        {
            // Arrange
            var request = new GetAirTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetAirTrendAsync(request))
                            .ReturnsAsync(new object());

            // Act
            var result = controller.GetAirTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetAirTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetAirTrendRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetAirTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetAirTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetTopTileReconciledData
        [Fact]
        public void GetTopTileReconciledDataReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetReconciledEnergyRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>()
            };

            emRepositoryMock.Setup(x => x.GetTopTileReconciledDataAsync(request))
                .ReturnsAsync(new GetTopTileReconciledDataResponse());

            // Act
            var result = controller.GetTopTileReconciledDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetTopTileReconciledDataReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetReconciledEnergyRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>()
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetTopTileReconciledDataAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetTopTileReconciledDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetPlantAffiliates
        [Fact]
        public void GetPlantAffiliatesReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantAffiliatesRequest
            {
                affiliateID = 10
            };

            emRepositoryMock.Setup(x => x.GetPlantAffiliatesAsync(request))
                .ReturnsAsync(new GetTopTileReconciledDataResponse());

            // Act
            var result = controller.GetPlantAffiliates(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetPlantAffiliatesReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantAffiliatesRequest
            {
                affiliateID = 10
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetPlantAffiliatesAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetPlantAffiliates(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetPlantEnergyEciAirWaterSteam
        [Fact]
        public void GetPlantEnergyEciAirWaterSteamReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                affiliateID = 10
            };

            emRepositoryMock.Setup(x => x.GetPlantEnergyEciAirWaterSteamAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetPlantEnergyEciAirWaterSteam(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetPlantEnergyEciAirWaterSteamReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                affiliateID = 10
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetPlantEnergyEciAirWaterSteamAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetPlantEnergyEciAirWaterSteam(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetCwCostPerUnitTrend
        [Fact]
        public void GetCwCostPerUnitTrendReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetCwCostPerUnitTrendAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetCwCostPerUnitTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetCwCostPerUnitTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetCwCostPerUnitTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetCwCostPerUnitTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetEciTrend
        [Fact]
        public void GetEciTrendReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetEciTrendAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetEciTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetEciTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEciTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetEciTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetSpecificEnergyCategory
        [Fact]
        public void GetSpecificEnergyCategoryReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetSpecificEnergyCategoryAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetSpecificEnergyCategory(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetSpecificEnergyCategoryReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetSpecificEnergyCategoryAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetSpecificEnergyCategory(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetSpecificEnergyCategoryEquipment
        [Fact]
        public void GetSpecificEnergyCategoryEquipmentReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetSpecificEnergyCategoryEquipmentAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetSpecificEnergyCategoryEquipment(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetSpecificEnergyCategoryEquipmentReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetSpecificEnergyCategoryEquipmentAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetSpecificEnergyCategoryEquipment(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetTopSixTiles
        [Fact]
        public void GetTopSixTilesReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetOverallSignificanceEnergyRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetTopSixTilesAsync(request))
                .ReturnsAsync(new GetTopSixTilesResponse
                {
                    
                });

            emRepositoryMock.Setup(x => x.GetTopTileReconciledDataAsync(new GetReconciledEnergyRequest
                        {
                            affiliateID = 10,
                            eDate = It.IsAny<DateTime>(),
                            sDate = It.IsAny<DateTime>(),
                        })).ReturnsAsync(new GetTopTileReconciledDataResponse
                        {
                            reconciledEnergyCostIndex = 0,
                            reconciledEnergy = 1
                        });

            // Act
            var result = controller.GetTopSixTilesAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetTopSixTilesReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetOverallSignificanceEnergyRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetTopSixTilesAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetTopSixTilesAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetCwLoadHeatRejectionTrend
        [Fact]
        public void GetCwLoadHeatRejectionTrendReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetCwLoadHeatRejectionTrendAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetCwLoadHeatRejectionTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetCwLoadHeatRejectionTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetCwLoadHeatRejectionTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetCwLoadHeatRejectionTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetSpecificEnergyCategoryEquipmentTrend
        [Fact]
        public void GetSpecificEnergyCategoryEquipmentTrendReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetSpecificEnergyCategoryEquipmentTrendAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetSpecificEnergyCategoryEquipmentTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetSpecificEnergyCategoryEquipmentTrendReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetSpecificEnergyCategoryEquipmentTrendAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetSpecificEnergyCategoryEquipmentTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetTopTilePlantsData
        [Fact]
        public void GetTopTilePlantsDataReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetTopTilePlantsDataAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetTopTilePlantsData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetTopTilePlantsDataReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetPlantEnergyEciAirWaterSteamRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetTopTilePlantsDataAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetTopTilePlantsData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetEnergyConsumedSpecificEnergy
        [Fact]
        public void GetEnergyConsumedSpecificEnergyReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new AffiliatePlantEquipmentAndCategoryTimeRangeRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetEnergyConsumedSpecificEnergyAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetEnergyConsumedSpecificEnergy(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetEnergyConsumedSpecificEnergyReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new AffiliatePlantEquipmentAndCategoryTimeRangeRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEnergyConsumedSpecificEnergyAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetEnergyConsumedSpecificEnergy(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        #region GetEmEnergyGap
        [Fact]
        public void GetEmEnergyGapReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new AffiliatePlantTimeRangeRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            emRepositoryMock.Setup(x => x.GetEmEnergyGapAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetEmEnergyGap(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetEmEnergyGapReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new AffiliatePlantTimeRangeRequest
            {
                sDate = It.IsAny<DateTime>(),
                affiliateID = 10,
                eDate = It.IsAny<DateTime>(),
                plantNameList = It.IsAny<string>(),
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEmEnergyGapAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetEmEnergyGap(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion

        [Fact]
        public void GetEquipmentListReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new AffiliateEquipmentCategoryPlantNameListRequest
            {
                affiliateIdList = It.IsAny<string>(),
                equipmentcategoryList = It.IsAny<string>(),
                plantNameList = It.IsAny<string>()
            };

            emRepositoryMock.Setup(x => x.GetEquipmentListAsync(request))
                .ReturnsAsync(new object());

            // Act
            var result = controller.GetEquipmentList(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetEquipmentListReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new AffiliateEquipmentCategoryPlantNameListRequest
            {

                affiliateIdList = It.IsAny<string>(),
                equipmentcategoryList = It.IsAny<string>(),
                plantNameList = It.IsAny<string>()
            };

            var emServicesMock = new Mock<IEnergyManagementServices>();
            emServicesMock.Setup(x => x.GetEquipmentListAsync(request))
                        .ReturnsAsync(null);

            var controller = new EnergyManagementController(emServicesMock.Object);
            // Act
            var result = controller.GetEquipmentList(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
    }
}
