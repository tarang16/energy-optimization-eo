using Moq;
using Xunit;
using System.Security.Claims;
using EODomain.Models.Account;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.LogTables;
using EOInfrastructure.Services;
using Microsoft.AspNetCore.Http;
using EOWebMicroservice.Controllers;
using EOApplication.Contracts.Services;
using Microsoft.Extensions.Configuration;
using EOApplication.Contracts.Repositories;
using EOWebMicroservice.Controllers.v1;
using System.Diagnostics.CodeAnalysis;
using EODomain.Common;
using EODomain.Models.Favorites;
using FakeItEasy;
using EODomain.Models.Requests;
using EODomain.Models.EnergyManagement;
using EODomain.Models.Optimization;
using EODomain.Models.Network;
using System.Net;
using System.Dynamic;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class OptimizationTests
    {
        private readonly OptimizationServices optimizationServicesMock;
        private readonly Mock<IOptimizationRepository> optimizationRepositoryMock;
        private readonly Mock<IAccountRepository> accountRepositoryMock;
        private readonly Mock<IConfiguration> congfigurationMock;
        private readonly OptimizationController controller;
        public OptimizationTests()
        {
            optimizationRepositoryMock = new Mock<IOptimizationRepository>();
            accountRepositoryMock = new Mock<IAccountRepository>();
            congfigurationMock = new Mock<IConfiguration>();

            
            var rmWhatIfDemandURLSection = new Mock<IConfigurationSection>();
            rmWhatIfDemandURLSection.Setup(x => x.Value).Returns("http://dummy-url.com");

            var rmWhatIfDemandSettingSection = new Mock<IConfigurationSection>();
            rmWhatIfDemandSettingSection.Setup(x => x.GetSection("RMWhatIfDemandURL"))
                                        .Returns(rmWhatIfDemandURLSection.Object);

            congfigurationMock.Setup(x => x.GetSection("RMWhatIfDemandSetting"))
                              .Returns(rmWhatIfDemandSettingSection.Object);

            optimizationServicesMock = new OptimizationServices(optimizationRepositoryMock.Object);
            controller = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
        }

        [Fact]
        public async Task GetDemandInputsReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            List<GetDemandInputsStoredProcedureResponse> response = new List<GetDemandInputsStoredProcedureResponse>() {
                new GetDemandInputsStoredProcedureResponse
                {
                    plantName= It.IsAny<string>(),
                    caseId=It.IsAny<int>(),
                    energyCategory=It.IsAny<string>(),
                    type = It.IsAny<string>(),
                    tagName = It.IsAny<string>(),
                    actual = It.IsAny<decimal>()
                }
            };
            optimizationRepositoryMock.Setup(s => s.GetDemandInputsAsync(request))
                                     .ReturnsAsync(response);

            // Act
            var result = await controller.GetDemandInputs(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var okresponse = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task GetDemandInputsReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            List<GetDemandInputsStoredProcedureResponse> response = new List<GetDemandInputsStoredProcedureResponse>() {
                new GetDemandInputsStoredProcedureResponse
                {
                    plantName= It.IsAny<string>(),
                    caseId=It.IsAny<int>(),
                    energyCategory=It.IsAny<string>(),
                    type = It.IsAny<string>(),
                    tagName = It.IsAny<string>(),
                    actual = It.IsAny<decimal>()
                }
            };
            optimizationRepositoryMock.Setup(s => s.GetDemandInputsAsync(request))
                                     .ReturnsAsync(new List<GetDemandInputsStoredProcedureResponse>());

            // Act
            var result = await controller.GetDemandInputs(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetAssetAvailabilityReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            optimizationRepositoryMock.Setup(s => s.GetAssetAvailabilityAsync(request))
                                     .ReturnsAsync(new object());

            // Act
            var result = await controller.GetAssetAvailability(request);
            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetAssetAvailabilityReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            optimizationRepositoryMock.Setup(s => s.GetAssetAvailabilityAsync(request))
                                     .ReturnsAsync(null);

            // Act
            var result = await controller.GetAssetAvailability(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetPlantLoadReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            optimizationRepositoryMock.Setup(s => s.GetPlantLoadAsync(request))
                                     .ReturnsAsync(new object());

            // Act
            var result = await controller.GetPlantLoad(request);
            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetPlantLoadReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            optimizationRepositoryMock.Setup(s => s.GetPlantLoadAsync(request))
                                     .ReturnsAsync(null);

            // Act
            var result = await controller.GetPlantLoad(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOutputMappingReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            optimizationRepositoryMock.Setup(s => s.GetOutputMappingAsync(request))
                                     .ReturnsAsync(new List<dynamic>());

            // Act
            var result = await controller.GetOutputMapping(request);
            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOutputMappingReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 100, time = new DateTime(2023, 5, 1) };
            optimizationRepositoryMock.Setup(s => s.GetOutputMappingAsync(request))
                                     .ReturnsAsync(()=>null!);

            // Act
            var result = await controller.GetOutputMapping(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOptimizationPriceInputReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 100 };
            optimizationRepositoryMock.Setup(s => s.GetOptimizationPriceInputAsync(request))
                                     .ReturnsAsync(new object());

            // Act
            var result = await controller.GetOptimizationPriceInput(request);
            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOptimizationPriceInputReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 100 };
            optimizationRepositoryMock.Setup(s => s.GetOptimizationPriceInputAsync(request))
                                     .ReturnsAsync(null);

            // Act
            var result = await controller.GetOptimizationPriceInput(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetWhatIfPlantParametersReturnsOkResultWhenDataFound()
        {
            //Arrange
            var request = new GetWhatIfPlantParametersRequest { caseID = 100, timeStamp = DateTime.Now };
            List<GetWhatIfPlantParametersResponse> response = new List<GetWhatIfPlantParametersResponse>() {
                new GetWhatIfPlantParametersResponse
                {
                    caseId=It.IsAny<int>(),
                    plantName= It.IsAny<string>(),
                    tagId=It.IsAny<int>(),
                    tagName = It.IsAny<string>(),
                    tagUiDisplayName = It.IsAny<string>(),
                    actual = It.IsAny<decimal>(),
                    optimum = It.IsAny<decimal>(),
                    uomName = It.IsAny<string>(),
                    modelId=It.IsAny<int>(),
                    modelTagId=It.IsAny<int>()
                }
            };

            optimizationRepositoryMock.Setup(s => s.GetWhatIfPlantParametersAsync(request))
                                    .ReturnsAsync(response);

            // Act
            var result = await controller.GetWhatIfPlantParameters(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetWhatIfPlantParametersReturnsOkResultWhenNoDataFound()
        {
            //Arrange
            var request = new GetWhatIfPlantParametersRequest { caseID = 100, timeStamp = DateTime.Now };

            optimizationRepositoryMock.Setup(s => s.GetWhatIfPlantParametersAsync(request))
                                    .ReturnsAsync(new List<GetWhatIfPlantParametersResponse>());

            // Act
            var result = await controller.GetWhatIfPlantParameters(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task WhatIfDemandCalculationReturnsOkResultWhenDataFound()
        {
            //Arrange
            var request = new WhatIfDemandCalculationRequest
            {
                caseID = 100,
                modelID = 100,
                time = DateTime.Now,
                data = new List<WhatIfDemandCalculationModel>
                {
                    new WhatIfDemandCalculationModel { modelTagId = 1, value = 10 }
                }
            };

            optimizationRepositoryMock
                .Setup(s => s.WhatIfDemandCalculationAsync(It.IsAny<WhatIfDemandCalculationRMRequest>()))
                .ReturnsAsync(new WhatIfDemandCalculationResponse
                {
                    status = HttpStatusCode.OK,
                    data = new List<WhatIfDemandJsonResponse>()
                });

            optimizationRepositoryMock
                .Setup(s => s.GetDemandInputsAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(new List<GetDemandInputsStoredProcedureResponse>());

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await optimizationController.WhatIfDemandCalculation(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task WhatIfDemandCalculationReturnsOkResultWhenNoDataFound()
        {
            //Arrange
            var request = new WhatIfDemandCalculationRequest
            {
                caseID = 100,
                modelID = 100,
                time = DateTime.Now,
                data = new List<WhatIfDemandCalculationModel>
                {
                    new WhatIfDemandCalculationModel { modelTagId = 1, value = 10 }
                }
            };

            optimizationRepositoryMock
                .Setup(s => s.WhatIfDemandCalculationAsync(It.IsAny<WhatIfDemandCalculationRMRequest>()))
                .ReturnsAsync(new WhatIfDemandCalculationResponse
                {
                    status = HttpStatusCode.NoContent,
                    data = new List<WhatIfDemandJsonResponse>()
                });

            optimizationRepositoryMock
                .Setup(s => s.GetDemandInputsAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(new List<GetDemandInputsStoredProcedureResponse>());

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfDemandCalculation(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task WhatIfOutputReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new WhatIfOutputRequest
            {
                caseID = 100,
                modelID = 100,
                time = DateTime.Now,
                data = new List<WhatIfOutputRequestModel>
                { 
                    new WhatIfOutputRequestModel { category = "Test", modelTagId = "10", value = "10", bias = "test", availability = "test", mustRun = "Test" } 
                }
            };

            optimizationRepositoryMock
                .Setup(s => s.WhatIfOutputAsync(It.IsAny<WhatIfOutputRMRequest>()))
                .ReturnsAsync(new WhatIfOutputResponse
                {
                    status = HttpStatusCode.OK,
                    data = new List<WhatIfOutputResponseModel>()
                });

            optimizationRepositoryMock
                .Setup(s => s.GetOutputMappingAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(new List<dynamic>());
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfOutput(request);

            // Assert         
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task WhatIfOutputReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new WhatIfOutputRequest
            {
                caseID = 100,
                modelID = 100,
                time = DateTime.Now,
                data = new List<WhatIfOutputRequestModel>
                {
                    new WhatIfOutputRequestModel { category = "Test", modelTagId = "10", value = "10", bias = "test", availability = "test", mustRun = "Test" }
                }
            };

            optimizationRepositoryMock
                .Setup(s => s.WhatIfOutputAsync(It.IsAny<WhatIfOutputRMRequest>()))
                .ReturnsAsync(new WhatIfOutputResponse
                {
                    status = HttpStatusCode.NotFound,
                    data = new List<WhatIfOutputResponseModel>()
                });

            optimizationRepositoryMock
                .Setup(s => s.GetOutputMappingAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(new List<dynamic>());
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfOutput(request);

            // Assert         
            Assert.IsType<OkObjectResult>(result);
        }

        #region GetDemandDataAsync
        [Fact]
        public async Task WhatIfDemandCalculation_ReturnsEmptyList_WhenResponseDataIsNull()
        {
            // Arrange
            var request = new WhatIfDemandCalculationRequest
            {
                caseID = 1,
                modelID = 1,
                time = DateTime.Now,
                data = new List<WhatIfDemandCalculationModel>()
            };

            optimizationRepositoryMock.Setup(r => r.WhatIfDemandCalculationAsync(It.IsAny<WhatIfDemandCalculationRMRequest>()))
                     .ReturnsAsync(new WhatIfDemandCalculationResponse
                     {
                         status = HttpStatusCode.OK,
                         data = null
                     });

            optimizationRepositoryMock.Setup(r => r.GetDemandInputsAsync(It.IsAny<CaseIdDateTimeRequest>()))
                     .ReturnsAsync(new List<GetDemandInputsStoredProcedureResponse>());

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await optimizationController.WhatIfDemandCalculation(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = result.Value as Response<object>;
            Assert.IsType<List<dynamic>>(response?.data);
            Assert.Empty((List<dynamic>)response.data!);
        }

        [Fact]
        public async Task WhatIfDemandCalculation_CreatesMatchedEntries_WhenModelTagIdMatches()
        {
            // Arrange
            var request = new WhatIfDemandCalculationRequest
            {
                caseID = 123,
                modelID = 1,
                time = DateTime.Now,
                data = new List<WhatIfDemandCalculationModel>
                {
                    new WhatIfDemandCalculationModel { modelTagId = 1001, value = 200 }
                }
            };

            var responseData = new List<WhatIfDemandJsonResponse>
            {
                new WhatIfDemandJsonResponse { modelTagId = 1001, tagName = "MatchedTag", tagValue = 200 }
            };

            var demandInputs = new List<GetDemandInputsStoredProcedureResponse>
            {
                new GetDemandInputsStoredProcedureResponse
                {
                    modelTagId = 1001,
                    tagName = "MatchedTag",
                    plantName = "PlantA",
                    type = "TypeX",
                    energyCategory = "Electricity",
                    caseId = 123
                }
            };

            optimizationRepositoryMock.Setup(r => r.WhatIfDemandCalculationAsync(It.IsAny<WhatIfDemandCalculationRMRequest>()))
                .ReturnsAsync(new WhatIfDemandCalculationResponse
                {
                    status = HttpStatusCode.OK,
                    data = responseData
                });

            optimizationRepositoryMock.Setup(r => r.GetDemandInputsAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(demandInputs);
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfDemandCalculation(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = result.Value as Response<object>;
            Assert.NotNull(response?.data);
        }

        [Fact]
        public async Task WhatIfDemandCalculation_CreatesNonMatchedEntries_WhenModelTagIdDoesNotMatch()
        {
            // Arrange
            var request = new WhatIfDemandCalculationRequest
            {
                caseID = 456,
                modelID = 2,
                time = DateTime.Now,
                data = new List<WhatIfDemandCalculationModel>
                {
                    new WhatIfDemandCalculationModel { modelTagId = 9999, value = 100 }
                }
            };

            var responseData = new List<WhatIfDemandJsonResponse>
            {
                new WhatIfDemandJsonResponse { modelTagId = 9999, tagName = "UnmatchedTag", tagValue = 100 }
            };

            optimizationRepositoryMock.Setup(r => r.WhatIfDemandCalculationAsync(It.IsAny<WhatIfDemandCalculationRMRequest>()))
                     .ReturnsAsync(new WhatIfDemandCalculationResponse
                     {
                         status = HttpStatusCode.OK,
                         data = responseData
                     });

            optimizationRepositoryMock.Setup(r => r.GetDemandInputsAsync(It.IsAny<CaseIdDateTimeRequest>()))
                     .ReturnsAsync(new List<GetDemandInputsStoredProcedureResponse>()); // empty = no match

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfDemandCalculation(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            var response = result.Value as Response<object>;
            Assert.NotNull(response?.data);
        }

        [Fact]
        public async Task WhatIfOutput_ReturnsOk_WhenDataIsValid()
        {
            // Arrange
            var request = new WhatIfOutputRequest
            {
                caseID = 100,
                modelID = 200,
                time = DateTime.UtcNow,
                data = new List<WhatIfOutputRequestModel>
                {
                    new WhatIfOutputRequestModel
                    {
                        category = "Test",
                        modelTagId = "100",
                        value = "50",
                        bias = "1.2",
                        availability = "Y",
                        mustRun = "N"
                    }
                }
            };

            optimizationRepositoryMock.Setup(r => r.WhatIfOutputAsync(It.IsAny<WhatIfOutputRMRequest>()))
                .ReturnsAsync(new WhatIfOutputResponse
                {
                    status = HttpStatusCode.OK,
                    data = new List<WhatIfOutputResponseModel>
                    {
                        new WhatIfOutputResponseModel
                        {
                            model_tag_id = 100,
                            optimum = "45.7",
                            actual = "42.1",
                            model_status = 1,
                            model_message = "OK"
                        }
                    }
                });

            optimizationRepositoryMock.Setup(r => r.GetOutputMappingAsync(It.IsAny<CaseIdDateTimeRequest>()))
              .ReturnsAsync(() =>
              {
                  dynamic dynObj = new ExpandoObject();
                  dynObj.caseId = 100;               
                  dynObj.sortId = 1;                 
                  dynObj.category = "Test";          
                  dynObj.uiDisplayName = "DisplayName"; 
                  dynObj.tagName = "TagX";           
                  dynObj.tagId = 123;                
                  dynObj.modelTagId = 100;          
                  dynObj.uomName = "bar";            
                  dynObj.actual = 40.0;              
                  dynObj.optimum = 45.7;             
                  dynObj.statusActual = "OK";        
                  dynObj.statusOptimum = 42.1;       
                  dynObj.flagAggregation = true;     
                  dynObj.benefitActual = 5.5;        
                  dynObj.statusModelTagId = null;    
                  dynObj.benefitModelTagId = null;
                  dynObj.polarityActual = 0;
                  return new List<dynamic> { dynObj };
              });
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfOutput(request);

            // Assert
           
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task WhatIfOutput_ReturnsOk_WhenStatusModelTagIdMatchesAndOptimumIsValidDouble()
        {
            // Arrange
            var request = new WhatIfOutputRequest
            {
                caseID = 100,
                modelID = 200,
                time = DateTime.UtcNow,
                data = new List<WhatIfOutputRequestModel>
                {
                    new WhatIfOutputRequestModel
                    {
                        category = "Test",
                        modelTagId = "100",
                        value = "50",
                        bias = "1.2",
                        availability = "Y",
                        mustRun = "N"
                    }
                }
            };

            optimizationRepositoryMock.Setup(r => r.WhatIfOutputAsync(It.IsAny<WhatIfOutputRMRequest>()))
                .ReturnsAsync(new WhatIfOutputResponse
                {
                    status = HttpStatusCode.OK,
                    data = new List<WhatIfOutputResponseModel>
                    {
                        new WhatIfOutputResponseModel
                        {
                            model_tag_id = 999, 
                            optimum = "45.67", 
                            actual = "42.1",
                            model_status = 1,
                            model_message = "OK"
                        }
                    }
                });

            optimizationRepositoryMock.Setup(r => r.GetOutputMappingAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(() =>
                {
                    dynamic dynObj = new ExpandoObject();
                    dynObj.caseId = 100;
                    dynObj.sortId = 1;
                    dynObj.category = "Test";
                    dynObj.uiDisplayName = "DisplayName";
                    dynObj.tagName = "TagX";
                    dynObj.tagId = 123;
                    dynObj.modelTagId = 100;
                    dynObj.uomName = "bar";
                    dynObj.actual = 40.0;
                    dynObj.flagAggregation = true;
                    dynObj.statusActual = "OK";
                    dynObj.optimum = 45.7;
                    dynObj.statusOptimum = null;
                    dynObj.benefitActual = 5.5;
                    dynObj.polarityActual = null;
                    dynObj.statusModelTagId = 999;  
                    dynObj.benefitModelTagId = null;
                  
                    return new List<dynamic> { dynObj };
                });
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfOutput(request);

            // Assert
            
            Assert.IsType<OkObjectResult>(result);        
        }

        [Fact]
        public async Task WhatIfOutput_ReturnsOk_WhenBenefitModelTagIdMatchesAndActualIsValidDouble()
        {
            // Arrange
            var request = new WhatIfOutputRequest
            {
                caseID = 100,
                modelID = 200,
                time = DateTime.UtcNow,
                data = new List<WhatIfOutputRequestModel>
                {
                    new WhatIfOutputRequestModel
                    {
                        category = "Test",
                        modelTagId = "100",
                        value = "50",
                        bias = "1.2",
                        availability = "Y",
                        mustRun = "N"
                    }
                }
            };

            optimizationRepositoryMock.Setup(r => r.WhatIfOutputAsync(It.IsAny<WhatIfOutputRMRequest>()))
                .ReturnsAsync(new WhatIfOutputResponse
                {
                    status = HttpStatusCode.OK,
                    data = new List<WhatIfOutputResponseModel>
                    {
                        new WhatIfOutputResponseModel
                        {
                            model_tag_id = 888, 
                            optimum = "50.00",
                            actual = "33.77", 
                            model_status = 1,
                            model_message = "OK"
                        }
                    }
                });

            optimizationRepositoryMock.Setup(r => r.GetOutputMappingAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(() =>
                {
                    dynamic dynObj = new ExpandoObject();
                    dynObj.caseId = 100;
                    dynObj.sortId = 1;
                    dynObj.category = "Test";
                    dynObj.uiDisplayName = "DisplayName";
                    dynObj.tagName = "TagX";
                    dynObj.tagId = 123;
                    dynObj.modelTagId = 100;
                    dynObj.uomName = "bar";
                    dynObj.actual = 40.0;
                    dynObj.flagAggregation = true;
                    dynObj.statusActual = "OK";
                    dynObj.optimum = 50.0;
                    dynObj.statusOptimum = null;
                    dynObj.benefitActual = null;

                    dynObj.statusModelTagId = null;
                    dynObj.benefitModelTagId = 888;
                    dynObj.polarityActual = 1;
                    return new List<dynamic> { dynObj };
                });
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            var optimizationController = new OptimizationController(optimizationServicesMock, congfigurationMock.Object);
            optimizationController.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await optimizationController.WhatIfOutput(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);          
        }
        #endregion
    }
}
