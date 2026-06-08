using Xunit;
using Moq;
using EOApplication.Contracts.Services;
using Microsoft.AspNetCore.Mvc;
using EOWebMicroservice.Controllers.v1;
using EODomain.Common;
using EODomain.Models.Config;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using EOApplication.Contracts.Repositories;
using EOInfrastructure.Services;
using FakeItEasy;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using EODomain.Models.Account.Workflow;

namespace UnitTestEODashboard.Tests
{
    public class PeOdsWorkflowTests
    {
        private readonly Mock<IPeOdsWorkflowServices> _mockPeOdsServices;
        private readonly Mock<IAccountServices> accountServicesMock = new Mock<IAccountServices>();
        private readonly Mock<IOptions<ConfigSettings>> mockConfigSettings = new Mock<IOptions<ConfigSettings>>();
        private readonly IConfiguration configuration;
        private readonly PeOdsWorkflowController _controller;
        private readonly PeOdsWorkflowServices _PeOdSServicesMock;
        private readonly Mock<IPeOdsWorkflowRepository> _mockRepository = new Mock<IPeOdsWorkflowRepository>();
        private readonly Mock<ClaimsIdentity> claimsIdentityMock = new Mock<ClaimsIdentity>();
        private readonly Mock<IWebHostEnvironment> _env;

        public PeOdsWorkflowTests()
        {
            var inMemorySettings = new Dictionary<string, string?>
            {
                {"PeEoOdsSettings:PeSettings:BaseURL", "https://example.com"}
            };

            configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var configSetting = new ConfigSettings
            {
                chunkSize = 100,
                cacheDuration = 100
            };

            _env = new Mock<IWebHostEnvironment>();
            _mockRepository = new Mock<IPeOdsWorkflowRepository>();
            mockConfigSettings.Setup(x => x.Value)
                    .Returns(configSetting);
            _mockPeOdsServices = new Mock<IPeOdsWorkflowServices>();

            _PeOdSServicesMock = new PeOdsWorkflowServices(_mockRepository.Object, configuration);
            _controller = new PeOdsWorkflowController(_PeOdSServicesMock, _env.Object);
        }

        #region GetPeOdsWorkflowActionLogsByRequestId
        /*
        commented for temporary 
        [Fact]
        public async Task GetPeOdsWorkflowActionLogsByRequestId_ShouldReturnApiError_WhenStatusCode421()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var expectedResult = new Response<List<GetOdsWorkflowActionLogsServiceLayerResponse>>
            {
                statuscode = StatusCodes.Status421MisdirectedRequest,
                errormsg = "Invalid endpoint",
                data = null
            };

            _mockRepository
                .Setup(r => r.GetPeOdsWorkflowActionLogsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetPeOdsWorkflowActionLogsByRequestId(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(421, response.statuscode);
            Assert.Equal("Invalid endpoint", response.errormsg);
        }

        [Fact]
        public async Task GetPeOdsWorkflowActionLogsByRequestId_ShouldReturnBadRequest_WhenDataIsNull()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var expectedResult = new Response<List<GetOdsWorkflowActionLogsServiceLayerResponse>>
            {
                statuscode = StatusCodes.Status200OK,
                data = null
            };

            _mockRepository
                .Setup(r => r.GetPeOdsWorkflowActionLogsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetPeOdsWorkflowActionLogsByRequestId(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(400, response.statuscode);
            Assert.Equal("NA", response.errormsg);
        }
        */
        [Fact]
        public async Task GetPeOdsWorkflowActionLogsByRequestId_ShouldReturnOk_WhenDataIsValid()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };

            var data = new List<GetOdsWorkflowActionLogsServiceLayerResponse>
            {
                new GetOdsWorkflowActionLogsServiceLayerResponse
                {
                    actionLogId = 1,
                    employeeId = "EMP001",
                    employeeName = "Test Employee",
                    email = "test@example.com",
                    roleName = "Supervisor",
                    action = "Approved",
                    actionId = 10,
                    comments = "Looks good",
                    attachments = new List<Attachments>
                    {
                        new Attachments { attachmentName = "report.pdf", attachmentUrl = "/files/report.pdf" }
                    },
                    createdOn = DateTime.UtcNow,
                    createdOnEpoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                }
            };

            var response = new Response<List<GetOdsWorkflowActionLogsServiceLayerResponse>>
            {
                statuscode = StatusCodes.Status200OK,
                data = data
            };

