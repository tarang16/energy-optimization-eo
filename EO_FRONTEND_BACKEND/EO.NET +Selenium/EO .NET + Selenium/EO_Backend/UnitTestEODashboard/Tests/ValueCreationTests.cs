using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EOInfrastructure.Services;
using System.Security.Claims;
using Xunit;
using EODomain.Models.ValueCreation;
using Microsoft.Extensions.Configuration;
using EOWebMicroservice.Controllers.v1;

namespace UnitTestEODashboard.Tests
{
    public class ValueCreationTests
    {
        private readonly Mock<IConfiguration> configurationMock;
        private readonly Mock<IAccountServices> accountServicesMock;
        private readonly Mock<IWinAuthServices> winAuthServicesMock;
        private readonly Mock<IConfigServices> configServicesMock;
        private readonly Mock<IValueCreationRepository> valueCreationRepoMock;
        private readonly ValueCreationServices valueCreationServicesMock;
        private readonly ValueCreationController controller;
        private readonly DefaultHttpContext httpContext;

        public ValueCreationTests()
        {
            configurationMock = new Mock<IConfiguration>();
            accountServicesMock = new Mock<IAccountServices>();
            winAuthServicesMock = new Mock<IWinAuthServices>();
            configServicesMock = new Mock<IConfigServices>();
            valueCreationRepoMock = new Mock<IValueCreationRepository>();

            valueCreationServicesMock = new ValueCreationServices(valueCreationRepoMock.Object);
            controller = new ValueCreationController(configurationMock.Object, valueCreationServicesMock, accountServicesMock.Object, winAuthServicesMock.Object, configServicesMock.Object);

            var claims = new List<Claim>
            {
                new Claim("uid", "123")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            httpContext = new DefaultHttpContext
            {
                User = user
            };
            controller.ControllerContext.HttpContext = httpContext;
        }

        #region GetAllVCActionByCaseIDAsync               
        [Fact]
        public void GetAllVCActionByCaseIDAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new GetAllValueCreationByCaseIDRequest();

            var expectedResult = new List<GetAllMasterValueCreationDataStoredProcedureResponse>()
            {
                new GetAllMasterValueCreationDataStoredProcedureResponse()
                {
                    actionDescription="Mock"
                }
            };

            valueCreationRepoMock.Setup(r => r.GetAllMasterValueCreationByCaseIDAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetAllVCActionByCaseIDAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetAllVCActionByCaseIDAsyncReturnsBadRequestWhenNoDataFound()
        {
            // Arrange
            var request = new GetAllValueCreationByCaseIDRequest();

            var expectedResult = new List<GetAllMasterValueCreationDataStoredProcedureResponse>();

            valueCreationRepoMock.Setup(r => r.GetAllMasterValueCreationByCaseIDAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetAllVCActionByCaseIDAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region PostAddMasterVCActionAsync         
        [Fact]
        public void PostAddMasterVCActionAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new PostAddValueCreationDataRequestStoredProcedureRequest()
            {
                caseID = 1,
                createdBy = 123,
                isActive = 1
            };

            var expectedResult = 1;

            valueCreationRepoMock.Setup(r => r.PostAddMasterValueCreationDataAsync(It.IsAny<PostAddValueCreationDataRequestStoredProcedureRequest>())).ReturnsAsync(expectedResult);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.PostAddMasterVCActionAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void PostAddMasterVCActionAsyncReturnsBadRequestWhenNoDataFound()
        {
            // Arrange
            var request = new PostAddValueCreationDataRequestStoredProcedureRequest()
            {
                caseID = 0,
                createdBy = 123,
                isActive = 1
            };

            var expectedResult = 0;

            valueCreationRepoMock.Setup(r => r.PostAddMasterValueCreationDataAsync(It.IsAny<PostAddValueCreationDataRequestStoredProcedureRequest>())).ReturnsAsync(expectedResult);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(0);

            // Act
            var result = controller.PostAddMasterVCActionAsync(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task PostAddMasterVCActionAsyncReturnsEmptyOkWhenResultIsNull()
        {
            // Arrange
            var request = new PostAddValueCreationDataRequest()
            {
                caseID = 1,
                actionDescription = "Valid Description",
                actionTitle = "Valid Title",
                potentialPeriod = 5,
                vCActionID = 123
            };

            valueCreationRepoMock
                .Setup(r => r.PostAddMasterValueCreationDataAsync(It.IsAny<PostAddValueCreationDataRequestStoredProcedureRequest>()))
                .ReturnsAsync((int?)null);

            accountServicesMock
                .Setup(a => a.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString()))
                .ReturnsAsync(1);

            // Act
            var result = await controller.PostAddMasterVCActionAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
        }
        #endregion

        #region GetVCSpanByCaseIdAsync
        [Fact]
        public void GetVCSpanByCaseIdAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new ValueCreationCalcTimeSeriesRequest()
            {
                caseID = 1,
                sTime = new DateTime(),
                eTime = new DateTime(),
            };

            var response = new List<GetValueCreationSpanDataStoredProcedureResponse?>();

            valueCreationRepoMock.Setup(r => r.GetValueCreationSpanDataByCaseIdAsync(It.IsAny<ValueCreationCalcTimeSeriesRequest>())).ReturnsAsync(response);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.GetVCSpanByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var okResponse = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetVCSpanByCaseIdAsyncReturnsBadRequestOkResultWhenInvalidCaseId()
        {
            // Arrange
            var request = new ValueCreationCalcTimeSeriesRequest();

            var response = new List<GetValueCreationSpanDataStoredProcedureResponse?>();

            valueCreationRepoMock.Setup(r => r.GetValueCreationSpanDataByCaseIdAsync(It.IsAny<ValueCreationCalcTimeSeriesRequest>())).ReturnsAsync(response);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(0);

            // Act
            var result = controller.GetVCSpanByCaseIdAsync(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetVCSpanByCaseIdAsyncReturnsBadRequestOkResultWhenNoDataFound()
        {
            // Arrange
            var request = new ValueCreationCalcTimeSeriesRequest()
            {
                caseID = 33,
                eTime = new DateTime(),
                sTime = new DateTime()
            };

            var response = new List<GetValueCreationSpanDataStoredProcedureResponse?>();

            valueCreationRepoMock.Setup(r => r.GetValueCreationSpanDataByCaseIdAsync(It.IsAny<ValueCreationCalcTimeSeriesRequest>()));

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.GetVCSpanByCaseIdAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var badRequestkResponse = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, badRequestkResponse.statuscode);
            Assert.Equal("No data found", badRequestkResponse.errormsg);
        }
        #endregion

        #region PostAddVCSpanAsync
        [Fact]
        public void PostAddVCSpanAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new PostAddValueCreationSpanDataRequest()
            {
                vCSpanID = 123,
                caseID = 33,
                remarks = "new remark",
                changes = "new changes"
            };

            valueCreationRepoMock.Setup(r => r.PostAddValueCreationSpanDataAsync(It.IsAny<PostAddValueCreationSpanDataStoredProcedureRequest>())).ReturnsAsync("1");

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.PostAddVCSpanAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var okResponse = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void PostAddVCSpanAsyncBadRequestOkResultWhenInvalidCaseId()
        {
            // Arrange
            var request = new PostAddValueCreationSpanDataRequest();

            valueCreationRepoMock.Setup(r => r.PostAddValueCreationSpanDataAsync(It.IsAny<PostAddValueCreationSpanDataStoredProcedureRequest>())).ReturnsAsync("test");

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(0);

            // Act
            var result = controller.PostAddVCSpanAsync(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void PostAddVCSpanAsyncBadRequestOkResultWhenNoDataFound()
        {
            // Arrange
            var request = new PostAddValueCreationSpanDataRequest()
            {
                vCSpanID = 123,
                caseID = 33,
                remarks = "test remarks",
                changes = "some changes"
            };

            valueCreationRepoMock.Setup(r => r.PostAddValueCreationSpanDataAsync(It.IsAny<PostAddValueCreationSpanDataStoredProcedureRequest>())).ReturnsAsync("null"); ;

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.PostAddVCSpanAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var badRequestkResponse = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(400, badRequestkResponse.statuscode);
        }
        #endregion

        #region GetAllMasterVCCaseInfoAsync
        [Fact]
        public void GetAllMasterVCCaseInfoAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new GetAllValueCreationByCaseIDRequest()
            {
                caseID = 33
            };
            var response = new List<GetAllAddTrnValueCreationCaseInfoDataResponse>();

            valueCreationRepoMock.Setup(r => r.GetAllMasterValueCreationCaseInfoAsync(It.IsAny<GetAllValueCreationByCaseIDRequest>())).ReturnsAsync(response);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.GetAllMasterVCCaseInfoAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var okResponse = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetAllMasterVCCaseInfoAsyncBadRequestOkResultWhenInvalidCaseId()
        {
            // Arrange
            var request = new GetAllValueCreationByCaseIDRequest()
            {
                caseID = 33
            };
            var response = new List<GetAllAddTrnValueCreationCaseInfoDataResponse>();

            valueCreationRepoMock.Setup(r => r.GetAllMasterValueCreationCaseInfoAsync(It.IsAny<GetAllValueCreationByCaseIDRequest>())).ReturnsAsync(response);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(0);

            // Act
            var result = controller.GetAllMasterVCCaseInfoAsync(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetAllMasterVCCaseInfoAsyncRequestOkResultWhenNoDataFound()
        {
            // Arrange
            var request = new GetAllValueCreationByCaseIDRequest()
            {
                caseID = 33
            };
            var response = new List<GetAllAddTrnValueCreationCaseInfoDataResponse>();

            valueCreationRepoMock.Setup(r => r.GetAllMasterValueCreationCaseInfoAsync(It.IsAny<GetAllValueCreationByCaseIDRequest>()));

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.GetAllMasterVCCaseInfoAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var responsemptyResult = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, responsemptyResult.statuscode);
            Assert.Equal("No data found", responsemptyResult.errormsg);
        }
        #endregion

        #region GetVCSpanCalcAsync
        [Fact]
        public void GetVCSpanCalcAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new ValueCreationCalcTimeSeriesRequest()
            {
                caseID = 33,
                sTime = DateTime.Now,
                eTime = DateTime.Now
            };
            var response = new List<GetValueCreationSpanDataForCaseResponse>();

            valueCreationRepoMock.Setup(r => r.GetValueCreationSpanCalcAsync(It.IsAny<ValueCreationCalcTimeSeriesRequest>())).ReturnsAsync(response);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.GetVCSpanCalcAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var okResponse = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetVCSpanCalcAsyncBadRequestOkResultWhenInvalidCaseId()
        {
            // Arrange
            var request = new ValueCreationCalcTimeSeriesRequest()
            {
                caseID = 33,
                sTime = DateTime.Now,
                eTime = DateTime.Now
            };
            var response = new List<GetValueCreationSpanDataForCaseResponse>();

            valueCreationRepoMock.Setup(r => r.GetValueCreationSpanCalcAsync(It.IsAny<ValueCreationCalcTimeSeriesRequest>())).ReturnsAsync(response);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(0);

            // Act
            var result = controller.GetVCSpanCalcAsync(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetVCSpanCalcAsyncRequestOkResultWhenNoDataFound()
        {
            // Arrange
            var request = new ValueCreationCalcTimeSeriesRequest()
            {
                caseID = 33,
                sTime = DateTime.Now,
                eTime = DateTime.Now
            };
            var response = new List<GetValueCreationSpanDataForCaseResponse>();

            valueCreationRepoMock.Setup(r => r.GetValueCreationSpanCalcAsync(It.IsAny<ValueCreationCalcTimeSeriesRequest>()));

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseID.ToString())).ReturnsAsync(1);

            // Act
            var result = controller.GetVCSpanCalcAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var responsemptyResult = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, responsemptyResult.statuscode);
            Assert.Equal("No data found", responsemptyResult.errormsg);
        }
        #endregion

        #region PostDeleteVCSpanByIdAsync
        [Fact]
        public void PostDeleteValueCreationSpanDataByIdAsyncReturnsOkResultWithData()
        {
            // Arrange
            var request = new DeleteRequestUsingGuid()
            {
                ID = 33,
                userID = 123
            };

            valueCreationRepoMock.Setup(r => r.PostDeleteValueCreationSpanDataByIdAsync(It.IsAny<DeleteRequestUsingGuid>())).ReturnsAsync(true);

            // Act
            var result = controller.PostDeleteVCSpanByIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void PostDeleteValueCreationSpanDataByIdAsyncReturnsOkResultWithNoData()
        {
            // Arrange
            var request = new DeleteRequestUsingGuid()
            {
                ID = 33,
                userID = 123
            };

            valueCreationRepoMock.Setup(r => r.PostDeleteValueCreationSpanDataByIdAsync(It.IsAny<DeleteRequestUsingGuid>())).ReturnsAsync(false);

            // Act
            var result = controller.PostDeleteVCSpanByIdAsync(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetVCByCaseIDListAsync
        [Fact]
        public void GetVCByCaseIDListAsyncOkResultWithData()
        {
            // Arrange
            var request = new GetVCByCaseIDListRequest()
            {
                caseIDList = "12,34",
                sTime = DateTime.Now.AddDays(-1),
                etime = DateTime.Now,
            };

            var response = new List<GetVCByCaseIDListResponse>()
            {
                new GetVCByCaseIDListResponse()
                {
                    caseID=1,
                    caseName="some",
                    category="some"
                }
            };

            valueCreationRepoMock.Setup(r => r.GetVCByCaseIDListAsync(It.IsAny<GetVCByCaseIDListRequest>())).ReturnsAsync(response);

            // Act
            var result = controller.GetVCByCaseIDListAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetVCByCaseIDListAsyncOkResultWithNoData()
        {
            // Arrange
            var request = new GetVCByCaseIDListRequest()
            {
                caseIDList = "12,34",
                sTime = DateTime.Now.AddDays(-1),
                etime = DateTime.Now,
            };

            List<GetVCByCaseIDListResponse> response1 = new List<GetVCByCaseIDListResponse>();

            valueCreationRepoMock.Setup(r => r.GetVCByCaseIDListAsync(It.IsAny<GetVCByCaseIDListRequest>())).ReturnsAsync(response1);

            // Act
            var result = controller.GetVCByCaseIDListAsync(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetVCspanAlertAsync
        [Fact]
        public void GetVCspanAlertReturnsOkWhenNoDataFound()
        {
            // Arrange
            GetVCSpanAlertRequest request = new GetVCSpanAlertRequest
            {
                caseIDList = "12",
                sTime = DateTime.Now.AddDays(-5),
                eTime = DateTime.Now
            };

            valueCreationRepoMock.Setup(r => r.GetVCspanAlertAsync(request))
                        .ReturnsAsync(new List<GetVCSpanAlertResponse?>());

            // Act
            var result = controller.GetVCspanAlertAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetVCspanAlertReturnsOkWhenDataFound()
        {
            // Arrange
            GetVCSpanAlertRequest request = new GetVCSpanAlertRequest
            {
                caseIDList = "12",
                sTime = DateTime.Now.AddDays(-5),
                eTime = DateTime.Now
            };

            var repoResponse = new List<GetVCSpanAlertResponse?>()
            {
                new GetVCSpanAlertResponse
                {
                    caseID = 12,
                    suggestion = "Good suggestion"
                }
            };

            valueCreationRepoMock.Setup(r => r.GetVCspanAlertAsync(request))
                        .ReturnsAsync(repoResponse);

            // Act
            var result = controller.GetVCspanAlertAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion
    }
}