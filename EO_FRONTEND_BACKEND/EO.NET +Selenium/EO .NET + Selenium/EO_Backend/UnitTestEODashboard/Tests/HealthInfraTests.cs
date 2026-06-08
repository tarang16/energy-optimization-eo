using Moq;
using Xunit;
using FakeItEasy;
using System.Data;
using EODomain.Common;
using System.Security.Claims;
using EODomain.Models.Config;
using EODomain.Models.Account;
using EODomain.Models.Network;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.Requests;
using Microsoft.AspNetCore.Http;
using EOInfrastructure.Services;
using Microsoft.Extensions.Options;
using EODomain.Models.RequestModels;
using System.Diagnostics.CodeAnalysis;
using EOWebMicroservice.Controllers.v1;
using EOApplication.Contracts.Services;
using EOApplication.Contracts.Repositories;
using System.Dynamic;
using Microsoft.Extensions.Configuration;
using EODomain.Models;
using EODomain.Models.InfraJobServices;
using EODomain.Models.AIHub;
using System.Net;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class HealthInfraTests
    {
        private readonly Mock<IHealthInfraRepository> mockHealthInfraRepository;
        private readonly Mock<IAccountRepository> accountRepositoryMock;
        private readonly HealthInfraServices healthInfraServicesMock;
        private readonly Mock<IConfiguration> mockConfiguration;
        private readonly HealthInfraController controller;
        private readonly Mock<IAccountServices> accountServicesMock;


        public HealthInfraTests()
        {
            mockHealthInfraRepository = new Mock<IHealthInfraRepository>();
            accountRepositoryMock = new Mock<IAccountRepository>();
            accountServicesMock = new Mock<IAccountServices>();
            mockConfiguration = new Mock<IConfiguration>();

            mockConfiguration.Setup(config => config.GetSection("ConnectionStrings:PiWebApiBaseURL").Value)
                     .Returns("http://mock-piwebapi-url");

            mockConfiguration.Setup(config => config.GetSection("ConnectionStrings:RapidMinerAIHubBaseURL").Value)
                             .Returns("http://mock-rapidminer-url");

            healthInfraServicesMock = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);

            controller = new HealthInfraController(healthInfraServicesMock, accountServicesMock.Object);
        }

        #region GetInfraMonitoringConnectivity
        [Fact]
        public void GetInfraMonitoringConnectivityAsyncResponseWhenBadRequest()
        {
            // Arrange
            GetInfraMonitoringRequest request = new GetInfraMonitoringRequest()
            {
                serviceType = "UnknownService",
                stime = DateTime.Parse("2025-04-10T13:00:00"), // later
                etime = DateTime.Parse("2025-04-10T12:00:00")  // earlier
            };

            // Act
            var result = controller.GetInfraMonitoringConnectivity(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
            Assert.Equal("Start time(sTime) cannot be a later time than end time(eTime)", response.errormsg);
        }
        [Fact]
        public void GetInfraMonitoringConnectivityAsyncResponseWhenDataExists()
        {
            // Arrange
            GetInfraMonitoringRequest request = new GetInfraMonitoringRequest()
            {
                serviceType = "WebServer",
                stime = DateTime.Parse("10-04-2025 08:00"),
                etime = DateTime.Parse("10-04-2025 12:00")
            };
            var expectedResult = new List<GetInfraMonitoringResponse>
            {
                new GetInfraMonitoringResponse
                {
                    infraId = 101,
                    ServiceUrl = "https://service.example.com/api/data",
                    Route = "/api/data",
                    ServiceType = "REST",
                    responseCode = 200,
                    response = "Success",
                    Value = 42,
                    IsActive = 1,
                    CreatedBy = 1,
                    CreatedOn = DateTime.Parse("2025-04-10T08:00:00"),
                    timeEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T08:00:00")).ToUnixTimeMilliseconds()
                },
                new GetInfraMonitoringResponse
                {
                    infraId = 102,
                    ServiceUrl = "https://service.example.com/api/status",
                    Route = "/api/status",
                    ServiceType = "REST",
                    responseCode = 503,
                    response = "Service Unavailable",
                    Value = null,
                    IsActive = 0,
                    CreatedBy = 2,
                    CreatedOn = DateTime.Parse("2025-04-10T12:00:00"),
                    timeEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T12:00:00")).ToUnixTimeMilliseconds()
                }
            };

            mockHealthInfraRepository.Setup(r => r.GetInfraMonitoringConnectivityAsync(request)).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetInfraMonitoringConnectivity(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetInfraMonitoringConnectivityAsyncResponseWhenNoData()
        {
            // Arrange
            GetInfraMonitoringRequest request = new GetInfraMonitoringRequest()
            {
                serviceType = "WebServer",
                stime = DateTime.Parse("10-04-2025 08:00"),
                etime = DateTime.Parse("10-04-2025 12:00")
            };
            var expectedResult = new List<GetInfraMonitoringResponse> { };

            mockHealthInfraRepository.Setup(r => r.GetInfraMonitoringConnectivityAsync(request)).ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetInfraMonitoringConnectivity(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetPIDataInfraMonitoringLagTrend
        [Fact]
        public void GetPIDataInfraMonitoringLagTrendAsyncResponseWhenBadRequest()
        {
            // Arrange
            GetPIDataInfraMonitoringLagTrendRequest request = new GetPIDataInfraMonitoringLagTrendRequest()
            {
                caseIDList = "101,102,103",
                stime = DateTime.Parse("2025-04-10T13:00:00"), // later
                etime = DateTime.Parse("2025-04-10T12:00:00")  // earlier
            };

            // Act
            var result = controller.GetPIDataInfraMonitoringLagTrend(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
            Assert.Equal("Start time(sTime) cannot be a later time than end time(eTime)", response.errormsg);
        }
        [Fact]
        public void GetPIDataInfraMonitoringLagTrendAsyncResponseWhenInvalidCaseId()
        {
            // Arrange
            GetPIDataInfraMonitoringLagTrendRequest request = new GetPIDataInfraMonitoringLagTrendRequest()
            {
                caseIDList = "101,102,103",
                stime = DateTime.Parse("10-04-2025 08:00"),
                etime = DateTime.Parse("10-04-2025 12:00")
            };
            accountServicesMock.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(request.caseIDList)).ReturnsAsync(10);
            // Act
            var result = controller.GetPIDataInfraMonitoringLagTrend(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
            Assert.Equal("Invalid caseIDs", response.errormsg);
        }
        [Fact]
        public void GetPIDataInfraMonitoringLagTrendAsyncResponseWhenDataExists()
        {
            // Arrange
            GetPIDataInfraMonitoringLagTrendRequest request = new GetPIDataInfraMonitoringLagTrendRequest()
            {
                caseIDList = "101,102,103",
                stime = DateTime.Parse("10-04-2025 08:00"),
                etime = DateTime.Parse("10-04-2025 12:00")
            };
            var expectedResult = new List<GetPIDataInfraMonitoringLagTrendResponse>
            {
                new GetPIDataInfraMonitoringLagTrendResponse
                {
                    caseID = 101,
                    infraId = 2001,
                    piTag = "TAG001",
                    responseCode = 200,
                    response = "Success",
                    value = 45.6,
                    timeStampUTC = DateTime.Parse("2025-04-10T10:00:00Z"),
                    createdOn = DateTime.Parse("2025-04-10T10:01:00Z"),
                    timestampEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T10:00:00Z")).ToUnixTimeSeconds(),
                    createdOnEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T10:01:00Z")).ToUnixTimeSeconds(),
                    diffInMinute = 1,
                    affiliateId = 501,
                    affiliateName = "Plant Alpha",
                    affiliateSapId = "SAP001",
                    systemName = "SystemX"
                },
                new GetPIDataInfraMonitoringLagTrendResponse
                {
                    caseID = 102,
                    infraId = 2002,
                    piTag = "TAG002",
                    responseCode = 404,
                    response = "Tag Not Found",
                    value = null,
                    timeStampUTC = null,
                    createdOn = DateTime.Parse("2025-04-10T11:00:00Z"),
                    timestampEpoch = null,
                    createdOnEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T11:00:00Z")).ToUnixTimeSeconds(),
                    diffInMinute = null,
                    affiliateId = 502,
                    affiliateName = "Plant Beta",
                    affiliateSapId = "SAP002",
                    systemName = "SystemY"
                }

            };
            accountServicesMock.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(request.caseIDList)).ReturnsAsync(3);
            mockHealthInfraRepository.Setup(r => r.GetPIDataInfraMonitoringLagTrendAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetPIDataInfraMonitoringLagTrend(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetPIDataInfraMonitoringLagTrendAsyncResponseWhenNoData()
        {
            // Arrange
            GetPIDataInfraMonitoringLagTrendRequest request = new GetPIDataInfraMonitoringLagTrendRequest()
            {
                caseIDList = "101,102,103",
                stime = DateTime.Parse("10-04-2025 08:00"),
                etime = DateTime.Parse("10-04-2025 12:00")
            };
            var expectedResult = new List<GetPIDataInfraMonitoringLagTrendResponse> { };

            accountServicesMock.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(request.caseIDList)).ReturnsAsync(3);
            mockHealthInfraRepository.Setup(r => r.GetPIDataInfraMonitoringLagTrendAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetPIDataInfraMonitoringLagTrend(request);
            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetInfraMonitoringCaseWiseAsync
        [Fact]
        public void GetInfraMonitoringCaseWiseAsyncResponseWhenDataExists()
        {
            // Arrange
            CaseIdListInputRequest request = new CaseIdListInputRequest()
            {
                caseIDList = "101,102,103"

            };
            var expectedResult = new List<dynamic>
            {
                new
                {
                    caseID = 101,
                    piTag = "TAG001",
                    response = "Success",
                    value = 45.6,
                    timeStampUTC = DateTime.Parse("2025-04-10T10:00:00Z")
                },
                new
                {
                    caseID = 102,
                    piTag = "TAG002",
                    response = "Tag Not Found",
                    value = (double?)null,
                    timeStampUTC = (DateTime?)null
                }
            };

            mockHealthInfraRepository.Setup(r => r.GetInfraMonitoringCaseWiseAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetInfraMonitoringCaseWiseAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetInfraMonitoringCaseWiseAsyncResponseWhenNoData()
        {
            // Arrange
            CaseIdListInputRequest request = new CaseIdListInputRequest()
            {
                caseIDList = "101,102,103"

            };
            var expectedResult = new List<dynamic> { };

            mockHealthInfraRepository.Setup(r => r.GetInfraMonitoringCaseWiseAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetInfraMonitoringCaseWiseAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetInfraMonitoringCaseWiseTrendAsync
        [Fact]
        public void GetInfraMonitoringCaseWiseTrendAsyncResponseWhenInvalidCaseId()
        {
            // Arrange
            GetInfraMonitoringCaseWiseRequest request = new GetInfraMonitoringCaseWiseRequest()
            {
                caseIDList = 10002
            };
            accountServicesMock.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(request.caseIDList.ToString()!)).ReturnsAsync(2);
            // Act
            var result = controller.GetInfraMonitoringCaseWiseTrendAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
            Assert.Equal("Invalid caseIDs", response.errormsg);
        }
        [Fact]
        public void GetInfraMonitoringCaseWiseTrendAsyncResponseWhenDataExists()
        {
            // Arrange
            GetInfraMonitoringCaseWiseRequest request = new GetInfraMonitoringCaseWiseRequest()
            {
                caseIDList = 10002
            };
            var expectedResult = new GetInfraMonitoringCaseWiseTrendResponse
            {
                caseID = 1001,
                plantName = "Plant Alpha",
                affiliateId = 501,
                affiliateName = "Affiliate A",
                affiliateSapId = 12345,
                systemName = "System-X",
                lastruntime = DateTime.Parse("2025-04-10T08:00:00Z"),
                lastruntimeEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T08:00:00Z")).ToUnixTimeSeconds(),
                infraID = 3001,
                piTag = "TAG001",
                responseCode = 200,
                response = "Success",
                value = 78.5m,
                timeStampUTC = DateTime.Parse("2025-04-10T07:58:00Z"),
                createdOn = DateTime.Parse("2025-04-10T08:01:00Z"),
                timeStampEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T07:58:00Z")).ToUnixTimeSeconds(),
                createdOnEpoch = new DateTimeOffset(DateTime.Parse("2025-04-10T08:01:00Z")).ToUnixTimeSeconds(),
                diffInMinute = 3
            };

            accountServicesMock.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(request.caseIDList.ToString()!)).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.GetInfraMonitoringCaseWiseTrendAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetInfraMonitoringCaseWiseTrendAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetInfraMonitoringCaseWiseTrendAsyncResponseWhenNoData()
        {
            // Arrange
            GetInfraMonitoringCaseWiseRequest request = new GetInfraMonitoringCaseWiseRequest()
            {
                caseIDList = 10002
            };
            GetInfraMonitoringCaseWiseTrendResponse expectedResult = null!;

            accountServicesMock.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(request.caseIDList.ToString()!)).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.GetInfraMonitoringCaseWiseTrendAsync(request)).ReturnsAsync(expectedResult!);

            // Act
            var result = controller.GetInfraMonitoringCaseWiseTrendAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region LogInfraServicesStatus
        [Fact]
        public void LogInfraServicesStatusReturnsOkWithData()
        {
            // Arrange
            string serviceUrl = string.Empty;
            string serviceType = string.Empty;
            var getInfraStatusFrequencyResponse = new GetInfraStatusFrequencyResponse()
            {
                InfraId = 1,
                ServiceUrl = "https://rmqa.sabic.com",
                Route = "/test",
                ServiceType = "ai_hub",
                LastTriggeredTime = DateTime.Now.AddMinutes(-6),
                MinuteFrequency = 5,
                IsActive = 1
            };
            var getInfraStatusFrequencyResponsePiTag = new GetInfraStatusFrequencyResponse()
            {
                InfraId = 1,
                ServiceUrl = "https://pi-vision.sabic.com/PIWEBAPI/",
                Route = "/test",
                ServiceType = "pi_tag",
                LastTriggeredTime = DateTime.Now.AddMinutes(-61),
                MinuteFrequency = 60,
                IsActive = 1
            };
            var getAllAvailablePITimeTagResponse = new GetAllAvailablePITimeTagResponse()
            {
                caseID = 1,
                tagName = "test_tag",
                affiliateName = "test_affiliate",
                plantName = "test_plant",
                systemName = "test_system",
            };
            var logInfraServicesResponse = new LogInfraServicesResponse()
            {
                ServiceUrl = "https://rmqa.sabic.com",
                Route = "/test",
                ServiceType = "ai_hub",
                ResponseCode = 200,
                Response = "test_json_response",
                Value = "1"
            };
            var logPiTagDataServicesResponse = new LogPiTagDataServicesResponse()
            {
                ServiceUrl = "https://pi-vision.sabic.com/PIWEBAPI/",
                Case_id = 1,
                PiTag = "test_tag",
                ResponseCode = 200,
                Response = "test_json_response",
                Value = 96.123457,
                Timestamp = DateTime.Now,
            };
            var lstLogInfraServicesResponse = new List<LogInfraServicesResponse>();
            var lstLogPiTagDataServicesResponse = new List<LogPiTagDataServicesResponse>();
            var lstAvailablePITimeTagResponse = new List<GetAllAvailablePITimeTagResponse>();
            lstLogInfraServicesResponse.Add(logInfraServicesResponse);
            lstLogPiTagDataServicesResponse.Add(logPiTagDataServicesResponse);
            lstAvailablePITimeTagResponse.Add(getAllAvailablePITimeTagResponse);
            var infraStatus = CommonMethod.ConvertMultipleToDataTable(lstLogInfraServicesResponse);
            var piTagData = CommonMethod.ConvertMultipleToDataTable(lstLogPiTagDataServicesResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(getInfraStatusFrequencyResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(getInfraStatusFrequencyResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(getInfraStatusFrequencyResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(getInfraStatusFrequencyResponsePiTag);
            mockHealthInfraRepository.Setup(r => r.LogInfraStatusAsync(infraStatus, 1, "")).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.LogPiDataInfraAsync(piTagData, 1, "")).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.GetAllAvailablePITimeTag()).ReturnsAsync(lstAvailablePITimeTagResponse);
            mockHealthInfraRepository.Setup(r => r.UpdateMasterInfraMonitoring(serviceUrl, serviceType, It.IsAny<string>())).ReturnsAsync(1);
            var healthInfraServicesMock = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object); var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.Request.Path).Returns("/user");
            var controller = new HealthInfraController(healthInfraServicesMock, accountServicesMock.Object);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task LogInfraServicesStatusOnlyAiHubTriggeredReturnsOk()
        {
            // Arrange
            var aiHubResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = DateTime.Now.AddMinutes(-6),
                MinuteFrequency = 5
            };
            var piTagResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = DateTime.Now,
                MinuteFrequency = 60
            };

            var logResponseList = new List<LogInfraServicesResponse>
            {
                new LogInfraServicesResponse { ServiceUrl = "https://pi-vision.sabic.com/PIWEBAPI/", ResponseCode = 200, Value = "test" }
            };

            var dtInfra = CommonMethod.ConvertMultipleToDataTable(logResponseList);

            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(piTagResponse);

            mockHealthInfraRepository.Setup(r => r.UpdateMasterInfraMonitoring(It.IsAny<string>(), "ai_hub", It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.LogInfraStatusAsync(It.IsAny<DataTable>(), 1, It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.GetAllAvailablePITimeTag()).ReturnsAsync(new List<GetAllAvailablePITimeTagResponse>());

            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var controller = new HealthInfraController(service, accountServicesMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };

            // Act
            var result = await controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task LogInfraServicesStatusOnlyPiTagTriggeredReturnsOk()
        {
            // Arrange
            var aiHubResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = DateTime.Now,
                MinuteFrequency = 5
            };
            var piTagResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = DateTime.Now.AddMinutes(-61),
                MinuteFrequency = 60
            };

            var logResponseList = new List<LogPiTagDataServicesResponse>
            {
                new LogPiTagDataServicesResponse { ServiceUrl = "https://pi-vision.sabic.com/PIWEBAPI/", Value = 123.45 }
            };

            var dtPi = CommonMethod.ConvertMultipleToDataTable(logResponseList);

            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(piTagResponse);

            mockHealthInfraRepository.Setup(r => r.UpdateMasterInfraMonitoring(It.IsAny<string>(), "pi_tag", It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.LogPiDataInfraAsync(It.IsAny<DataTable>(), 1, It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.GetAllAvailablePITimeTag()).ReturnsAsync(new List<GetAllAvailablePITimeTagResponse>
            {
                new GetAllAvailablePITimeTagResponse
                {
                    caseID = 1, tagName = "tag1", affiliateName = "a", plantName = "p", systemName = "s"
                }
            });

            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var controller = new HealthInfraController(service, accountServicesMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };

            // Act
            var result = await controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task LogInfraServicesStatusBothTriggeredReturnsOk()
        {
            // Arrange
            var pastTime = DateTime.Now.AddMinutes(-10);
            var aiHubResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = pastTime,
                MinuteFrequency = 5
            };
            var piTagResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = pastTime,
                MinuteFrequency = 5
            };

            var logInfraList = new List<LogInfraServicesResponse>
            {
                new LogInfraServicesResponse { ServiceUrl = "https://pi-vision.sabic.com/PIWEBAPI/", ResponseCode = 200, Value = "ok" }
            };
            var logPiTagList = new List<LogPiTagDataServicesResponse>
            {
                new LogPiTagDataServicesResponse { ServiceUrl = "https://pi-vision.sabic.com/PIWEBAPI/", Value = 123.45 }
            };

            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(piTagResponse);

            mockHealthInfraRepository.Setup(r => r.UpdateMasterInfraMonitoring(It.IsAny<string>(), "ai_hub", It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.UpdateMasterInfraMonitoring(It.IsAny<string>(), "pi_tag", It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.LogInfraStatusAsync(It.IsAny<DataTable>(), 1, It.IsAny<string>())).ReturnsAsync(1);
            mockHealthInfraRepository.Setup(r => r.LogPiDataInfraAsync(It.IsAny<DataTable>(), 1, It.IsAny<string>())).ReturnsAsync(1);

            mockHealthInfraRepository.Setup(r => r.GetAllAvailablePITimeTag()).ReturnsAsync(new List<GetAllAvailablePITimeTagResponse>
            {
                new GetAllAvailablePITimeTagResponse()
            });

            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var controller = new HealthInfraController(service, accountServicesMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

            // Act
            var result = await controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task LogInfraServicesStatusNeitherTriggeredReturnsOkWithoutRepositoryCalls()
        {
            // Arrange
            var currentTime = DateTime.Now;
            var aiHubResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = currentTime,
                MinuteFrequency = 5
            };
            var piTagResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = currentTime,
                MinuteFrequency = 60
            };

            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(piTagResponse);

            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var controller = new HealthInfraController(service, accountServicesMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

            // Act
            var result = await controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task LogInfraServicesStatus_AiHubLastTriggeredTimeIsNull_DoesNotTriggerLogging()
        {
            // Arrange
            var aiHubResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = null,
                MinuteFrequency = 5
            };
            var piTagResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = DateTime.Now,
                MinuteFrequency = 60
            };

            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(piTagResponse);

            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var controller = new HealthInfraController(service, accountServicesMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

            // Act
            var result = await controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task LogInfraServicesStatus_PiTagLastTriggeredTimeIsNull_DoesNotTriggerLogging()
        {
            // Arrange
            var aiHubResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = DateTime.Now,
                MinuteFrequency = 5
            };
            var piTagResponse = new GetInfraStatusFrequencyResponse
            {
                LastTriggeredTime = null,
                MinuteFrequency = 60
            };

            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("ai_hub_job_agent")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_conn")).ReturnsAsync(aiHubResponse);
            mockHealthInfraRepository.Setup(r => r.GetInfraStatusFrequencyResponse("pi_tag")).ReturnsAsync(piTagResponse);

            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var controller = new HealthInfraController(service, accountServicesMock.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };

            // Act
            var result = await controller.LogInfraServicesStatusAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
        #endregion

        #region GetListOfLogInfraServicesResponse
        [Fact]
        public async Task GetListOfLogInfraServicesResponseTokenIsNullReturnsNotAuthenticatedResponses()
        {
            // Arrange
            var mockRepo = new Mock<IHealthInfraRepository>();
            var serviceUrl = "https://pi-vision.sabic.com/PIWEBAPI/";
            var frequencyResponse = new GetInfraStatusFrequencyResponse
            {
                Route = "/test-route"
            };
            var frequencyResponseJobAgent = new GetInfraStatusFrequencyResponse();


            mockRepo.Setup(repo => repo.GetAIHubTokenAsync(It.IsAny<int>()))
                    .ReturnsAsync((TokenResponse)null!);

            var healthInfraServices = new HealthInfraServices(mockConfiguration.Object, mockRepo.Object);

            var initialLogList = new List<LogInfraServicesResponse>();
            var response = new HealthStatusResponse
            {
                state = 1,
                message = "Healthy"
            };

            // Act
            var result = await healthInfraServices.GetListOfLogInfraServicesResponse(
                response,
                initialLogList,
                frequencyResponse,
                frequencyResponseJobAgent,
                serviceUrl
            );

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);

            var aiHubResponse = result.FirstOrDefault(r => r.ServiceType == "ai_hub");
            var jobAgentResponse = result.FirstOrDefault(r => r.ServiceType == "ai_hub_job_agent");

            Assert.NotNull(aiHubResponse);
            Assert.Equal("0", aiHubResponse!.Value);
            Assert.Equal(ResponseConstants.AIHUBTOKENNOTGENERATED, aiHubResponse.Response);
            Assert.Equal(ResponseConstants.NOTAUTHENTICATED, aiHubResponse.ResponseCode);
            Assert.Equal(serviceUrl, aiHubResponse.ServiceUrl);
            Assert.Equal("/test-route", aiHubResponse.Route);

            Assert.NotNull(jobAgentResponse);
            Assert.Equal("0", jobAgentResponse!.Value);
            Assert.Equal(ResponseConstants.AIHUBTOKENNOTGENERATED, jobAgentResponse.Response);
            Assert.Equal(ResponseConstants.NOTAUTHENTICATED, jobAgentResponse.ResponseCode);
            Assert.Equal(serviceUrl, jobAgentResponse.ServiceUrl);
            Assert.Equal("/test-route", jobAgentResponse.Route);
        }
        #endregion

        #region GetListAiHubHealthLogResponse
        [Fact]
        public async Task GetListAiHubHealthLogResponseHealthCheckSuccessReturnsHealthyResponse()
        {
            // Arrange
            var token = "valid-token";
            var frequencyResponse = new GetInfraStatusFrequencyResponse { Route = "/test-route" };
            var frequencyResponseJobAgent = new GetInfraStatusFrequencyResponse();
            var serviceUrl = "https://pi-vision.sabic.com/PIWEBAPI/";
            var healthCheckResponse = new GetHealthCheckQueryResponse { healthy = true };

            mockHealthInfraRepository.Setup(repo => repo.GetHealthCheckAsync(token)).ReturnsAsync(healthCheckResponse);

            var initialLogList = new List<LogInfraServicesResponse>();
            var response = new HealthStatusResponse { state = 1, message = "Healthy" };

            // Act
            var result = await healthInfraServicesMock.GetListAiHubHealthLogResponse(
                token,
                new LogInfraServicesResponse(),
                response,
                initialLogList,
                frequencyResponse,
                frequencyResponseJobAgent,
                serviceUrl
            );

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("ai_hub", result[0].ServiceType);
            Assert.Equal("1", result[0].Value);
            Assert.Equal((int)HttpStatusCode.OK, result[0].ResponseCode);
        }

        [Fact]
        public async Task GetListAiHubHealthLogResponseHealthCheckFailureReturnsUnhealthyResponse()
        {
            // Arrange
            var token = "valid-token";
            var frequencyResponse = new GetInfraStatusFrequencyResponse { Route = "/test-route" };
            var frequencyResponseJobAgent = new GetInfraStatusFrequencyResponse();
            var serviceUrl = "https://pi-vision.sabic.com/PIWEBAPI/";
            var healthCheckResponse = new GetHealthCheckQueryResponse { healthy = false };

            mockHealthInfraRepository.Setup(repo => repo.GetHealthCheckAsync(token)).ReturnsAsync(healthCheckResponse);

            var initialLogList = new List<LogInfraServicesResponse>();
            var response = new HealthStatusResponse { state = 1, message = "Healthy" };

            // Act
            var result = await healthInfraServicesMock.GetListAiHubHealthLogResponse(
                token,
                new LogInfraServicesResponse(),
                response,
                initialLogList,
                frequencyResponse,
                frequencyResponseJobAgent,
                serviceUrl
            );

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("ai_hub", result[0].ServiceType);
            Assert.Equal("0", result[0].Value);
            Assert.Equal((int)HttpStatusCode.Unauthorized, result[0].ResponseCode);
        }

        [Fact]
        public async Task GetListAiHubHealthLogResponseHealthCheckThrowsExceptionReturnsUnhealthyResponse()
        {
            // Arrange
            var token = "valid-token";
            var frequencyResponse = new GetInfraStatusFrequencyResponse { Route = "/test-route" };
            var frequencyResponseJobAgent = new GetInfraStatusFrequencyResponse();
            var serviceUrl = "https://pi-vision.sabic.com/PIWEBAPI/";

            mockHealthInfraRepository.Setup(repo => repo.GetHealthCheckAsync(token))
                                     .ThrowsAsync(new Exception("Service unavailable"));

            var initialLogList = new List<LogInfraServicesResponse>();
            var response = new HealthStatusResponse { state = 1, message = "Healthy" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(async () =>
                await healthInfraServicesMock.GetListAiHubHealthLogResponse(
                    token,
                    new LogInfraServicesResponse(),
                    response,
                    initialLogList,
                    frequencyResponse,
                    frequencyResponseJobAgent,
                    serviceUrl
                )
            );

            Assert.Equal("Service unavailable", ex.Message);
        }
        #endregion

        #region GetAiHubJobAgentResponse
        [Fact]
        public void GetAiHubJobAgentResponseWithOneActiveAgentShouldReturnOkAndCorrectDetails()
        {
            // Arrange
            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var response = new HealthStatusResponse();
            var frequencyResponseJobAgent = new GetInfraStatusFrequencyResponse { Route = "/job-agent-route" };
            var queueResponse = new GetJobAgentsStateByQueueNameQueryResponse
            {
                jobAgents = new List<Jobagent>
                {
                    new Jobagent { state = "active" },
                    new Jobagent { state = "inactive" }
                }
            };

            // Act
            var result = HealthInfraServices.GetAiHubJobAgentResponse(
                new LogInfraServicesResponse(),
                response,
                "https://pi-vision.sabic.com/PIWEBAPI/",
                queueResponse,
                frequencyResponseJobAgent
            );

            // Assert
            Assert.Equal("1", result.Value);
            Assert.Equal((int)HttpStatusCode.OK, result.ResponseCode);
            Assert.Equal("ai_hub_job_agent", result.ServiceType);
            Assert.Equal("/job-agent-route", result.Route);
            Assert.Contains("\"details\":\"1\"", result.Response);
        }

        [Fact]
        public void GetAiHubJobAgentResponseWithNoActiveAgentsShouldReturnZeroDetails()
        {
            // Arrange
            var service = new HealthInfraServices(mockConfiguration.Object, mockHealthInfraRepository.Object);
            var response = new HealthStatusResponse();
            var frequencyResponseJobAgent = new GetInfraStatusFrequencyResponse { Route = "/job-agent-route" };
            var queueResponse = new GetJobAgentsStateByQueueNameQueryResponse
            {
                jobAgents = new List<Jobagent>
                {
                    new Jobagent { state = "inactive" },
                    new Jobagent { state = "stopped" }
                }
            };

            // Act
            var result = HealthInfraServices.GetAiHubJobAgentResponse(
                new LogInfraServicesResponse(),
                response,
                "https://pi-vision.sabic.com/PIWEBAPI/",
                queueResponse,
                frequencyResponseJobAgent
            );

            // Assert
            Assert.Equal("0", result.Value);
            Assert.Equal((int)HttpStatusCode.OK, result.ResponseCode);
            Assert.Equal("ai_hub_job_agent", result.ServiceType);
            Assert.Equal("/job-agent-route", result.Route);
            Assert.Contains("\"details\":\"0\"", result.Response);
        }
        #endregion


        #region MonitorPiConnectionService
        [Fact]
        public async Task MonitorPiConnectionServiceWhenPiConnectionIsValidShouldAddPopulatedLog()
        {
            // Arrange
            var frequencyResponse = new GetInfraStatusFrequencyResponse { Route = "/test-route" };
            var list = new List<LogInfraServicesResponse>();

            var piConnectionResponse = new PiConnectionResponse
            {
                piConnResponseCode = 200,
                piStatus = "1",
                piResponse = "You are authenticated"
            };

            mockHealthInfraRepository
                .Setup(repo => repo.GetPiConnectionResponse())
                .ReturnsAsync(piConnectionResponse);

            // Act
            var result = await healthInfraServicesMock.MonitorPiConnectionService(list, frequencyResponse);

            // Assert
            Assert.Single(result);
            var log = result.First();
            Assert.Equal(200, log.ResponseCode);
            Assert.Equal("1", log.Value);
            Assert.Equal("You are authenticated", log.Response);
        }

        [Fact]
        public async Task MonitorPiConnectionServiceWhenPiConnectionIsNullShouldAddEmptyLog()
        {
            // Arrange
            var frequencyResponse = new GetInfraStatusFrequencyResponse { Route = "/test-route" };
            var list = new List<LogInfraServicesResponse>();

            mockHealthInfraRepository
                .Setup(repo => repo.GetPiConnectionResponse())
                .ReturnsAsync((PiConnectionResponse)null!);

            // Act
            var result = await healthInfraServicesMock.MonitorPiConnectionService(list, frequencyResponse);

            // Assert
            Assert.Single(result);
            var log = result.First();
            Assert.Null(log.ServiceUrl);
            Assert.Null(log.Route);
            Assert.Null(log.ServiceType);
            Assert.Null(log.Response);
        }
        #endregion

        #region GetAllPiTagServiceResponse
        [Fact]
        public async Task GetAllPiTagServiceResponseWhenUnableToConnectShouldAddErrorLog()
        {
            var item = new GetAllAvailablePITimeTagResponse { caseID = 123, tagName = "Tag1" };
            var list = new List<LogPiTagDataServicesResponse>();

            mockHealthInfraRepository
                .Setup(repo => repo.GetWebIDForStatusByCaseID("Tag1"))
                .ReturnsAsync(ResponseConstants.UNABLE_TO_CONNECT_TO_PI);

            var result = await healthInfraServicesMock.GetAllPiTagServiceResponse(item, list);

            Assert.Single(result);
            var log = result.First();
            Assert.Equal(ResponseConstants.NOTAUTHENTICATED, log.ResponseCode);
            Assert.Equal(ResponseConstants.UNABLE_TO_CONNECT_TO_PI, log.Response);
        }

        [Fact]
        public async Task GetAllPiTagServiceResponseWhenServiceIsDownShouldAddErrorLog()
        {
            var item = new GetAllAvailablePITimeTagResponse { caseID = 123, tagName = "Tag2" };
            var list = new List<LogPiTagDataServicesResponse>();

            mockHealthInfraRepository
                .Setup(repo => repo.GetWebIDForStatusByCaseID("Tag2"))
                .ReturnsAsync(ResponseConstants.PI_SERVICE_IS_DOWN);

            var result = await healthInfraServicesMock.GetAllPiTagServiceResponse(item, list);

            Assert.Single(result);
            var log = result.First();
            Assert.Equal(ResponseConstants.SERVERERROR, log.ResponseCode);
            Assert.Equal(ResponseConstants.PI_SERVICE_IS_DOWN, log.Response);
        }

        [Fact]
        public async Task GetAllPiTagServiceResponseWhenWebIDNotFoundShouldAddErrorLog()
        {
            var item = new GetAllAvailablePITimeTagResponse { caseID = 123, tagName = "Tag3" };
            var list = new List<LogPiTagDataServicesResponse>();

            mockHealthInfraRepository
                .Setup(repo => repo.GetWebIDForStatusByCaseID("Tag3"))
                .ReturnsAsync(ResponseConstants.PI_WEB_ID_NOT_FOUND);

            var result = await healthInfraServicesMock.GetAllPiTagServiceResponse(item, list);

            Assert.Single(result);
            var log = result.First();
            Assert.Equal(ResponseConstants.EMPTYOK, log.ResponseCode);
            Assert.Equal(ResponseConstants.PI_WEB_ID_NOT_FOUND, log.Response);
        }

        [Fact]
        public async Task GetAllPiTagServiceResponseWhenWebIDIsUnknownFormatShouldAddErrorLog()
        {
            var item = new GetAllAvailablePITimeTagResponse { caseID = 123, tagName = "Tag4" };
            var list = new List<LogPiTagDataServicesResponse>();

            mockHealthInfraRepository
                .Setup(repo => repo.GetWebIDForStatusByCaseID("Tag4"))
                .ReturnsAsync("some-non-webid-response");

            var result = await healthInfraServicesMock.GetAllPiTagServiceResponse(item, list);

            Assert.Single(result);
            var log = result.First();
            Assert.Equal(0, log.ResponseCode); // webidStatusCode default
            Assert.Equal("some-non-webid-response", log.Response);
        }

        [Fact]
        public async Task GetAllPiTagServiceResponseWhenWebIDStartsWithWebidShouldFetchValues()
        {
            var item = new GetAllAvailablePITimeTagResponse { caseID = 123, tagName = "Tag5" };
            var list = new List<LogPiTagDataServicesResponse>();

            var webid = "webid=abcd1234&";

            mockHealthInfraRepository
                .Setup(repo => repo.GetWebIDForStatusByCaseID("Tag5"))
                .ReturnsAsync(webid);

            mockHealthInfraRepository
                .Setup(repo => repo.GetValuesForStatusByCaseID("http://mock-pi-urlstreamsets/value?" + webid))
                .ReturnsAsync(new GetValuesForStatusByCaseID
                {

                });

            var result = await healthInfraServicesMock.GetAllPiTagServiceResponse(item, list);

            Assert.NotNull(result);
        }
        #endregion

        #region GetAllPiTagDataServiceResponseByCaseId
        [Fact]
        public void GetAllPiTagDataServiceResponseByCaseIdWhenGetValuesIsNullReturnsOriginalList()
        {
            // Arrange
            var item = new GetAllAvailablePITimeTagResponse { caseID = 1, tagName = "TestTag" };
            var originalList = new List<LogPiTagDataServicesResponse>
            {
                new LogPiTagDataServicesResponse { Case_id = 1, PiTag = "ExistingTag" }
            };

            // Act
            var result = healthInfraServicesMock.GetAllPiTagDataServiceResponseByCaseId(item, null!, originalList);

            // Assert
            Assert.Equal(originalList.Count, result.Count);
            Assert.Equal("ExistingTag", result[0].PiTag);
        }

        [Fact]
        public void GetAllPiTagDataServiceResponseByCaseIdWhenItemsIsNullReturnsOriginalList()
        {
            // Arrange
            var item = new GetAllAvailablePITimeTagResponse { caseID = 1, tagName = "TestTag" };
            var getValues = new GetValuesForStatusByCaseID { Items = null };

            var originalList = new List<LogPiTagDataServicesResponse>
            {
                new LogPiTagDataServicesResponse { Case_id = 2, PiTag = "Tag2" }
            };

            // Act
            var result = healthInfraServicesMock.GetAllPiTagDataServiceResponseByCaseId(item, getValues, originalList);

            // Assert
            Assert.Equal(originalList.Count, result.Count);
            Assert.Equal("Tag2", result[0].PiTag);
        }

        [Fact]
        public void GetAllPiTagDataServiceResponseByCaseId_WhenItemsNotNull_CallsInternalMethod()
        {
            // Arrange
            var item = new GetAllAvailablePITimeTagResponse { caseID = 3, tagName = "TestTag" };

            var getValues = new GetValuesForStatusByCaseID
            {
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID
                    {
                        Value = new GetInterpolatedItemResponse
                        {
                            Value = 10.5,
                            Timestamp = DateTime.UtcNow,
                            UnitsAbbreviation = "bar"
                        }
                    }
                }
            };

            var originalList = new List<LogPiTagDataServicesResponse>();

            var expectedResponse = new List<LogPiTagDataServicesResponse>
            {
                new LogPiTagDataServicesResponse
                {
                    Case_id = 3,
                    PiTag = "TestTag",
                    Value = 10.5,
                    ServiceType = "pi_tag"
                }
            };

            var result = healthInfraServicesMock.GetAllPiTagDataServiceResponseByCaseId(item, getValues, originalList);

            // Assert
            Assert.Single(result);
            Assert.Equal("TestTag", result[0].PiTag);
            Assert.Equal(10.5, result[0].Value);
        }
        #endregion

        #region GetListLogPiTagDataServiceResponseByValueParseResult
        [Fact]
        public void ShouldAddValidParsedValueWhenValueIsDouble()
        {
            // Arrange
            var item = new GetAllAvailablePITimeTagResponse { caseID = 1, tagName = "TAG1" };
            var value = 123.45;
            var timestamp = DateTime.UtcNow;

            var valueStatus = new GetInterpolatedItemResponse
            {
                Value = value,
                Timestamp = timestamp,
                UnitsAbbreviation = "C",
                Good = true,
                Questionable = false,
                Substituted = false,
                Annotated = false
            };

            var getValues = new GetValuesForStatusByCaseID
            {
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID { Value = valueStatus }
                }
            };

            var list = new List<LogPiTagDataServicesResponse>();

            // Act
            var result = healthInfraServicesMock.GetListLogPiTagDataServiceResponseByValueParseResult(item, getValues, list);

            // Assert
            Assert.Single(result);
            Assert.Equal(123.45, result[0].Value);
            Assert.Equal("pi_tag", result[0].ServiceType);
        }

        [Fact]
        public void ShouldAddBadValue307WhenValueIsBadString()
        {
            // Arrange
            var item = new GetAllAvailablePITimeTagResponse { caseID = 2, tagName = "TAG2" };
            var timestamp = DateTime.UtcNow;

            var valueStatus = new GetInterpolatedItemResponse
            {
                Value = "Bad Input",
                Timestamp = timestamp,
                UnitsAbbreviation = "C",
                Good = false,
                Questionable = true,
                Substituted = true,
                Annotated = true
            };

            var getValues = new GetValuesForStatusByCaseID
            {
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID { Value = valueStatus }
                }
            };

            var list = new List<LogPiTagDataServicesResponse>();

            // Act
            var result = healthInfraServicesMock.GetListLogPiTagDataServiceResponseByValueParseResult(item, getValues, list);

            // Assert
            Assert.Single(result);
            Assert.Equal(307, result[0].Value);
            Assert.Equal("pi_tag", result[0].ServiceType);
        }

        [Fact]
        public void Should_Add_ZeroValue_When_ValueIsNonNumericWithoutBad()
        {
            // Arrange
            var item = new GetAllAvailablePITimeTagResponse { caseID = 3, tagName = "TAG3" };
            var timestamp = DateTime.UtcNow;

            var valueStatus = new GetInterpolatedItemResponse
            {
                Value = "SomeText",
                Timestamp = timestamp,
                UnitsAbbreviation = "K",
                Good = false,
                Questionable = true,
                Substituted = true,
                Annotated = true
            };

            var getValues = new GetValuesForStatusByCaseID
            {
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID { Value = valueStatus }
                }
            };

            var list = new List<LogPiTagDataServicesResponse>();

            // Act
            var result = healthInfraServicesMock.GetListLogPiTagDataServiceResponseByValueParseResult(item, getValues, list);

            // Assert
            Assert.Single(result);
            Assert.Equal(0, result[0].Value);
        }
        #endregion
    }
}