            _mockRepository
                .Setup(r => r.GetPeOdsWorkflowActionLogsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.GetPeOdsWorkflowActionLogsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetPeOdsWorkflowActionLogsByRequestId_ShouldReturnInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var exceptionMessage = "Something went wrong!";

            _mockRepository
                .Setup(r => r.GetPeOdsWorkflowActionLogsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception(exceptionMessage));

            // Act
            var result = await _controller.GetPeOdsWorkflowActionLogsByRequestId(request);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, objectResult.StatusCode);

        }
        #endregion

        #region GetOdsDataByRequestId
        [Fact]
        public async Task GetOdsDataByRequestId_ShouldReturnEmptyOk_WhenMetaDataAndDetailsAreNull()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var expectedResult = new Response<GetWorkflowMetaDataAndDetails>
            {
                data = new GetWorkflowMetaDataAndDetails
                {
                    metaData = null,
                    details = null
                }
            };

            _mockRepository
                .Setup(r => r.GetOdsDataByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetOdsDataByRequestId(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]

        public async Task GetOdsDataByRequestId_ShouldReturnOkWithData_WhenMetaDataOrDetailsAreNotNull()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var mockMetaData = new GetOdsAssigneeStoredProcedureResponse();
            var mockDetails = new GetOdsDataServiceLayerResponse();
            var data = new GetWorkflowMetaDataAndDetails
            {
                metaData = mockMetaData,
                details = null
            };

            var response = new Response<GetWorkflowMetaDataAndDetails>
            {
                data = data
            };

            _mockRepository
                .Setup(r => r.GetOdsDataByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.GetOdsDataByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseObject = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(responseObject);
            Assert.Equal(data, responseObject.data);
        }

        [Fact]
        public async Task GetOdsDataByRequestId_ShouldReturnInternalServerError_WhenExceptionIsThrown()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var exceptionMessage = "Something went wrong!";

            _mockRepository
                .Setup(r => r.GetOdsDataByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception(exceptionMessage));

            // Act
            var result = await _controller.GetOdsDataByRequestId(request);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, objectResult.StatusCode);
            Assert.Contains("Something went wrong", objectResult.Value?.ToString());
        }
        #endregion

        #region GetOdsActionSuggestionsByRequestId
        [Fact]
        public async Task GetOdsActionSuggestionsByRequestId_ReturnsOk_WithData()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };

            var mockData = new List<GetOdsActionSuggestionsStoredProcedureResponse>
            {
                new GetOdsActionSuggestionsStoredProcedureResponse
                {
                    suggestion = "Increase pressure",
                    actual = 45.5,
                    optimum = 50.0,
                    suggestedBy = "Test"
                }
            };

            var serviceResponse = new Response<List<GetOdsActionSuggestionsStoredProcedureResponse>>
            {
                statuscode = 200,
                data = mockData,
                errormsg = null
            };

            _mockRepository
                .Setup(r => r.GetOdsActionSuggestionsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetOdsActionSuggestionsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOdsActionSuggestionsByRequestId_ReturnsEmptyResponse_WhenNoData()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };
            var serviceResponse = new Response<List<GetOdsActionSuggestionsStoredProcedureResponse>>
            {
                statuscode = 200,
                data = new List<GetOdsActionSuggestionsStoredProcedureResponse>(),
                errormsg = null
            };

            _mockRepository
                .Setup(r => r.GetOdsActionSuggestionsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(serviceResponse);

            // Act
            var result = await _controller.GetOdsActionSuggestionsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOdsActionSuggestionsByRequestId_ReturnsInternalServerError_OnException()
        {
            // Arrange
            var request = new RequestIdEoRequest { requestID = 123 };

            _mockRepository
                .Setup(r => r.GetOdsActionSuggestionsByRequestId(request, It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.GetOdsActionSuggestionsByRequestId(request);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
        }
        #endregion

        #region GetWorkflowHistoricalDataForAllUsers
        [Fact]
        public async Task GetWorkflowHistoricalDataForAllUsers_ShouldReturnOkWithData_WhenDataExists()
        {
            // Arrange
            var request = new WorkflowCauseIDRequest { reqID = 100 };
            var mockHistory = new HistoryData
            {
                timeEpoch = 1717000000,
                employeeName = "Alice",
                comments = "Reviewed deviation",
                considerSuggestion = "Yes",
                suggestions = new List<WorkflowUserSuggestions>
                {
                    new WorkflowUserSuggestions
                    {
                        suggestion = "Adjust temperature",
                        actual = 95.0,
                        optimum = 90.0
                    }
                }
            };

            var serviceLayerResponse = new GetWorkflowHistoricalDataForAllUsersServiceLayerResponse
            {
                alertId = 1,
                deviationEpoch = 1716943000,
                lastOccurrenceEpoch = 1716949000,
                history = new List<HistoryData> { mockHistory }
            };

            var response = new Response<List<GetWorkflowHistoricalDataForAllUsersServiceLayerResponse>>
            {
                data = new List<GetWorkflowHistoricalDataForAllUsersServiceLayerResponse> { serviceLayerResponse }
            };

            _mockRepository
                .Setup(repo => repo.GetWorkflowHistoricalDataForAllUsersAsync(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.GetWorkflowHistoricalDataForAllUsers(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseObject = Assert.IsType<Response<object>>(okResult.Value);
            var actualData = Assert.IsType<List<GetWorkflowHistoricalDataForAllUsersServiceLayerResponse>>(responseObject.data);
        }

        [Fact]
        public async Task GetWorkflowHistoricalDataForAllUsers_ShouldReturnEmptyOk_WhenDataIsEmpty()
        {
            // Arrange
            var request = new WorkflowCauseIDRequest { reqID = 101 };
            var response = new Response<List<GetWorkflowHistoricalDataForAllUsersServiceLayerResponse>>
            {
                data = new List<GetWorkflowHistoricalDataForAllUsersServiceLayerResponse>()
            };

            _mockRepository
                .Setup(repo => repo.GetWorkflowHistoricalDataForAllUsersAsync(request, It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.GetWorkflowHistoricalDataForAllUsers(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseObject = Assert.IsType<Response<Array>>(okResult.Value);
        }

        [Fact]
        public async Task GetWorkflowHistoricalDataForAllUsers_ShouldReturnInternalServerError_WhenExceptionThrown()
        {
            // Arrange
            var request = new WorkflowCauseIDRequest { reqID = 102 };

            _mockRepository
                .Setup(repo => repo.GetWorkflowHistoricalDataForAllUsersAsync(request, It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Simulated failure"));

            // Act
            var result = await _controller.GetWorkflowHistoricalDataForAllUsers(request);

            // Assert
            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, objectResult.StatusCode);
            #endregion
        }
    }
}

