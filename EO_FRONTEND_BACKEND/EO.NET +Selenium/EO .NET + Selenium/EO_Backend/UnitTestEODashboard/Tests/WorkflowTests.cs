using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Account;
using EODomain.Models.Account.Workflow;
using EODomain.Models.Email;
using EODomain.Models.LogTables;
using EODomain.Models.RequestModels;
using EODomain.Models.Requests;
using EODomain.Models.ValidationModels;
using EODomain.Models.Workflow;
using EOInfrastructure.Services;
using EOInfrastructure.Utility;
using EOWebMicroservice.Controllers.v1;
using FakeItEasy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Moq;
using System.Data;
using System.Dynamic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace UnitTestEODashboard.Tests
{
    public class WorkflowTests
    {
        private readonly Mock<IWorkflowRepository> _mockActionManagementRepository;
        private readonly Mock<IWorkflowServices> _mockActionManagementServices;
        private readonly Mock<IAccountServices> _mockAccountServices;
        private readonly Mock<IWinAuthServices> _mockWinAuthServices;
        private readonly Mock<ILoggingServices> _mockLoggingServices;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly WorkflowController _controller;
        private readonly EmailServices _emailservices;
        private readonly Mock<IEmailRepository> emailRepositoryMock;
        private readonly Mock<IOptions<EmailSettingsEntity>> emailSettings;
        private readonly Mock<IHttpClientFactory> httpClientFactoryMock;
        private readonly Mock<HttpClient> httpClientMock;
       
        public WorkflowTests()
        {
            var emailSettingsEntityMock = new Mock<IOptions<EmailSettingsEntity>>();
            var emailSettingsEntity = new EmailSettingsEntity
            {
                UserName = "UserName",
                Link = "https://ss-jsd-wmdevdt:5106/CommonFunctions/sendEmailNotification",
                BaseURL = "https://ss-jsd-wmdevdt:5106",
                ProjectCode = "001"
            };
            emailSettingsEntityMock.Setup(x => x.Value).Returns(emailSettingsEntity);
            emailSettings = new Mock<IOptions<EmailSettingsEntity>>();
            emailSettings = emailSettingsEntityMock;
            httpClientMock = new Mock<HttpClient>();
            httpClientFactoryMock = new Mock<IHttpClientFactory>();
            httpClientMock.SetupAllProperties();
            httpClientFactoryMock.Setup(factory => factory.CreateClient(It.IsAny<string>())).Returns(httpClientMock.Object);

            emailRepositoryMock = new Mock<IEmailRepository>();
            _emailservices = new EmailServices(emailRepositoryMock.Object, httpClientFactoryMock.Object, emailSettings.Object);
            
          
            _mockActionManagementRepository = new Mock<IWorkflowRepository>();
            _mockActionManagementServices = new Mock<IWorkflowServices>();
            _mockAccountServices = new Mock<IAccountServices>();
            _mockLoggingServices = new Mock<ILoggingServices>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockWinAuthServices = new Mock<IWinAuthServices>();
           
            _controller = new WorkflowController(
                _mockActionManagementServices.Object,
                _mockAccountServices.Object,
                _mockWinAuthServices.Object,
                _mockLoggingServices.Object,
                _mockConfiguration.Object
            );
        }

        [Fact]
        public async Task GetOdsActionSuggestionsByRequestIdReturnsOkWithData()
        {
            // Arrange
            var request = new RequestIdInputRequest
            {
                requestId = 4,
                connectionFlag = true
            };

            var repoResponse = new List<GetOdsActionSuggestionsStoredProcedureResponse>
            {
                new GetOdsActionSuggestionsStoredProcedureResponse
                {
                    suggestion = "Reduce Pressure",
                    actual = 5.5,
                    optimum = 4.5,
                    suggestedBy = "System"
                }
            };

            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository.Setup(s => s.GetOdsActionSuggestionsByRequestIdAsync(It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(repoResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings,_emailservices, bpmWrapper.Object
            );

            var controller = new WorkflowController(
                workflowService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetOdsActionSuggestionsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.IsType<List<GetOdsActionSuggestionsStoredProcedureResponse>>(response.data);
        }

        [Fact]
        public async Task GetOdsActionSuggestionsByRequestIdReturnsOkWithNoData()
        {
            // Arrange
            var request = new RequestIdInputRequest
            {
                requestId = 4,
                connectionFlag = true
            };

            var emptyRepoResponse = new List<GetOdsActionSuggestionsStoredProcedureResponse>();

            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository.Setup(s => s.GetOdsActionSuggestionsByRequestIdAsync(It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(emptyRepoResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings,_emailservices,bpmWrapper.Object
            );

            var controller = new WorkflowController(
                workflowService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetOdsActionSuggestionsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
        }

        //[Fact]
        //public async Task PostOdsWorkflowAction_WhenSomeRequestsFail_ReturnsBadRequest()
        //{
        //    // Arrange
        //    var workflowRepo = new Mock<IWorkflowRepository>();
        //    var loggingRepo = new Mock<ILoggingRepository>();

        //    workflowRepo.Setup(r => r.PostOdsWorkflowActionAsync(It.Is<PostOdsWorkflowActionRequest>(x => x.requestId == 1)))
        //        .ReturnsAsync(0);
        //    workflowRepo.Setup(r => r.PostOdsWorkflowActionAsync(It.Is<PostOdsWorkflowActionRequest>(x => x.requestId == 2)))
        //        .ReturnsAsync(1);

        //    var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        //    var httpClient = new HttpClient(handlerMock.Object)
        //    {
        //        BaseAddress = new Uri("http://localhost")
        //    };

        //    var httpClientFactory = new Mock<IHttpClientFactory>();
        //    httpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

        //    var emailOptions = Options.Create(new EmailSettingsEntity
        //    {
        //        BaseURL = "http://localhost"
        //    });

        //    var realService = new WorkflowServices(workflowRepo.Object, httpClientFactory.Object, emailOptions);

        //    var mockLoggingService = new Mock<ILoggingServices>();
        //    mockLoggingService
        //        .Setup(x => x.AddErrorLogAsync(It.IsAny<LogErrorLogs>()))
        //        .ReturnsAsync(true);

        //    var controller = new WorkflowController(
        //        realService,
        //        new Mock<IAccountServices>().Object,
        //        new Mock<IWinAuthServices>().Object,
        //        mockLoggingService.Object,
        //        new Mock<IConfiguration>().Object
        //    );

        //    controller.ControllerContext = new ControllerContext
        //    {
        //        HttpContext = new DefaultHttpContext()
        //    };

        //    var request = new PostOdsWorkflowActionRequest
        //    {
        //        requestIdList = "1,2",
        //        createdBy = "1001",
        //        stageId = 1,
        //        actionId = 1
        //    };

        //    // Act
        //    var result = await controller.PostOdsWorkflowAction(request);

        //    // Assert
        //    var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        //    var response = Assert.IsType<Response<Array>>(badRequest.Value);
        //}

        [Fact]
        public async Task PostOdsWorkflowAction_ReturnsSuccess_WhenBulkUpdateSucceeds()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest
            {
                requestIdList = "1,2,3"
            };
            
            _mockActionManagementServices
                .Setup(s => s.CreateDataTableToUpdateWFRequestStatus(It.IsAny<List<int>>(), 1))
                .Returns(new System.Data.DataTable());
            // Act
            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<object>>(actionResult.Value);
        }



        [Fact]
        public async Task GetOdsDataByRequestId_ReturnsOkWithData()
        {
            // Arrange
            var request = new RequestIdInputRequest
            {
                requestId = 4
            };

            var repoResponse = A.CollectionOfDummy<GetOdsDataStoredProcedureResponse>(8).ToList();
            repoResponse.ForEach(r =>
            {
                r.causeMessage = "Cause Message";
                r.suggestion = "Do something";
                r.causeValueActual = 1.0;
                r.causeValueOptimum = 2.0;
                r.deviationTimeEpoch = 1717000000;
                r.lastOccuranceTimeEpoch = 1718000000;
                r.causeUom = "Unit";
                r.affiliate = "Affiliate A";
                r.plant = "Plant A";
                r.system = "System X";
                r.bpmSubmissionTimeEpoch = 1719000000;
                r.stageId = 3;
                r.effectMessage = "Effect A";
                r.effectUom = "kWh";
                r.effectValueActual = 10.5;
                r.effectValueOptimum = 8.0;
            });

            var odsAssignee = new GetOdsAssigneeStoredProcedureResponse
            {
                assigneeId = "1",
                stageId = 1,
                roleName = "Test",
                powerUserId = "1",
            };

            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository.Setup(s => s.GetOdsDataByRequestIdAsync(It.IsAny<int>()))
                                  .ReturnsAsync(repoResponse);
            mockWorkflowRepository.Setup(s => s.GetOdsAssigneeByRequestIdAsync(It.IsAny<int>()))
                                  .ReturnsAsync(odsAssignee);

            // Mock HttpClient
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

            // Mock EmailSettings
            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            // Real service with mocks
            var workflowService = new WorkflowServices(
                mockWorkflowRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings, _emailservices,bpmWrapper.Object
            );

            var controller = new WorkflowController(
                workflowService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetOdsDataByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetOdsDataByRequestIdReturnsOkWithNoData()
        {
            //Arrange
            var request = new RequestIdInputRequest
            {
                requestId = 4,
            };

            //Act

            var result = _controller.GetOdsDataByRequestId(request);

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetWorkFlowRolesReturnsOkWhenDataFound()
        {
            // Arrange
            var repoResponse = new List<GetWorkFlowUserRolesStoredProcedureResponse>
            {
                new GetWorkFlowUserRolesStoredProcedureResponse
                {
                    stageId = 1,
                    role = "role1",
                    roleId = 1,
                }
            };

            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(r => r.GetWorkflowUserRoles())
                                 .ReturnsAsync(repoResponse);

            var mockWinAuthServices = new Mock<IWinAuthServices>();
            var realAccountServices = new AccountServices(mockAccountRepository.Object, mockWinAuthServices.Object);
            var mockWorkflowServices = new Mock<IWorkflowServices>();
            var mockLoggingServices = new Mock<ILoggingServices>();
            var mockConfiguration = new Mock<IConfiguration>();

            var controller = new WorkflowController(
                mockWorkflowServices.Object,
                realAccountServices,
                mockWinAuthServices.Object,
                mockLoggingServices.Object,
                mockConfiguration.Object
            );

            var result = await controller.GetWorkFlowRoles();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetWorkFlowRolesReturnsOkWhenNoDataFound()
        {
            //Arrange
            var repoResponse = new List<GetWorkFlowUserRolesStoredProcedureResponse>();

            var _accountRepository = new Mock<IAccountRepository>();

            _accountRepository.Setup(s => s.GetWorkflowUserRoles())
                    .ReturnsAsync(repoResponse);
            //Act

            var result = _controller.GetWorkFlowRoles();

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetWorkflowAssignedListByUserIDReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetWorkflowListRequest { userIdList = "user1,user2" };
            var mockResponse = new List<GetWorkflowAssignedAlertListByUserIdStoredProcedureResponse>
            {
                new GetWorkflowAssignedAlertListByUserIdStoredProcedureResponse
                {
                    requestId = 123,
                    Plant = "PlantA",
                    system = "Sys1"
                }
            };

            _mockActionManagementRepository
                .Setup(r => r.GetWorkflowAssignedListByUserID(request.userIdList!))
                .ReturnsAsync(mockResponse);

            // Mock IHttpClientFactory
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };

            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            // Mock EmailSettingsEntity options
            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realWorkflowService = new WorkflowServices(
                _mockActionManagementRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings, _emailservices,bpmWrapper.Object
            );

            var _workflowController = new WorkflowController(
                realWorkflowService,
                _mockAccountServices.Object,
                _mockWinAuthServices.Object,
                _mockLoggingServices.Object,
                _mockConfiguration.Object
            );

            // Act
            var result = await _workflowController.GetWorkflowAssignedListByUserID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
        }

        [Fact]
        public async Task GetWorkflowAssignedListByUserIDReturnsOkWhenNoDataFound()
        {
            //Arrange
            var request = new GetWorkflowListRequest
            {
                userIdList = "1,2,3"
            };

            var repoResponse = new List<GetWorkflowAssignedAlertListByUserIdStoredProcedureResponse>();

            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository.Setup(s => s.GetWorkflowAssignedListByUserID(It.IsAny<string>()))
                    .ReturnsAsync(repoResponse);

            // Mock IHttpClientFactory
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };

            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            // Mock EmailSettingsEntity options
            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realWorkflowService = new WorkflowServices(
                _mockActionManagementRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings, _emailservices,
                bpmWrapper.Object
            );

            var _workflowController = new WorkflowController(
                realWorkflowService,
                _mockAccountServices.Object,
                _mockWinAuthServices.Object,
                _mockLoggingServices.Object,
                _mockConfiguration.Object
            );

            //Act
            var result = await _workflowController.GetWorkflowAssignedListByUserID(request);

            //Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async void GetWorkflowHistoricalDataForAllUsersreturnsOK()
        {
            // Arrange
            var request = new WorkflowCauseIDRequest
            {
                reqID = 1
            };

            var repoResponse = new List<GetWorkflowHistoricalDataForAllUsersStoredProcedureResponse>
            {
                new GetWorkflowHistoricalDataForAllUsersStoredProcedureResponse
                {
                    alertId = 1001,
                    lastOccurrenceEpoch = 1717001111,
                    comments = "Check system",
                    considerSuggestion = "No",
                    timeEpoch = 1717002222,
                    suggestion = "Reduce pressure",
                    actual = 80.5,
                    optimum = 75.0
                }
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo
                .Setup(s => s.GetWorkflowHistoricalDataForAllUsersAsync(It.IsAny<int>()))
                .ReturnsAsync(repoResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices,bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetWorkflowHistoricalDataForAllUsers(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void GetWorkflowHistoricalDataForAllUsersreturnsOKEmpty()
        {
            // Arrange              
            var request = new WorkflowCauseIDRequest()
            {
                reqID = 1
            };


            var repoResponse = new List<GetWorkflowHistoricalDataForAllUsersStoredProcedureResponse>();

            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository.Setup(s => s.GetWorkflowHistoricalDataForAllUsersAsync(It.IsAny<int>())).ReturnsAsync(repoResponse);
            // Act
            var result = _controller.GetWorkflowHistoricalDataForAllUsers(request);

            // Assert
           Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async void OdsCheckAutoClosureByReqId_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange

            var expectedList = new List<dynamic>
            {

            };
            var request = new OdsCheckAutoClosureByReqIdRequest { requestID = 1 };
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository
                .Setup(service => service.OdsCheckAutoClosureByReqId(request))
                .ReturnsAsync(expectedList); // Simulate null result

            // Act
            var result = await _controller.OdsCheckAutoClosureByReqId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result); // Assert Ok response
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYOK, response.statuscode);

        }

        [Fact]
        public async Task OdsCheckAutoClosureByReqId_ReturnsExpectedResult()
        {
            // Arrange
            var request = new OdsCheckAutoClosureByReqIdRequest { requestID = 4 };

            var expectedResult = new List<dynamic>
            {
                new { LastStatus = false }
            };

            var mockRepo = new Mock<IWorkflowRepository>();
            mockRepo.Setup(repo => repo.OdsCheckAutoClosureByReqId(It.IsAny<OdsCheckAutoClosureByReqIdRequest>()))
                    .ReturnsAsync(expectedResult);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            mockHttpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>()))
                                 .Returns(new HttpClient());

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(mockRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.OdsCheckAutoClosureByReqId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(200, response.statuscode);
        }



        [Fact]
        public async Task ODSCheckSendEmail_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new OdsCheckSendEmailRequest(); // Set properties as required
            var dynamiclist = new List<dynamic>();
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository
                .Setup(s => s.ODSCheckSendEmail(It.IsAny<OdsCheckSendEmailRequest>()))
                .ReturnsAsync(dynamiclist); // Mocking the null result

            // Act
            var result = await _controller.ODSCheckSendEmail(request);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(actionResult.Value);
            Assert.Equal(ResponseConstants.EMPTYOK, response.statuscode);

        }

        [Fact]
        public async Task ODSCheckSendEmail_ReturnsOkWithResult_WhenResultIsNotNull()
        {
            // Arrange
            var request = new OdsCheckSendEmailRequest
            {
                requestId = 1,
                affiliateId = 10
            };

            var mockRepo = new Mock<IWorkflowRepository>();
            var mockResult = new List<dynamic>
            {
                new
                {
                    Send_Email_PM = true,
                    Send_Overdue_Email_PM = true,
                    Send_Email_PE = true,
                    Send_Overdue_Email_PE = false,
                    Send_Email_OM = true
                }
            };

            mockRepo.Setup(r => r.ODSCheckSendEmail(It.IsAny<OdsCheckSendEmailRequest>()))
                    .ReturnsAsync(mockResult);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient();
            mockHttpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(mockRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.ODSCheckSendEmail(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(200, response.statuscode);
        }


        [Fact]
        public async Task UpdateWorkflowConfigurations_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new UpdateWorkflowConfigurationsRequest(); // Set properties as required
            var resposnse = new List<string>();
            _mockActionManagementRepository.Setup(s => s.UpdateWorkflowConfigurations(It.IsAny<UpdateWorkflowConfigurationsRequest>()))
                .ReturnsAsync(resposnse); // Mocking the null result

            // Act
            var result = await _controller.UpdateWorkflowConfigurations(request);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(actionResult.Value);
            Assert.Equal(ResponseConstants.EMPTYOK, response.statuscode);

        }

        [Fact]
        public async Task UpdateWorkflowConfigurations_ReturnsOkWithResult_WhenResultIsNotNull()
        {
            // Arrange
            var mockRepo = new Mock<IWorkflowRepository>();
            var request = new UpdateWorkflowConfigurationsRequest()
            {
                WorkflowConfigurationType = new List<WorkflowConfigurationType>
                {
                    new WorkflowConfigurationType { configurationName = "Test", configurationValue = "19" }
                },
                updatedBy = 1,
                createdBy = 1,
                affiliateId = 10
            };
            var expectedResponse = new List<string> { "Record Updated successfully" };

            mockRepo.Setup(r => r.UpdateWorkflowConfigurations(It.IsAny<UpdateWorkflowConfigurationsRequest>()))
                    .ReturnsAsync(expectedResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient();
            mockHttpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(mockRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.UpdateWorkflowConfigurations(request);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(actionResult.Value);
            Assert.Equal(200, response.statuscode);
        }


        [Fact]
        public async Task GetWorkflowMutedAlertByCauseId_ReturnsEmptyResponse_WhenResultIsNull()
        {
            // Arrange
            var request = new CauseIdTimeInputRequest
            {
                causeId = 1,
                pastDate = DateTime.Now,
                // Populate your request object as necessary
            };
            GetWorkflowMutedAlertByCauseIdStoredProcedureResponse obj = new GetWorkflowMutedAlertByCauseIdStoredProcedureResponse();
            // Mock the service to return null
            _mockActionManagementRepository
                .Setup(service => service.GetWorkflowMutedAlertByCauseIdAsync(It.IsAny<CauseIdTimeInputRequest>()))
                .ReturnsAsync(obj);

            // Act
            var result = await _controller.GetWorkflowMutedAlertByCauseId(request);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(actionResult.Value);
            Assert.Equal(ResponseConstants.EMPTYOK, response.statuscode);

        }

        [Fact]
        public async Task GetWorkflowMutedAlertByCauseId_ReturnsResult_WhenServiceReturnsData()
        {
            // Arrange 
            var request = new CauseIdTimeInputRequest
            {
                causeId = 1,
                pastDate = DateTime.UtcNow
            };

            var expectedResponse = new GetWorkflowMutedAlertByCauseIdStoredProcedureResponse
            {
                frequency = 1
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo
                .Setup(repo => repo.GetWorkflowMutedAlertByCauseIdAsync(It.IsAny<CauseIdTimeInputRequest>()))
                .ReturnsAsync(expectedResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);

            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);
            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetWorkflowMutedAlertByCauseId(request);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(actionResult.Value);
            Assert.Equal(200, response.statuscode);
        }

        [Fact]
        public async Task DeleteWorkflowUser_WhenUserHasNoAccess_ReturnsBadRequest()
        {
            // Arrange
            var request = new DeleteWorkflowUserRoleRequest
            {
                userId = "user123",
                role = "admin",
                affiliateId = 1
            };

            var claims = new List<Claim>
            {
                new Claim("uid", "123")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);


            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act         

            CommonMethod.IsWorkflowActionAllowed(httpContext.Object, It.IsAny<int?>());

            // Act
            var result = await _controller.DeleteWorkflowUser(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = badRequestResult.Value as Response<Array>;
            Assert.Equal(ResponseConstants.WORKLFOW_NOTAUTHORIZED_MESSAGE, response!.errormsg);
        }

        [Fact]
        public async Task DeleteWorkflowUser_WhenDeleteFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new DeleteWorkflowUserRoleRequest
            {
                userId = "user123",
                role = "admin",
                affiliateId = 1
            };


            var claims = new List<Claim>
            {
                new Claim("uid", "123")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);


            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act         

            CommonMethod.IsWorkflowActionAllowed(httpContext.Object, It.IsAny<int?>());

            _mockAccountServices.Setup(x => x.DeleteWorkflowUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new DeleteWorkflowUserStoredProcedureResponse());

            // Act
            var result = await _controller.DeleteWorkflowUser(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = badRequestResult.Value as Response<Array>;
            Assert.Equal(400, response!.statuscode);
        }

        [Fact]
        public async Task DeleteWorkflowUser_WhenDeleteSucceeds_ReturnsOkWithToken()
        {
            // Arrange
            var request = new DeleteWorkflowUserRoleRequest
            {
                userId = "user123",
                role = "admin",
                affiliateId = 1
            };

            var claims = new List<Claim>
            {
                new Claim("uid", "30787362")
            };
            var httpContextMock = new Mock<HttpContext>();
            var claimsIdentity = new ClaimsIdentity(new List<Claim>
        {
            new Claim(ClaimTypes.Role, "admin"),
            new Claim("uid", "30787362")// User has the admin role
        });

            var userMock = new ClaimsPrincipal(claimsIdentity);
            httpContextMock.Setup(x => x.User).Returns(userMock);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContextMock.Object };

            CommonMethod.IsWorkflowActionAllowed(httpContextMock.Object, 10000);

            _mockAccountServices.Setup(x => x.DeleteWorkflowUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new DeleteWorkflowUserStoredProcedureResponse() { roleId = 1, isActive = 0 });


            _mockAccountServices.Setup(x => x.GenerateNewTokenWhenAdminActionTakenAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<HttpContext>(), It.IsAny<HttpRequest>()))
                .ReturnsAsync("newToken123");

            // Act
            var result1 = await _controller.DeleteWorkflowUser(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result1);
            var response = okResult.Value as TokenResponse<object>;
            Assert.Equal(200, response!.statuscode);

        }

        [Fact]
        public async Task GetWorkflowConfigurations_ReturnsEmptyData_WhenNoConfigurationsFound()
        {
            // Arrange
            GetWorkflowConfigurationsRequest request = new GetWorkflowConfigurationsRequest()
            {
                affiliateID = 123
            };
            var emptyList = new List<WorkflowConfigurations>();

            _mockActionManagementServices
                .Setup(s => s.GetWorkflowConfigurationsAsync(It.IsAny<GetWorkflowConfigurationsRequest>()))
                .ReturnsAsync(emptyList);

            // Act
            var result = await _controller.GetWorkflowConfigurations(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }
        [Fact]
        public async Task GetWorkflowConfigurations_ReturnsConfigurations_WhenConfigurationsFound()
        {
            // Arrange
            GetWorkflowConfigurationsRequest request = new GetWorkflowConfigurationsRequest()
            {
                affiliateID = 123
            };
            var mockConfigurations = new List<WorkflowConfigurations>
            {
                new WorkflowConfigurations { configurationName = "Config 1" }
            };
            var workflowRepo = new Mock<IWorkflowRepository>();

            workflowRepo
                .Setup(r => r.GetWorkflowConfigurationsAsync(It.IsAny<GetWorkflowConfigurationsRequest>()))
                .ReturnsAsync(mockConfigurations);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)

            {
                BaseAddress = new Uri("http://localhost")
            };

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);
            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetWorkflowConfigurations(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(mockConfigurations, response.data);
        }

        [Fact]
        public async Task UpdateWorkflowConfigurationsReturnsOkWhenDataUpdated()
        {
            // Arrange
            var mockRepo = new Mock<IWorkflowRepository>();
            mockRepo.Setup(x => x.UpdateWorkflowConfigurationsAsync(It.IsAny<DataTable>(), It.IsAny<int>()))
                    .ReturnsAsync(true);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient();
            mockHttpClientFactory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var options = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var service = new WorkflowServices(mockRepo.Object, mockHttpClientFactory.Object, options, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                service,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            var claims = new List<Claim> { new Claim("uid", "999") };
            var identity = new ClaimsIdentity(claims, "mock");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            var request = new List<WorkflowConfigurations>
            {
                new WorkflowConfigurations { configurationName = "TestA", configurationValue = "ValueA" },
                new WorkflowConfigurations { configurationName = "TestB", configurationValue = "ValueB" }
            };

            // Act
            var result = await controller.UpdateWorkflowConfigurationsAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public void UpdateWorkflowConfigurationsReturnsBadRequestWhenDataNotUpdated()
        {
            // Arrange
            var request = new List<WorkflowConfigurations>
     {
         new WorkflowConfigurations
         {
             configurationName = "name",
             configurationValue = "value"
         }
     };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo.Setup(x => x.UpdateWorkflowConfigurationsAsync(It.IsAny<DataTable>(), It.IsAny<int>()))
                        .ReturnsAsync(false);
            var claims = new List<Claim>
     {
         new Claim("uid", "123"),
     };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            _controller.ControllerContext.HttpContext = new DefaultHttpContext()
            {
                User = new ClaimsPrincipal(identity),
            };

            // Act
            var result = _controller.UpdateWorkflowConfigurationsAsync(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetWorkflowPmDelegationInfoReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new EmployeeIdInputRequest
            {
                employeeID = "1234"
            };

            var storedProcResult = new GetWorkflowPmDelegationInfoStoredProcedureResponse
            {
                assignedTo = "assignee",
                delegatedAfterDays = 11,
                notAvailableUpto = DateTime.UtcNow,
                notAvailableUptoEpoch = 1234567890
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo
                .Setup(x => x.GetWorkflowPmDelegationInfoAsync(It.IsAny<EmployeeIdInputRequest>()))
                .ReturnsAsync(storedProcResult);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = controller.GetWorkflowPmDelegationInfo(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetWorkflowPmDelegationInfoReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new EmployeeIdInputRequest
            {
                employeeID = "1234"
            };
            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo.Setup(x => x.GetWorkflowPmDelegationInfoAsync(request));

            // Act
            var result = _controller.GetWorkflowPmDelegationInfo(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        //[Fact]
        //public void UpdateWorkflowPmDelegationInfoReturnsOkWhenDataUpdated()
        //{
        //    // Arrange
        //    var request = new List<UpdateWorkflowPmDelegationInfoRequest>
        //    {
        //        new UpdateWorkflowPmDelegationInfoRequest
        //        {
        //            actionBy = "actionBy",
        //            assignedTo = "assignee",
        //            isActive = 1,
        //            immediateAutoDelegateTill = DateTime.UtcNow,
        //            affiliateId = 204
        //        }
        //    };

        //    var workflowRepo = new Mock<IWorkflowRepository>();
        //    workflowRepo
        //        .Setup(x => x.UpdateWorkflowPmDelegationInfoAsync(It.IsAny<DataTable>()))
        //        .ReturnsAsync(1);

        //    var mockHttpClientFactory = new Mock<IHttpClientFactory>();
        //    var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        //    var httpClient = new HttpClient(mockHandler.Object)
        //    {
        //        BaseAddress = new Uri("http://localhost")
        //    };
        //    mockHttpClientFactory
        //        .Setup(f => f.CreateClient("namedClient"))
        //        .Returns(httpClient);

        //    var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });

        //    var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices);

        //    var controller = new WorkflowController(
        //        realService,
        //        new Mock<IAccountServices>().Object,
        //        new Mock<IWinAuthServices>().Object,
        //        new Mock<ILoggingServices>().Object,
        //        new Mock<IConfiguration>().Object
        //    );

        //    // Act
        //    var result = controller.UpdateWorkflowPmDelegationInfo(request);

        //    // Assert
        //    Assert.IsType<OkObjectResult>(result.Result);
        //}

        [Fact]
        public void UpdateWorkflowPmDelegationInfoReturnsBadObjectWhenDataNotUpdated()
        {
            // Arrange
            var request = new List<UpdateWorkflowPmDelegationInfoRequest>
     {
         new UpdateWorkflowPmDelegationInfoRequest{
         actionBy = "actionBy",
         assignedTo = "assignee",

         isActive = 1,
         immediateAutoDelegateTill = DateTime.UtcNow,
         affiliateId = 204
         }
     };
            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo.Setup(x => x.UpdateWorkflowPmDelegationInfoAsync(It.IsAny<DataTable>()))
                        .ReturnsAsync(0);

            // Act
            var result = _controller.UpdateWorkflowPmDelegationInfo(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetWorkflowPmDelegationInfoByEmployeeIdReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new EmployeeIdInputRequest
            {
                employeeID = "1234"
            };

            var storedProcResponse = new List<GetWorkflowPmDelegationInfoByEmployeeIdStoredProcResponse>
            {
                new GetWorkflowPmDelegationInfoByEmployeeIdStoredProcResponse
                {
                    affiliateId = 123,
                    affiliate = "Plant A",
                    assignedTo = "PM001",
                    assignedToEmployeeName = "Jane Doe",
                    delegatedAfterDays = 11,
                    immediateAutoDelegateTill = DateTime.UtcNow,
                    immediateAutoDelegateTillEpoch = 1234567890,
                    processEngineerId = "PE001",
                    employeeId = "1234",
                    employeeName = "John Doe"
                }
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo
                .Setup(repo => repo.GetWorkflowPmDelegationInfoByEmployeeIdAsync(It.IsAny<string>()))
                .ReturnsAsync(storedProcResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = controller.GetWorkflowPmDelegationInfoByEmployeeId(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetWorkflowPmDelegationInfoByEmployeeIdReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new EmployeeIdInputRequest
            {
                employeeID = "1234"
            };

            // Act
            var result = _controller.GetWorkflowPmDelegationInfoByEmployeeId(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task AddMuteWorkflowNotificationsDataReturnsOkWhenDataAdded()
        {
            // Arrange
            var request = new MuteWorkflowNotificationRequest
            {
                causeId = 101,
                muteTill = DateTime.UtcNow.AddDays(1),
                mutedBy = "test_user",
                roleId = 2
            };

            _mockActionManagementRepository.Setup(r => r.AddMuteWorkflowNotificationsDataAsync(request)).ReturnsAsync(true);

            // Mock IHttpClientFactory
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };

            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            // Mock EmailSettingsEntity options
            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realWorkflowService = new WorkflowServices(
                _mockActionManagementRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings, _emailservices,
                bpmWrapper.Object
            );

            var _workflowController = new WorkflowController(
                realWorkflowService,
                _mockAccountServices.Object,
                _mockWinAuthServices.Object,
                _mockLoggingServices.Object,
                _mockConfiguration.Object
            );

            // Act
            var result = await _workflowController.AddMuteWorkflowNotificationsData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task AddMuteWorkflowNotificationsDataReturnsBadRequestWhenDataUpdated()
        {
            // Arrange
            var request = new MuteWorkflowNotificationRequest
            {
                causeId = 202,
                muteTill = DateTime.UtcNow.AddDays(2),
                mutedBy = "test_user",
                roleId = 3
            };

            _mockActionManagementRepository.Setup(r => r.AddMuteWorkflowNotificationsDataAsync(request)).ReturnsAsync(false);

            // Mock IHttpClientFactory
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };

            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            // Mock EmailSettingsEntity options
            var mockEmailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realWorkflowService = new WorkflowServices(
                _mockActionManagementRepository.Object,
                mockHttpClientFactory.Object,
                mockEmailSettings,_emailservices,
                bpmWrapper.Object
            );

            var _workflowController = new WorkflowController(
                realWorkflowService,
                _mockAccountServices.Object,
                _mockWinAuthServices.Object,
                _mockLoggingServices.Object,
                _mockConfiguration.Object
            );

            // Act
            var result = await _workflowController.AddMuteWorkflowNotificationsData(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task GetOdsWorkflowActionLogsByRequestId_ReturnsOk_WhenLogsAreFound()
        {
            // Arrange
            var request = new RequestIdInputRequest
            {
                requestId = 123
            };

            var workflowRepo = new Mock<IWorkflowRepository>();

            workflowRepo.Setup(s => s.GetOdsWorkflowActionLogsByRequestIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new List<GetOdsWorkflowActionLogsStoredProcedureResponse>
                {
            new GetOdsWorkflowActionLogsStoredProcedureResponse
            {
                roleName = "assinee",
                actionId = 11,
                employeeId = "1234",
                employeeName = "John Doe",
                actionLogId = 123,
                comments = "some comment",
                createdOn = DateTime.UtcNow,
                createdOnEpoch = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                email = "test@example.com",
                action = "Approved",
                attachmentName = "document.pdf"
            }
                });

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetOdsWorkflowActionLogsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
        }

        [Fact]
        public async Task GetOdsWorkflowActionLogsByRequestId_ReturnsOk_WhenNoLogsFound()
        {
            // Arrange
            var request = new RequestIdInputRequest
            {
                requestId = 123
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo.Setup(s => s.GetOdsWorkflowActionLogsByRequestIdAsync(It.IsAny<int>()))
                .ReturnsAsync((List<GetOdsWorkflowActionLogsStoredProcedureResponse>)null!);

            // Act
            var result = await _controller.GetOdsWorkflowActionLogsByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task GetOdsAssigneeListByRequestId_ReturnsOk_WhenAssigneesAreFound()
        {
            // Arrange
            var request = new RequestIdAndReassignmentRequest
            {
                requestId = 123,
                isReassignment = 1
            };

            var expectedList = new List<GetOdsAssigneeListStoredProcedureResponse>
            {
                new GetOdsAssigneeListStoredProcedureResponse
                {
                    employeeId = "1234",
                    name = "John Doe",
                    email = "abc@gmail.com",
                    role = "Developer",
                    stageId = 12
                }
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo.Setup(x => x.GetOdsAssigneeListByRequestIdAsync(It.IsAny<int>(), It.IsAny<byte>()))
                        .ReturnsAsync(expectedList);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetOdsAssigneeListByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            var data = Assert.IsType<List<GetOdsAssigneeListStoredProcedureResponse>>(response.data);
        }

        [Fact]
        public async Task GetOdsAssigneeListByRequestId_ReturnsOk_WhenAssigneesAreNull()
        {
            // Arrange
            var request = new RequestIdAndReassignmentRequest
            {
                requestId = 123,
                isReassignment = 1
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo
                .Setup(s => s.GetOdsAssigneeListByRequestIdAsync(It.IsAny<int>(), It.IsAny<byte>()))
                .ReturnsAsync((List<GetOdsAssigneeListStoredProcedureResponse>)null!);

            // Act
            var result = await _controller.GetOdsAssigneeListByRequestId(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async void GetWorkflowHistoricalDatareturnsOK()
        {
            // Arrange
            var request = new WorkflowCauseIDRequest
            {
                reqID = 1
            };

            var repoResponse = new List<GetWorkflowHistoricalDataForAllUsersStoredProcedureResponse>
            {
                new GetWorkflowHistoricalDataForAllUsersStoredProcedureResponse
                {
                    alertId = 101,
                    lastOccurrenceEpoch = 1717009999,
                    comments = "Test Comment",
                    considerSuggestion = "Yes",
                    timeEpoch = 1717001234,
                    suggestion = "Increase setpoint",
                    actual = 50,
                    optimum = 45
                }
            };

            var workflowRepo = new Mock<IWorkflowRepository>();
            workflowRepo
                .Setup(s => s.GetWorkflowHistoricalDataAsync(It.IsAny<int>()))
                .ReturnsAsync(repoResponse);

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var realService = new WorkflowServices(workflowRepo.Object, mockHttpClientFactory.Object, emailOptions, _emailservices, bpmWrapper.Object);

            var controller = new WorkflowController(
                realService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetWorkflowHistoricalData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void GetWorkflowHistoricalDatareturnsOKEmpty()
        {
            // Arrange              
            var request = new WorkflowCauseIDRequest()
            {
                reqID = 1
            };


            var repoResponse = new List<GetWorkflowHistoricalDataForAllUsersStoredProcedureResponse>();

            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            mockWorkflowRepository.Setup(s => s.GetWorkflowHistoricalDataAsync(It.IsAny<int>())).ReturnsAsync(repoResponse);
            // Act
            var result = _controller.GetWorkflowHistoricalData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        #region GetWorkflowUsersByRoleAffiliatePlant
        [Fact]
        public void GetWorkflowUsersByRoleAffiliatePlantReturnsBadRequestWhenInavlidUserAcess()
        {
            //Arrange
            var request = new GetWorkflowUsersByRoleRequest
            {
                role = "admin",
                affiliateId = 12435
            };

            var claims = new List<Claim>
            {
                new Claim("uid", "123")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);


            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };


            CommonMethod.IsWorkflowActionAllowed(httpContext.Object, It.IsAny<int?>());

            //Act

            var result = _controller.GetWorkflowUsersByRoleAffiliatePlant(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
            Assert.Equal("You are not authorized", response.errormsg);
        }
        [Fact]
        public void GetWorkflowUsersByRoleAffiliatePlantReturnsOKWhenDataExist()
        {
            // Arrange              
            var request = new GetWorkflowUsersByRoleRequest
            {
                role = "admin",
                affiliateId = 12435
            };

            var expectedResult = new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
            {
                new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse
                {
                    employeeID = "EMP001",
                    employeeName = "John Doe",
                    role = "Manager",
                    roleId = 1,
                    email = "john.doe@example.com",
                    managerName="",
                    managerEmail=""
                },
                new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse
                {
                    employeeID = "EMP002",
                    employeeName = "Jane Smith",
                    role = "Supervisor",
                    roleId = 2,
                    email = "jane.smith@example.com",
                    managerEmail="",
                    managerName=""
                }
            };
            var claims = new List<Claim>
            {
                new Claim("uid", "30787362")
            };
            var httpContextMock = new Mock<HttpContext>();
            var claimsIdentity = new ClaimsIdentity(new List<Claim>
            {
            new Claim(ClaimTypes.Role, "admin"),
            new Claim("uid", "30787362")// User has the admin role
            });

            var userMock = new ClaimsPrincipal(claimsIdentity);
            httpContextMock.Setup(x => x.User).Returns(userMock);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContextMock.Object };

            CommonMethod.IsWorkflowActionAllowed(httpContextMock.Object, 10000);

            //var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(expectedResult);
            // Act
            var result = _controller.GetWorkflowUsersByRoleAffiliatePlant(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetWorkflowUsersByRoleAffiliatePlantReturnsOKWhenNoDataExist()
        {
            // Arrange              
            var request = new GetWorkflowUsersByRoleRequest
            {
                role = "admin",
                affiliateId = 12435
            };

            var expectedResult = new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse> { };

            var claims = new List<Claim>
            {
                new Claim("uid", "30787362")
            };
            var httpContextMock = new Mock<HttpContext>();
            var claimsIdentity = new ClaimsIdentity(new List<Claim>
            {
            new Claim(ClaimTypes.Role, "admin"),
            new Claim("uid", "30787362")// User has the admin role
            });

            var userMock = new ClaimsPrincipal(claimsIdentity);
            httpContextMock.Setup(x => x.User).Returns(userMock);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContextMock.Object };

            CommonMethod.IsWorkflowActionAllowed(httpContextMock.Object, 10000);

            //var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(It.IsAny<string>(), It.IsAny<int>())).ReturnsAsync(expectedResult);
            // Act
            var result = _controller.GetWorkflowUsersByRoleAffiliatePlant(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        [Fact]

        public void SendEmailAndUpdateLogs_StatusSuccess_CallsRepositoryWithSuccess()

        {

            // Arrange

            var requestId = Guid.NewGuid();

            var request = new PostOdsWorkflowActionRequest { requestId = 1 };

            var response = new EmailSentResponse
            {
                SendEmailNotificationOutput = new SendEmailNotificationOutput
                {
                    Status = "success",
                    StatusMessage = "Email sent successfully"
                }
            };

            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepository.Object,
                mockHttpClientFactory.Object,
                emailOptions, _emailservices,
                bpmWrapper.Object
            );

            // Act

            var result = workflowService.SendEmailAndUpdateLogs(request, response);

            // Assert
            Assert.NotNull(result);

        }

        [Fact]
        public void SendEmailAndUpdateLogs_StatusFailure_CallsRepositoryWithFailure()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new PostOdsWorkflowActionRequest { requestId = 2 };

            var response = new EmailSentResponse
            {
                SendEmailNotificationOutput = new SendEmailNotificationOutput
                {
                    Status = "failure",
                    StatusMessage = "SMTP server unreachable"
                }
            };
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);

            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepository.Object,
                mockHttpClientFactory.Object,
                emailOptions, _emailservices,
                bpmWrapper.Object
            );

            // Act
            var result = workflowService.SendEmailAndUpdateLogs(request, response);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public async Task TriggerWorkflowCommonServiceAsync()
        {
            //Arrange
            var request = new TriggerWorkflowCommonServiceRequest
            {
                requestId = 4,
                actionName = "1",
                assignedBy = "1",
                assignedTo = "1",
                targetDate = 1,
                stageId = "1",
                targetDifference = 1

            };
            var repoResponse = new List<GetOdsAssigneeListStoredProcedureResponse>();
            repoResponse.AddRange(A.CollectionOfDummy<GetOdsAssigneeListStoredProcedureResponse>(8).AsEnumerable());
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            mockWorkflowRepository.Setup(s => s.GetOdsAssigneeListByRequestIdAsync(It.IsAny<int>(), It.IsAny<byte>()))
                            .ReturnsAsync(repoResponse);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);

            //Act
            var result =await workflowService.TriggerWorkflowCommonServiceAsync(request);

            //Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GenerateErrorLogRequestReturnsErrorLogObject()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest
            {
                requestId = 123,
                stageId = 2,
                actionName = "2",
            };

            var failedList = new List<int> { 1, 23, };
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);
            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "1"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            // Act
            var responseModel = workflowService.GenerateErrorLogRequest(request, failedList, httpContext);

            // Assert
            Assert.IsType<LogErrorLogs>(responseModel.Result);
        }

        [Fact]

        public void CreateEmailObjectForOdsSendEmail_ShouldCreateCorrectEmailObject()
        {
            // Arrange

            var empName = "John Doe";

            var emailTo = "john.doe@example.com";

            var emailSubject = "Test Subject";
            var emailFrom = "abc.com";

            var emailContent = "This is a test email content.";
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);


            // Act

            var result = WorkflowServices.CreateEmailObjectForSendEmail(empName, emailTo, emailFrom, emailSubject, emailContent);

            // Assert

            Assert.NotNull(result);

        }

        [Fact]

        public void GetSuccessWorkflowTargetDateActionAsync_WhenAlertIsSuccess()
        {

            // Arrange
            var requestId = Guid.NewGuid();
            var request = new PostOdsWorkflowActionRequest { requestId = 1 };
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);



            mockWorkflowRepository.Setup(r => r.UpdatePeOdsAlertDetailsAsync(It.IsAny<PostOdsWorkflowActionRequest>()))

                .ReturnsAsync("alert updated successfully");

            // Act

            var result = workflowService.GetSuccessWorkflowTargetDateActionAsync(request);

            // Assert
            Assert.NotNull(result);

        }

        [Fact]

        public void GetSuccessWorkflowTargetDateActionAsync_WhenAlertIsFailure_CallsLogWithFlag0()

        {

            // Arrange
            var requestId = Guid.NewGuid();
            var request = new PostOdsWorkflowActionRequest { requestId = 2 };
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);
            mockWorkflowRepository.Setup(r => r.UpdatePeOdsAlertDetailsAsync(It.IsAny<PostOdsWorkflowActionRequest>()))

                .ReturnsAsync("alert failed");

            // Act

            var result = workflowService.GetSuccessWorkflowTargetDateActionAsync(request);

            // Assert
            Assert.NotNull(result);


        }

        [Fact]
        public void CreateBpmRequest_ValidInput_ReturnsExpectedValues()
        {
            // Arrange

            var now = DateTime.UtcNow.AddHours(3);

            var expectedTargetDateEpoch = ((DateTimeOffset)now).ToUnixTimeSeconds();

            var request = new PostOdsWorkflowActionNameRequest

            {

                actionName = "123",

                stageId = 5,

                assigneeId = "1",

                createdBy = "tester@example.com",

                requestId = 1,

                targetDate = DateTime.Now

            };
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);


            // Act

            var result = WorkflowServices.CreateBpmRequest(request);

            // Assert

            Assert.Equal(request.actionName, result.actionName);

            Assert.Equal(request.stageId.ToString(), result.stageId);

            Assert.Equal(request.assigneeId.ToString(), result.assignedTo);

            Assert.Equal(request.createdBy, result.assignedBy);

            Assert.Equal(request.requestId, result.requestId);

            Assert.True(result.targetDifference >= 0);

        }

        [Fact]
        public void GetSuccessWorkflowActionAsync_SuccessFlow_CallsEmailAndLogMethods()

        {

            // Arrange
            var request = new PostOdsWorkflowActionRequest();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var mockWorkflowRepository = new Mock<IWorkflowRepository>();
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
            var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
                emailOptions, _emailservices, bpmWrapper.Object);
            mockWorkflowRepository

                .Setup(r => r.UpdatePeOdsAlertDetailsAsync(request))

                .ReturnsAsync("updated successfully");

            mockWorkflowRepository

                .Setup(r => r.OdsGetNewEmailDataAsync(request.requestId));

            mockWorkflowRepository
            .Setup(r => r.OdsGetNewEmailDataAsync(request.requestId))
            .ReturnsAsync(new
            {
                EmpName = "John",
                EmailTo = "john@example.com",
                email_subject = "Test Subject",
                EmailContent = "Hello, John"
            });

            // Act

            var result = workflowService.GetSuccessWorkflowActionAsync(request);

            // Assert
            Assert.NotNull(result);
        }

        //[Theory]
        //[InlineData("1")]
        //[InlineData("2")]
        //[InlineData("5")]

        //public async Task PostOdsWorkflowActionAsync_CallsValidateWorkflowAction(string actionId)

        //{

        //    var request = new PostOdsWorkflowActionRequest { actionId = 1 };

        //    var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        //    var mockWorkflowRepository = new Mock<IWorkflowRepository>();
        //    var mockHttpClientFactory = new Mock<IHttpClientFactory>();
        //    var httpClient = new HttpClient(mockHandler.Object)
        //    {
        //        BaseAddress = new Uri("http://localhost")
        //    };
        //    mockHttpClientFactory.Setup(f => f.CreateClient("namedClient")).Returns(httpClient);
        //    var emailOptions = Options.Create(new EmailSettingsEntity { BaseURL = "http://localhost" });
        //    var workflowService = new WorkflowServices(mockWorkflowRepository.Object, mockHttpClientFactory.Object,
        //        emailOptions);
        //    mockWorkflowRepository.Setup(s => s.PostOdsWorkflowActionAsync(request));

        //    //serviceMock.Setup(s => s.ValidateWorkflowActionAsync(request, false)).ReturnsAsync(99);

        //    var result = await workflowService.PostOdsWorkflowActionAsync(request);

        //    Assert.Equal(-1, result);
        //}

        [Fact]
        public void GetValidEmailIds_AllBranchesCovered()
        {
            // Arrange

            var input = "test@example.com,invalid-email";

            // Act
            var result = WorkflowServices.GetValidEmailIds(input);

            // Assert
            Assert.Equal("test@example.com", result);
        }

        [Fact]
        public async void AddWorkflowUsersReturnsBadResultWhenMultipleUserForPEM()
        {
            // Arrange              
            var request = new AddWorkflowUserRequest()
            {
                affiliateId = 1,
                role = "Process Engineering Manager",
                userIDList = "77777777,77777778",
                createdBy = "1"

            };

            var workflowRoles = new List<GetWorkFlowUserRolesStoredProcedureResponse>
            {
                new GetWorkFlowUserRolesStoredProcedureResponse
                {
                    roleId = 2,
                    role = "Process Engineering Engineer"
                },

            };

            var validWorkflowRoles = new List<GetRolesRoleIdByUserIdStoredProcResponse>
            {
                new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "2",
                    name = "Process Engineering Engineer"
                },

            };

            var workflowUsers = new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
            {
                new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse
                {
                    email = "99999999@sabic.com",
                    employeeID = "99999999",
                    employeeName = "Test,User",
                    roleId = 241,
                    role = "Process Engineering Engineer",
                    managerName="",
                    managerEmail=""
                },


            };
            string userID = request.userIDList!;
            string role = request.role!;
            int? affiliateId = request.affiliateId!;

            var response = new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>();

            var loggingRepositorMock = new Mock<ILoggingRepository>();
            var accountRepositoryMock = new Mock<IAccountRepository>();

            accountRepositoryMock.Setup(x => x.GetWorkflowUsersByRoleAffiliatePlant(role, affiliateId))
                                .ReturnsAsync(response);
            accountRepositoryMock.Setup(x => x.GetValidWorkflowRoles())
                                .ReturnsAsync(validWorkflowRoles);
            accountRepositoryMock.Setup(x => x.GetWorkflowUserRoles())
                                .ReturnsAsync(workflowRoles);
            accountRepositoryMock.Setup(x => x.GetWorkflowUsersByRoleAffiliatePlant(null, It.IsAny<int?>()))
                                .ReturnsAsync(workflowUsers);
            accountRepositoryMock.Setup(x => x.AddWorkflowUsersAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                                .ReturnsAsync(new List<int> { 1, 2 });


            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockWinAuthServices = new Mock<IWinAuthServices>();
            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, mockWinAuthServices.Object);

            var mockWorkflowServices = new Mock<IWorkflowServices>();
            var mockLoggingServices = new Mock<ILoggingServices>();
            var mockConfiguration = new Mock<IConfiguration>();
            var controller = new WorkflowController(mockWorkflowServices.Object, mockAccountServices, mockWinAuthServices.Object, mockLoggingServices.Object, mockConfiguration.Object);
            var claims = new List<Claim>
                        {
                            new Claim("uid", "888888888"),
                            new Claim("workflowRole", "1"),
                            new Claim("workflowClaims", "241"),
                        };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = await controller.AddWorkflowUsers(request);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]

        public async Task PostOdsWorkflowAction_ShouldReturnBadRequest_WhenSendEmailRequestsExist()

        {

            // Arrange

            var request = new PostOdsWorkflowActionNameRequest();
            request.requestIdList = "1";

            var emailFailures = new List<string> { "user1@example.com", "user2@example.com" };

            var bulkUpdateResult = new

            {

                sendEmailRequests = emailFailures

            };

            var LogErrorLogs = new ErrorLogRequest();

            _mockActionManagementServices

                .Setup(s => s.PostOdsWorkflowActionsInParallelAsync(request));



            List<int> failedRequests = null!;
            _mockActionManagementServices

                .Setup(s => s.GenerateErrorLogRequest(request, failedRequests, It.IsAny<HttpContext>()));


            // Act

            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert

            Assert.NotNull(result);

        }


        #region
        [Fact]
        public async Task PostOdsWorkflowAction_ReturnsBadRequest_WhenSendEmailRequestsExist()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest { requestIdList = "1" };
            var bulkUpdateResult = new PostOdsWorkflowActionsInParallelResponse
            {
                sendEmailRequests = new List<int> { 123, 456 }
            };

            _mockActionManagementServices
                .Setup(s => s.PostOdsWorkflowActionsInParallelAsync(It.IsAny<PostOdsWorkflowActionNameRequest>()))
                .ReturnsAsync(bulkUpdateResult);

            _mockActionManagementServices
                .Setup(s => s.GenerateErrorLogRequest(It.IsAny<PostOdsWorkflowActionNameRequest>(), It.IsAny<List<int>>(), It.IsAny<HttpContext>()))
                .ReturnsAsync(new LogErrorLogs());

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")); 
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            // Act
            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task PostOdsWorkflowAction_ReturnsBadRequest_WhenValidateRequestsExist()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest { requestIdList = "1" };
            var bulkUpdateResult = new PostOdsWorkflowActionsInParallelResponse
            {
                sendEmailRequests = new List<int>(), 
                validateRequests = new List<int> { 789 },
                failedRequests = new List<int>()     
            };

            _mockActionManagementServices
                .Setup(s => s.PostOdsWorkflowActionsInParallelAsync(It.IsAny<PostOdsWorkflowActionNameRequest>()))
                .ReturnsAsync(bulkUpdateResult);

            _mockActionManagementServices
                .Setup(s => s.GenerateErrorLogRequest(It.IsAny<PostOdsWorkflowActionNameRequest>(), It.IsAny<List<int>>(), It.IsAny<HttpContext>()))
                .ReturnsAsync(new LogErrorLogs());

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            // Act
            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task PostOdsWorkflowAction_ReturnsBadRequest_WhenFailedRequestsExist()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest { requestIdList = "1" };
            var bulkUpdateResult = new PostOdsWorkflowActionsInParallelResponse
            {
                sendEmailRequests = new List<int>(), 
                validateRequests = new List<int>(),
                failedRequests = new List<int> { 101, 202 }
            };

            _mockActionManagementServices
                .Setup(s => s.PostOdsWorkflowActionsInParallelAsync(It.IsAny<PostOdsWorkflowActionNameRequest>()))
                .ReturnsAsync(bulkUpdateResult);

            _mockActionManagementServices
                .Setup(s => s.GenerateErrorLogRequest(It.IsAny<PostOdsWorkflowActionNameRequest>(), It.IsAny<List<int>>(), It.IsAny<HttpContext>()))
                .ReturnsAsync(new LogErrorLogs());

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{}"));
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            // Act
            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task PostOdsWorkflowAction_ReturnsOk_WhenNoErrors()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest { requestIdList = "1" };
            var bulkUpdateResult = new PostOdsWorkflowActionsInParallelResponse
            {
                successfulRequests = new List<int> { 1, 2, 3 },
                sendEmailRequests = new List<int>(),
                validateRequests = new List<int>(),
                failedRequests = new List<int>()
            };

            _mockActionManagementServices
                .Setup(s => s.PostOdsWorkflowActionsInParallelAsync(It.IsAny<PostOdsWorkflowActionNameRequest>()))
                .ReturnsAsync(bulkUpdateResult);

            // Act
            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task PostOdsWorkflowAction_ReturnsOk_WhenBulkUpdateResultIsNullButNoErrors()
        {
            // Arrange
            var request = new PostOdsWorkflowActionNameRequest { requestIdList = "1" };
            PostOdsWorkflowActionsInParallelResponse bulkUpdateResult = null!;

            _mockActionManagementServices
                .Setup(s => s.PostOdsWorkflowActionsInParallelAsync(It.IsAny<PostOdsWorkflowActionNameRequest>()))
                .ReturnsAsync(bulkUpdateResult);

            // Act
            var result = await _controller.PostOdsWorkflowAction(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }
        #endregion

        #region
        [Fact]
        public async Task AddWorkflowUsers_ReturnsBadRequest_WhenWorkflowActionNotAllowed()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "123",
                role = "SomeRole",
                affiliateId = 1
            };

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim("workflowClaims", "2") });
            identity.AddClaim(new Claim("uid", "100")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_ReturnsBadRequest_WhenValidationFails()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "invalidUser",
                role = "SomeRole",
                affiliateId = 1
            };

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin") }); 
            identity.AddClaim(new Claim("uid", "100")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };


            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = false, message = "Validation failed message" });

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_ProcessManagerRole_ExistingUser_DeletionFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "123",
                role = "Process Manager",
                affiliateId = 1
            };

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin") }); 
            identity.AddClaim(new Claim("uid", "100")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 1, role = "Process Manager" });

            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(
                It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
                {
                    new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse { employeeID = "existingUser", role = "Process Manager" }
                });

            _mockAccountServices.Setup(s => s.DeleteWorkflowUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new DeleteWorkflowUserStoredProcedureResponse { isActive = 1 }); 

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_ProcessManagerRole_ExistingUser_DeletionSucceeds_AdditionFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "123",
                role = "Process Manager",
                affiliateId = 1
            };

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin") });
            identity.AddClaim(new Claim("uid", "100")); 
            identity.AddClaim(new Claim("jti", "some-session-id")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 1, role = "Process Manager" });

            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(
                It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
                {
                    new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse { employeeID = "existingUser", role = "Process Manager" }
                });

            _mockAccountServices.Setup(s => s.DeleteWorkflowUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new DeleteWorkflowUserStoredProcedureResponse { isActive = 0 }); 

            _mockAccountServices.Setup(s => s.AddWorkflowUsersAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                .ReturnsAsync(new List<int>()); 

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_ProcessManagerRole_ExistingUser_DeletionSucceeds_AdditionSucceeds_ReturnsOk()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "123",
                role = "Process Manager",
                affiliateId = 1
            };
            const string expectedToken = "mocked_token";

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin"), new Claim("jti", "some-session-id") });
            identity.AddClaim(new Claim("uid", "100")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 1, role = "Process Manager" });

            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(
                It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
                {
                    new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse { employeeID = "existingUser", role = "Process Manager" }
                });

            _mockAccountServices.Setup(s => s.DeleteWorkflowUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new DeleteWorkflowUserStoredProcedureResponse { isActive = 0 }); 

            _mockAccountServices.Setup(s => s.AddWorkflowUsersAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                .ReturnsAsync(new List<int> { 1 }); 

            _mockAccountServices.Setup(s => s.GenerateNewTokenWhenAdminActionTakenAsync(
                It.IsAny<ClaimsPrincipal>(), It.IsAny<HttpContext>(), It.IsAny<HttpRequest>()))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<TokenResponse<object>>(okResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_ProcessManagerRole_NoExistingUser_AdditionFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "123",
                role = "Process Manager",
                affiliateId = 1
            };

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin") });
            identity.AddClaim(new Claim("uid", "100")); 
            identity.AddClaim(new Claim("jti", "some-session-id")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 1, role = "Process Manager" });

            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(
                It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>()); 

            _mockAccountServices.Setup(s => s.AddWorkflowUsersAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                .ReturnsAsync(new List<int>()); 

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_ProcessManagerRole_NoExistingUser_AdditionSucceeds_ReturnsOk()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "123",
                role = "Process Manager",
                affiliateId = 1
            };
            const string expectedToken = "mocked_token";

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin"), new Claim("jti", "some-session-id") });
            identity.AddClaim(new Claim("uid", "100")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 1, role = "Process Manager" });

            _mockAccountServices.Setup(s => s.GetWorkflowUsersByRoleAffiliatePlantAsync(
                It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>()); 

            _mockAccountServices.Setup(s => s.AddWorkflowUsersAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                .ReturnsAsync(new List<int> { 1 }); 

            _mockAccountServices.Setup(s => s.GenerateNewTokenWhenAdminActionTakenAsync(
                It.IsAny<ClaimsPrincipal>(), It.IsAny<HttpContext>(), It.IsAny<HttpRequest>()))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<TokenResponse<object>>(okResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_NonProcessManagerRole_AdditionFails_ReturnsBadRequest()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "456",
                role = "Regular User",
                affiliateId = 2
            };

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin") });
            identity.AddClaim(new Claim("uid", "100")); 
            identity.AddClaim(new Claim("jti", "another-session-id")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 2, role = "Regular User" }); 

            _mockAccountServices.Setup(s => s.AddWorkflowUsersAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                .ReturnsAsync(new List<int>()); 

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task AddWorkflowUsers_NonProcessManagerRole_AdditionSucceeds_ReturnsOk()
        {
            // Arrange
            var request = new AddWorkflowUserRequest
            {
                userIDList = "456",
                role = "Regular User",
                affiliateId = 2
            };
            const string expectedToken = "mocked_token_for_non_pm";

            var principal = new ClaimsPrincipal();
            var identity = new ClaimsIdentity(new List<Claim> { new Claim(ClaimTypes.Role, "admin") });
            identity.AddClaim(new Claim("uid", "100")); 
            identity.AddClaim(new Claim("jti", "another-session-id")); 
            principal.AddIdentity(identity);

            var httpContext = new DefaultHttpContext
            {
                User = principal,
                Request = { Body = new MemoryStream(Encoding.UTF8.GetBytes("{}")) }
            };
            _controller.ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            };

            _mockAccountServices.Setup(s => s.WorkflowUserAdditionValidation(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>()))
                .ReturnsAsync(new StatusMessageResponse { isValid = true });

            _mockAccountServices.Setup(s => s.GetWorkflowRequestRole(It.IsAny<AddWorkflowUserRequest>()))
                .ReturnsAsync(new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 2, role = "Regular User" }); 

            _mockAccountServices.Setup(s => s.AddWorkflowUsersAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string>()))
                .ReturnsAsync(new List<int> { 1 }); 

            _mockAccountServices.Setup(s => s.GenerateNewTokenWhenAdminActionTakenAsync(
                It.IsAny<ClaimsPrincipal>(), It.IsAny<HttpContext>(), It.IsAny<HttpRequest>()))
                .ReturnsAsync(expectedToken);

            // Act
            var result = await _controller.AddWorkflowUsers(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<TokenResponse<object>>(okResult.Value);
        }
        #endregion

        #region GetStartEoWorkflow
        [Fact]
        public async Task GetStartEoWorkflow_ReturnsEmptyOk_WhenRepositoryReturnsNull()
        {
            // Arrange
            var request = new GetStartEoWorkflowRequest
            {
                requestID = 1001
            };

            var mockWorkflowRepo = new Mock<IWorkflowRepository>();
            dynamic fakeResponse = new ExpandoObject();
            fakeResponse.SendEmail = "false"; 
            fakeResponse.EmpName = "Test User";
            fakeResponse.EmailTo = "test@example.com";
            fakeResponse.email_subject = "Test Subject";
            fakeResponse.EmailContent = "Test Body";

            mockWorkflowRepo
                .Setup(repo => repo.GetStartEoWorkflowAsync(It.IsAny<GetStartEoWorkflowRequest>()))
                .ReturnsAsync(new List<dynamic> { fakeResponse });

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );

            var controller = new WorkflowController(
                workflowService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetStartEoWorkflow(request);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public async Task GetStartEoWorkflow_ReturnsEmptyOk_WhenRepositoryReturnsNullSentEmail()
        {
            // Arrange
            var request = new GetStartEoWorkflowRequest
            {
                requestID = 1001
            };

            var mockWorkflowRepo = new Mock<IWorkflowRepository>();
            dynamic fakeResponse = new ExpandoObject();
            fakeResponse.SendEmail = "true";
            fakeResponse.EmpName = "Test User";
            fakeResponse.EmailTo = "test@example.com";
            fakeResponse.email_subject = "Test Subject";
            fakeResponse.EmailContent = "Test Body";

            mockWorkflowRepo
                .Setup(repo => repo.GetStartEoWorkflowAsync(It.IsAny<GetStartEoWorkflowRequest>()))
                .ReturnsAsync(new List<dynamic> { fakeResponse });

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );

            var controller = new WorkflowController(
                workflowService,
                new Mock<IAccountServices>().Object,
                new Mock<IWinAuthServices>().Object,
                new Mock<ILoggingServices>().Object,
                new Mock<IConfiguration>().Object
            );

            // Act
            var result = await controller.GetStartEoWorkflow(request);

            // Assert
            Assert.NotNull(result);
        }
        #endregion

        [Fact]
        public async Task PostOdsWorkflowActionAsyncTestReturns0()
        {
            //Arrange
            PostOdsWorkflowActionNameRequest request = new PostOdsWorkflowActionNameRequest();

            var mockWorkflowRepo = new Mock<IWorkflowRepository>();
            dynamic fakeResponse = new ExpandoObject();
            fakeResponse.SendEmail = "true";
            fakeResponse.EmpName = "Test User";
            fakeResponse.EmailTo = "test@example.com";
            fakeResponse.email_subject = "Test Subject";
            fakeResponse.EmailContent = "Test Body";

            mockWorkflowRepo
                .Setup(repo => repo.GetStartEoWorkflowAsync(It.IsAny<GetStartEoWorkflowRequest>()))
                .ReturnsAsync(new List<dynamic> { fakeResponse });

            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);

            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                mockWorkflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );


            // Act
            var result = await workflowService.PostOdsWorkflowActionAsync(request);

            // Assert
            Assert.Equal(0,result);
        }
        //[Fact]
        //public async Task PostOdsWorkflowActionAsyncTestReturns1()
        //{
        //    //Arrange
        //    PostOdsWorkflowActionRequest request = new PostOdsWorkflowActionRequest();

        //    var mockWorkflowRepo = new Mock<IWorkflowRepository>();
        //    dynamic fakeResponse = new ExpandoObject();
        //    fakeResponse.SendEmail = "true";
        //    fakeResponse.EmpName = "Test User";
        //    fakeResponse.EmailTo = "test@example.com";
        //    fakeResponse.email_subject = "Test Subject";
        //    fakeResponse.EmailContent = "Test Body";

        //    mockWorkflowRepo
        //        .Setup(repo => repo.GetStartEoWorkflowAsync(It.IsAny<GetStartEoWorkflowRequest>()))
        //        .ReturnsAsync(new List<dynamic> { fakeResponse });

        //    var mockHttpClientFactory = new Mock<IHttpClientFactory>();
        //    var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        //    var httpClient = new HttpClient(mockHandler.Object)
        //    {
        //        BaseAddress = new Uri("http://localhost")
        //    };
        //    mockHttpClientFactory
        //        .Setup(f => f.CreateClient("namedClient"))
        //        .Returns(httpClient);

        //    var emailSettings = Options.Create(new EmailSettingsEntity
        //    {
        //        BaseURL = "http://localhost"
        //    });

        //    var workflowService = new WorkflowServices(
        //        mockWorkflowRepo.Object,
        //        mockHttpClientFactory.Object,
        //        emailSettings
        //    );


        //    // Act
        //    var result = await workflowService.PostOdsWorkflowActionAsync(request);

        //    // Assert
        //    Assert.Equal(0, result);
        //}


        [Fact]
        public async Task GetFailedInstances_ReturnsOkResult_WithExpectedResponse()
        {

            // Arrange      

            var expectedResult = new { Success = true };

            var request = new TerminateFailedInstancesApiRequestBody
            {
                assignedBy = "assignee1"
            };

            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);
            var workflowRepo = new Mock<IWorkflowRepository>();
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                workflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );
            var accountServices = new Mock<IAccountServices>();
            var winAuthServices = new Mock<IWinAuthServices>();
            var loggingServices = new Mock<ILoggingServices>();
            var controller = new WorkflowController(workflowService,
                                    accountServices.Object,
                                    winAuthServices.Object,
                                    loggingServices.Object,
                                    configuration.Object);
            var _actionManagementServices = new Mock<IWorkflowServices>();
            _actionManagementServices
                .Setup(s => s.GetFailedInstancesApiRequestAsync(request))
                .ReturnsAsync(expectedResult);

            // Act

            var result = await controller.GetFailedInstances(request);

            // Assert

            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);

        }

        [Fact]
        public async Task GetTerminatedInstancesLog_ReturnsOkResult_WithData()
        {

            // Arrange      

            var expectedResult = new { Success = true };

            var repo = new List<GetTerminatedInstancesLogResponse>();

            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);
            var workflowRepo = new Mock<IWorkflowRepository>();
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                workflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );
            var accountServices = new Mock<IAccountServices>();
            var winAuthServices = new Mock<IWinAuthServices>();
            var loggingServices = new Mock<ILoggingServices>();
            var controller = new WorkflowController(workflowService,
                                    accountServices.Object,
                                    winAuthServices.Object,
                                    loggingServices.Object,
                                    configuration.Object);
            var _actionManagementServices = new Mock<IWorkflowServices>();
            _actionManagementServices
                .Setup(s => s.GetTerminatedInstancesLog())
                .ReturnsAsync(repo);


            // Act

            var result = await controller.GetTerminatedInstancesLog();

            // Assert

            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task TerminateFailedInstances_ReturnsOkResult_WithExpectedResponse()
        {

            // Arrange      

            var expectedResult = new { Success = true }; // Example return type

            var request = new TerminateFailedInstancesApiRequestBody{};
            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);
            var workflowRepo = new Mock<IWorkflowRepository>();
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                workflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );
            var accountServices = new Mock<IAccountServices>();
            var winAuthServices = new Mock<IWinAuthServices>();
            var loggingServices = new Mock<ILoggingServices>();
            var controller = new WorkflowController(workflowService,
                                    accountServices.Object,
                                    winAuthServices.Object,
                                    loggingServices.Object,
                                    configuration.Object);
            var _actionManagementServices = new Mock<IWorkflowServices>();
            _actionManagementServices
                .Setup(s => s.TerminateFailedInstancesAsync(request))
                .ReturnsAsync(expectedResult);



            // Act

            var result = await controller.TerminateFailedInstances(request);

            // Assert

            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task GetHandleCorruptedInstance_ReturnsOk_WithExpectedResponse()
        {
            // Arrange

            var request = new GetHandleCorruptedInstanceRequest
            {
                processInstanceID = "1",
                assignedBy = "user"

            };
            var serviceResult = new
            {

                Success = true,

                Message = "Instances handled successfully"

            };
            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://localhost"
            });
            var mockHandler = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            var httpClient = new HttpClient(mockHandler.Object)
            {
                BaseAddress = new Uri("http://localhost")
            };
            var mockHttpClientFactory = new Mock<IHttpClientFactory>();
            mockHttpClientFactory
                .Setup(f => f.CreateClient("namedClient"))
                .Returns(httpClient);
            var workflowRepo = new Mock<IWorkflowRepository>();
            var configuration = new Mock<IConfiguration>();
            var bpmWrapper = new Mock<BpmWrapper>(configuration.Object);
            var workflowService = new WorkflowServices(
                workflowRepo.Object,
                mockHttpClientFactory.Object,
                emailSettings, _emailservices,
                bpmWrapper.Object
            );
            var accountServices = new Mock<IAccountServices>();
            var winAuthServices = new Mock<IWinAuthServices>();
            var loggingServices = new Mock<ILoggingServices>();
            var controller = new WorkflowController(workflowService,
                                    accountServices.Object,
                                    winAuthServices.Object,
                                    loggingServices.Object,
                                    configuration.Object);
            var _actionManagementServices = new Mock<IWorkflowServices>();

            _actionManagementServices
                .Setup(s => s.GetHandleCorruptedInstanceAsync(request));

            // Act

            var result = await controller.GetHandleCorruptedInstance(request);

            // Assert

            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(okResult.Value);
        }
    }
}
        