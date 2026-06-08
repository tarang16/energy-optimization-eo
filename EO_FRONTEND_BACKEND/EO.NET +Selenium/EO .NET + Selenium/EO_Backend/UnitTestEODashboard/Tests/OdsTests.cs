using Xunit;
using Moq;
using EODomain.Models.Ods;
using EOApplication.Contracts.Services;
using Microsoft.AspNetCore.Mvc;
using EOWebMicroservice.Controllers.v1;
using EODomain.Common;
using EODomain.Models.Config;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using EOApplication.Contracts.Repositories;
using EODomain.Models.RequestModels;
using EOInfrastructure.Services;
using FakeItEasy;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Castle.Core.Configuration;


namespace UnitTestEODashboard.Tests
{
    public class OdsTests
    {

        private readonly Mock<IOdsServices> _mockOdsServices;
        private readonly Mock<IAccountServices> accountServicesMock = new Mock<IAccountServices>();
        private readonly Mock<IOptions<ConfigSettings>> mockConfigSettings = new Mock<IOptions<ConfigSettings>>();
          private readonly OdsController _controller;
        private readonly OdsServices _OdSServicesMock;
        private readonly Mock<IOdsRepository> _mockRepository = new Mock<IOdsRepository>();
        private readonly Mock<ClaimsIdentity> claimsIdentityMock = new Mock<ClaimsIdentity>();
        
        public OdsTests()
        {
            

            
            var configSetting = new ConfigSettings
            {
                chunkSize = 100,
                cacheDuration = 100
            };
            
            _mockRepository = new Mock<IOdsRepository>();
            mockConfigSettings.Setup(x => x.Value)
                    .Returns(configSetting);
            _mockOdsServices = new Mock<IOdsServices>();
            _OdSServicesMock = new OdsServices(_mockRepository.Object);
            _controller = new OdsController(_OdSServicesMock, accountServicesMock.Object, mockConfigSettings.Object);
        }
        //[Fact]
        //public async Task GetDemandInputs_ReturnsOkWithData_WhenDataIsAvailable()
        //{
        //    // Arrange
        //    var request = new OdsCaseIdDateTimeRequest
        //    {
        //        caseID = 1,
        //        time = new DateTime(2020, 1, 1)
        //    };

        //    // Arrange
        //    var requestOds = new OdsDetailsByOdsIdListTimeRequest
        //    {
        //        OdsIdList = "5001,5002",
        //        time = new DateTime(2020, 1, 1)
        //    };

        //    var mockList = new List<GetPeOdsIdDetailsByCaseIdTimeStoredProcResponse>
        //{
        //    new GetPeOdsIdDetailsByCaseIdTimeStoredProcResponse
        //    {
        //        caseID = 101,
        //        modelId = 1,
        //        peOdsId = 5001,
        //        odsTimeStamp = DateTime.Now.AddHours(-2),
        //        seuId = 3001,
        //        seuName = "SEU-Alpha",
        //        seuCategory = "Category A",
        //        seuDisplayName = "Alpha Display",
        //        energySource = "Solar",
        //        solution = "Solution X"
        //    }
        // };

        //    _mockRepository.Setup(s => s.GetPeOdsIdDetailsByCaseIdTimeAsync(request))
        //                    .ReturnsAsync(mockList);

        //    var expectedData = new List<GetPeOdsDetailsByOdsIdListTimeStoredProcResponse>()
        //    {
        //        new GetPeOdsDetailsByOdsIdListTimeStoredProcResponse
        //        {
        //        odsID = 101,
        //        causeID = 1,
        //        effectID = 2,
        //        causeMessage = "High pressure detected",
        //        causeUom = "bar",
        //        effectMessage = "System overheating",
        //        category = "Pressure",
        //        causeValueActual = "85",
        //        causeValueOptimum = "60",
        //        suggestion = "Reduce pump speed",
        //        requestID = "REQ001",
        //        seuID = 10,
        //        seuName = "Pump1",
        //        seuCategory = "Mechanical",
        //        seuDisplayName = "Main Pump",
        //        energySource = "Electric",
        //        solution = "Speed control adjustment"
        //        }
        //    };

        //    _mockRepository.Setup(s => s.GetPeOdsDetailsByOdsIdListTimeAsync(requestOds))
        //                    .ReturnsAsync(expectedData);

        //    _mockRepository.Setup(s => s.GetOdsOveriewByCaseIdTimeAsync(request))
        //                    .ReturnsAsync(expectedData);

        //    // Act
        //    var result = await _controller.GetDemandInputs(request);

        //    // Assert
        //    var okResult = Assert.IsType<OkObjectResult>(result);
        //    var response = Assert.IsType<Response<object>>(okResult.Value);
        //    Assert.NotNull(response.data);
        //    Assert.Equal(expectedData, response.data);
        //}

        [Fact]
        public async Task GetDemandInputs_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new OdsCaseIdDateTimeRequest { caseID = 1, time = new DateTime(2020, 1, 1) };
            var expectedData = new List<GetPeOdsDetailsByOdsIdListTimeStoredProcResponse>();
            _mockRepository.Setup(s => s.GetPeOdsIdDetailsByCaseIdTimeAsync(request))
                            .ReturnsAsync(new List<GetPeOdsIdDetailsByCaseIdTimeStoredProcResponse>());

            _mockRepository.Setup(s => s.GetOdsOveriewByCaseIdTimeAsync(request))
                            .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetDemandInputs(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);

        }

        //[Fact]
        //public async Task GetDemandInputs_ReturnsOkResponse_WhenDataIsPresent()
        //{
        //    // Arrange
        //    var request = new OdsCaseIdDateTimeRequest
        //    {
        //        caseID = 1,
        //        time = new DateTime(2020, 1, 1)
        //    };

        //    var peOdsIdDetailsList = new List<GetPeOdsIdDetailsByCaseIdTimeStoredProcResponse>
        //    {
        //        new GetPeOdsIdDetailsByCaseIdTimeStoredProcResponse
        //           {
        //              peOdsId = 101,
        //              seuId = 201,
        //              seuName = "SEU Name",
        //              seuCategory = "Category",
        //              seuDisplayName = "Display Name",
        //              energySource = "Solar",
        //              solution = "Solution A",
        //              plantName = "Plant X"
        //           }
        //    };

        //    var peOdsDetailsList = new List<GetPeOdsDetailsByOdsIdListTimeStoredProcResponse>
        //       {
        //         new GetPeOdsDetailsByOdsIdListTimeStoredProcResponse
        //            {
        //               odsID = 101,
        //            }
        //    };

        //    _mockRepository.Setup(r => r.GetPeOdsIdDetailsByCaseIdTimeAsync(request))
        //                   .ReturnsAsync(peOdsIdDetailsList);

        //    _mockRepository.Setup(r => r.GetPeOdsDetailsByOdsIdListTimeAsync(It.IsAny<OdsDetailsByOdsIdListTimeRequest>()))
        //                   .ReturnsAsync(peOdsDetailsList);

        //    //_mockRepository.Setup(r => r.GetOdsOveriewByCaseIdTimeAsync(request))
        //    //               .ReturnsAsync(new List<GetPeOdsDetailsByOdsIdListTimeStoredProcResponse>());

        //    // Act
        //    var result = await _controller.GetDemandInputs(request);

        //    // Assert
        //    var okResult = Assert.IsType<OkObjectResult>(result);
        //    var response = Assert.IsType<Response<object>>(okResult.Value);

        //    Assert.Equal(200, response.statuscode);
        //    Assert.NotNull(response.data);
        //    Assert.IsAssignableFrom<List<GetPeOdsDetailsByOdsIdListTimeStoredProcResponse>>(response.data);
        //}

        #region GetOdsDataByCaseIDListTimeRange
        [Fact]
        public void GetOdsDataByCaseIDListTimeRangeReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "54,23",
                sTime = DateTime.Now.AddHours(-2).ToString(),
                eTime = DateTime.Now.ToString()
            };

            var expectedResult = new List<GetOdsDataByCaseIDListTimeRangeReqIDResponse>
            {
                new GetOdsDataByCaseIDListTimeRangeReqIDResponse()
                {
                    caseId=30,
                    category="cat",
                    causeMessage="msg",
                    causeUom="g",
                    causeValueActual=2,
                    causeValueOptimum=1,
                    effectMessage="msg",
                    gap= 1,
                    effactCauseTagName="tag",
                    odsCauseTagName="tag",
                    suggestion = "tag",
                    odsId=1,
                    timeEpoch=1,
                    timeStamp= System.DateTime.Now
                }
            };

            _mockRepository.Setup(r => r.GetOdsDataByCaseIDListTimeRangeReqIDAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(expectedResult);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(2);

            // Act
            var result = _controller.GetOdsDataByCaseIDListTimeRange(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsDataByCaseIDListTimeRangeReturnsOkWhenNoData()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "54,23",
                sTime = DateTime.Now.AddHours(-2).ToString(),
                eTime = DateTime.Now.ToString(),
            };
            var expectedResult = new List<GetOdsDataByCaseIDListTimeRangeReqIDResponse> { };

            _mockRepository.Setup(s => s.GetOdsDataByCaseIDListTimeRangeReqIDAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                            .ReturnsAsync(expectedResult);

            accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(request.caseIDList))
                               .ReturnsAsync(2);

            // Act
            var result = _controller.GetOdsDataByCaseIDListTimeRange(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);

        }

        [Fact]
        public void GetOdsDataByCaseIDListTimeRangeReturnsBadRequestForInvalidTimeRange()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "54,23",
                sTime = DateTime.Now.AddMinutes(1000).ToString(),
                eTime = DateTime.Now.ToString(),
            };

            var mockOdsRepository = new Mock<IOdsRepository>();



            // Act
            var result = _controller.GetOdsDataByCaseIDListTimeRange(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetOdsDataByCaseIDListTimeRangeReturnsBadRequestForInvalidCaseIDType()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "34,thirtyFive",
                sTime = DateTime.Now.AddMinutes(-1000).ToString(),
                eTime = DateTime.Now.ToString(),
            };



            // Act
            var result = _controller.GetOdsDataByCaseIDListTimeRange(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetOdsDataByCaseIDListTimeRangeReturnsBadRequestForInvalidCaseID()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "999999",
                sTime = DateTime.Now.AddMinutes(-1000).ToString(),
                eTime = DateTime.Now.ToString(),
            };
            string caseIDList = "999999";
            string sTime = DateTime.Now.AddMinutes(-1000).ToString();
            string eTime = DateTime.Now.ToString();


            accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(caseIDList))
                                .ReturnsAsync(0);


            // Act
            var result = _controller.GetOdsDataByCaseIDListTimeRange(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        //[Fact]
        //public void GetOdsDataByCaseIDListTimeRangeReturnsBadRequestOnException()
        //{
        //    // Arrange
        //    CaseIdListTimeRangeStringRequest request = new CaseIdListTimeRangeStringRequest
        //    {
        //        caseIDList = "999999",
        //        sTime = DateTime.Now.AddMinutes(-1000).ToString(),
        //        eTime = DateTime.Now.ToString(),
        //    };

        //    string caseIDList = "999999";
        //    string sTime = DateTime.Now.AddMinutes(-1000).ToString();
        //    string eTime = DateTime.Now.ToString();

        //    var mockOdsRepository = new Mock<IOdsRepository>();

        //    var odsServicesMock = new OdsServices(mockOdsRepository.Object);
        //    var configurationMock = new Mock<IConfiguration>();

        //    var accountServicesMock = new Mock<IAccountServices>();
        //    accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(caseIDList))
        //                        .ThrowsAsync(new Exception("Test Exception"));


        //    var controller = new OdsController(odsServicesMock, configurationMock.Object, accountServicesMock.Object);

        //    // Act
        //    var result = controller.GetOdsDataByCaseIDListTimeRange(request);

        //    // Assert
        //    var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        //    var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        //    Assert.Equal(500, response.statuscode);
        //}
        #endregion
        #region GetOdsKpiTagByCaseID

        [Fact]
        public void GetOdsKpiTagByCaseIDReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdInputRequest request = new OdsCaseIdInputRequest { caseId = 31 };

            var dataGridList = new List<GetOdsKpiTagByCaseIDStoredProcedureResponse> { };
            dataGridList.AddRange(A.CollectionOfDummy<GetOdsKpiTagByCaseIDStoredProcedureResponse>(8).AsEnumerable());

            var mockOdsRepository = new Mock<IOdsRepository>();
            _mockRepository.Setup(r => r.GetOdsKpiTagByCaseIDAsync(It.IsAny<int>())).ReturnsAsync(dataGridList);


            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsKpiTagByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsKpiTagByCaseIDReturnsOkResponseWhenNoDataFound()
        {
            // Arrange
            OdsCaseIdInputRequest request = new OdsCaseIdInputRequest { caseId = 31 };

            var dataGridList = new List<GetOdsKpiTagByCaseIDStoredProcedureResponse>();


            _mockRepository.Setup(r => r.GetOdsKpiTagByCaseIDAsync(It.IsAny<int>())).ReturnsAsync(dataGridList);

            var odsServicesMock = new OdsServices(_mockRepository.Object);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(1);




            // Act
            var result = _controller.GetOdsKpiTagByCaseID(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]
        public void GetOdsKpiTagByCaseIDReturnsBadRequestOnInValidCaseID()
        {
            // Arrange
            OdsCaseIdInputRequest request = new OdsCaseIdInputRequest { caseId = 54 };


            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(0);


            // Act
            var result = _controller.GetOdsKpiTagByCaseID(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        //[Fact]
        //public void GetOdsKpiTagByCaseIDReturnsBadRequestOnException()
        //{
        //    // Arrange
        //    CaseIdInputRequest request = new CaseIdInputRequest { caseID = 31 };

        //    var dataGridList = new List<GetOdsKpiTagByCaseIDStoredProcedureResponse> { };
        //    dataGridList.AddRange(A.CollectionOfDummy<GetOdsKpiTagByCaseIDStoredProcedureResponse>(8).AsEnumerable());

        //    var mockOdsRepository = new Mock<IOdsRepository>();
        //    mockOdsRepository.Setup(r => r.GetOdsKpiTagByCaseIDAsync(It.IsAny<int>())).ReturnsAsync(dataGridList);

        //    var odsServicesMock = new OdsServices(mockOdsRepository.Object);
        //    var configurationMock = new Mock<IConfiguration>();

        //    var accountServicesMock = new Mock<IAccountServices>();
        //    accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
        //              .ThrowsAsync(new Exception("Test Exception"));


        //    var controller = new OdsController(odsServicesMock, configurationMock.Object, accountServicesMock.Object);

        //    // Act
        //    var result = controller.GetOdsKpiTagByCaseID(request);

        //    // Assert
        //    var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        //    var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        //    Assert.Equal(500, response.statuscode);
        //}
        #endregion

        #region GetOdsDataForPlantByCaseIDListTimeRange
        [Fact]
        public void GetOdsDataForPlantByCaseIDListTimeRangeReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "34,35",
                sTime = DateTime.Now.ToString(),
                eTime = DateTime.Now.ToString(),
            };

            string caseIDList = "34,35";
            string sTime = DateTime.Now.ToString();
            string eTime = DateTime.Now.ToString();

            var dataGridList = new List<GetOdsDataForPlantByCaseIDListTimeRangeApiResponse> { };
            dataGridList.AddRange(A.CollectionOfDummy<GetOdsDataForPlantByCaseIDListTimeRangeApiResponse>(8).AsEnumerable());

            var datGridList1 = new List<GetOdsDataByCaseIDListTimeRangeReqIDResponse>
            {
                new GetOdsDataByCaseIDListTimeRangeReqIDResponse()
                {
                    caseId=30,
                    category="cat",
                    causeMessage="msg",
                    causeUom="g",
                    causeValueActual=2,
                    causeValueOptimum=1,
                    effectMessage="msg",
                    gap= 1,
                    effactCauseTagName="tag",
                    odsCauseTagName="tag",
                    suggestion = "tag",
                    odsId=1,
                    timeEpoch=1,
                    timeStamp= System.DateTime.Now,
                    actionUrl="url",
                    currentAssignee="",
                    deviationStatus="stat",
                    deviationTimestamp=System.DateTime.Now.AddHours(-9),
                    dueDate=System.DateTime.Now,
                    lastOccurencetime=System.DateTime.Now.AddHours(19),
                    affiliate="test",
                    requestId=1,
                    system="sa"
                }
            };


            _mockRepository.Setup(r => r.GetOdsDataByCaseIDListTimeRangeReqIDAsync(caseIDList, sTime, eTime)).ReturnsAsync(datGridList1);


            var odsServicesMock = new OdsServices(_mockRepository.Object);


            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(2);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;


            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsDataForPlantByCaseIDListTimeRange(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsDataForPlantByCaseIDListTimeRangeReturnsBadRequestForInvalidTimeRange()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "34,35",
                sTime = DateTime.Now.AddMinutes(1000).ToString(),
                eTime = DateTime.Now.ToString(),
            };



            // Act
            var result = _controller.GetOdsDataForPlantByCaseIDListTimeRange(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetOdsDataForPlantByCaseIDListTimeRangeReturnsBadRequestForInvalidCaseIDType()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "34,thirtyFive",
                sTime = DateTime.Now.AddMinutes(-1000).ToString(),
                eTime = DateTime.Now.ToString(),
            };



            // Act
            var result = _controller.GetOdsDataForPlantByCaseIDListTimeRange(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetOdsDataForPlantByCaseIDListTimeRangeReturnsBadRequestForInvalidCaseID()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "999999",
                sTime = DateTime.Now.AddMinutes(-1000).ToString(),
                eTime = DateTime.Now.ToString(),
            };

            string caseIDList = "999999";
            string sTime = DateTime.Now.AddMinutes(-1000).ToString();
            string eTime = DateTime.Now.ToString();


            accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(caseIDList))
                                .ReturnsAsync(0);

            var mockConfigSettings = new Mock<IOptions<ConfigSettings>>();

            // Act
            var result = _controller.GetOdsDataForPlantByCaseIDListTimeRange(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void GetOdsDataForPlantByCaseIDListTimeRangeReturnsOkWhenNoData()
        {
            // Arrange
            OdsCaseIdListTimeRangeStringRequest request = new OdsCaseIdListTimeRangeStringRequest
            {
                caseIDList = "30",
                sTime = DateTime.Now.ToString(),
                eTime = DateTime.Now.ToString(),
            };
            string caseIDList = "30";
            string sTime = DateTime.Now.ToString();
            string eTime = DateTime.Now.ToString();

            var dataGridList = new List<GetOdsDataForPlantByCaseIDListTimeRangeApiResponse> { };
            dataGridList.AddRange(A.CollectionOfDummy<GetOdsDataForPlantByCaseIDListTimeRangeApiResponse>(8).AsEnumerable());

            var datGridList1 = new List<GetOdsDataByCaseIDListTimeRangeReqIDResponse>();



            _mockRepository.Setup(r => r.GetOdsDataByCaseIDListTimeRangeReqIDAsync(caseIDList, sTime, eTime)).ReturnsAsync(datGridList1);



            accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(caseIDList))
                    .ReturnsAsync(1);

            var mockConfigSettings = new Mock<IOptions<ConfigSettings>>();

            // Act
            var result = _controller.GetOdsDataForPlantByCaseIDListTimeRange(request);

            // Assert
            var emptyResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        //[Fact]
        //public void GetOdsDataForPlantByCaseIDListTimeRangeReturnsBadRequestOnException()
        //{
        //    // Arrange
        //    CaseIdListTimeRangeStringRequest request = new CaseIdListTimeRangeStringRequest
        //    {
        //        caseIDList = "999999",
        //        sTime = DateTime.Now.AddMinutes(-1000).ToString(),
        //        eTime = DateTime.Now.ToString(),
        //    };
        //    string caseIDList = "999999";
        //    string sTime = DateTime.Now.AddMinutes(-1000).ToString();
        //    string eTime = DateTime.Now.ToString();

        //    var mockOdsRepository = new Mock<IOdsRepository>();

        //    var odsServicesMock = new OdsServices(mockOdsRepository.Object);
        //    var configurationMock = new Mock<IConfiguration>();

        //    var accountServicesMock = new Mock<IAccountServices>();
        //    accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(caseIDList))
        //                        .ThrowsAsync(new Exception("Test Exception"));


        //    var controller = new OdsController(odsServicesMock, configurationMock.Object, accountServicesMock.Object);

        //    // Act
        //    var result = controller.GetOdsDataForPlantByCaseIDListTimeRange(request);

        //    // Assert
        //    var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        //    var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        //    Assert.Equal(500, response.statuscode);
        //}
        #endregion

        #region GetOdsAlertStatisticsByCaseIDList
        [Fact]
        public void GetOdsAlertStatisticsByCaseIDListReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new GetOdsAlertStatisticsByCaseIDListResponse { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsByCaseIDList(request)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;



            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsByCaseIDList(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsByCaseIDListReturnsOkWithNoData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new GetOdsAlertStatisticsByCaseIDListResponse { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsByCaseIDList(request)).ReturnsAsync(() => null!);



            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;


            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsByCaseIDList(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsByCaseIDListReturnsOkWithError()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new GetOdsAlertStatisticsByCaseIDListResponse { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsByCaseIDList(request)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount - 1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsByCaseIDList(request);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, okResult.StatusCode);
        }
        #endregion

        #region GetOdsAlertStatisticsForRole
        [Fact]
        public void GetOdsAlertStatisticsForRoleReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListRequest req = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = req.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsForRoleResponse> { };



            _mockRepository.Setup(r => r.GetOdsAlertStatisticsForRole(req)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsForRole(req);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsForRoleReturnsOkWithNoData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new GetOdsAlertStatisticsByCaseIDListResponse { };

            var mockOdsRepository = new Mock<IOdsRepository>();
            mockOdsRepository.Setup(r => r.GetOdsAlertStatisticsForRole(request)).ReturnsAsync(() => null!);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsForRole(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsForRoleReturnsOkWithError()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsForRoleResponse> { };



            _mockRepository.Setup(r => r.GetOdsAlertStatisticsForRole(request)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount - 1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsForRole(request);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, okResult.StatusCode);
        }
        #endregion


        #region GetOdsAlertStatisticsOverdueAlerts
        [Fact]
        public void GetOdsAlertStatisticsOverdueAlertsReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsOverdueAlertsResponse> { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsOverDueAlerts(request)).ReturnsAsync(dataGridList);





            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;



            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsOverdueAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsOverdueAlertsReturnsOkWithNoData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsOverdueAlertsResponse> { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsOverDueAlerts(request)).ReturnsAsync(() => null!);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;


            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsOverdueAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsOverdueAlertsReturnsOkWithError()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsOverdueAlertsResponse> { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsOverDueAlerts(request)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount - 1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsOverdueAlerts(request);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, okResult.StatusCode);
        }
        #endregion

        #region GetOdsAlertStatisticsInProgressAlerts
        [Fact]
        public void GetOdsAlertStatisticsInProgressAlertsReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsInProgressAlertsResponse> { };

            _mockRepository.Setup(r => r.GetOdsAlertStatisticsInProgressAlerts(request)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsInProgressAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsInProgressAlertsReturnsOkWithNoData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new GetOdsAlertStatisticsInProgressAlertsResponse { };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsInProgressAlerts(request)).ReturnsAsync(() => null!);





            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsInProgressAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsInProgressAlertsReturnsOkWithError()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsAlertStatisticsInProgressAlertsResponse> { };

            _mockRepository.Setup(r => r.GetOdsAlertStatisticsInProgressAlerts(request)).ReturnsAsync(dataGridList);




            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount - 1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var mockConfigSettings = new Mock<IOptions<ConfigSettings>>();
            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = _controller.GetOdsAlertStatisticsInProgressAlerts(request);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(400, okResult.StatusCode);
        }
        #endregion

        [Fact]
        public void GetOdsAlertStatisticsByCaseIdListAndStateReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetOdsAlertStatisticsByCaseIdListAndStateRequest
            {
                caseIDList = "1,2,3",
                status = "Pending"
            };
            _mockRepository.Setup(x => x.GetOdsAlertStatisticsByCaseIdListAndStateAsync(request))
                        .ReturnsAsync(new List<GetOdsAlertStatisticsByCaseIdListAndStateStoredProcedureResponse>
                        {
                            new GetOdsAlertStatisticsByCaseIdListAndStateStoredProcedureResponse
                            {
                                status = "Pending",
                                system = "System"
                            }
                        });
            // Act
            var result = _controller.GetOdsAlertStatisticsByCaseIdListAndState(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);

        }

        [Fact]
        public void GetOdsAlertStatisticsByCaseIdListAndStateReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetOdsAlertStatisticsByCaseIdListAndStateRequest
            {
                caseIDList = "1,2,3",
                status = "Pending"
            };
            _mockRepository.Setup(x => x.GetOdsAlertStatisticsByCaseIdListAndStateAsync(request))
                        .ReturnsAsync(new List<GetOdsAlertStatisticsByCaseIdListAndStateStoredProcedureResponse>());



            // Act
            var result = _controller.GetOdsAlertStatisticsByCaseIdListAndState(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task UpdatemutealertslogByCauseIdList_ValidRequestWithData_ReturnsOkResult()
        {
            // Arrange
            var request = new UpdateMuteAlertsLogByCauseId
            {
                updatedBy = 1,
                CauseIdList = "123,456"
            };

            var expectedResult = "Update Successful";

            _mockRepository
                .Setup(r => r.UpdatemutealertslogByCauseIdListAsync(request))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.UpdatemutealertslogByCauseIdList(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task UpdatemutealertslogByCauseIdList_ReturnsEmpty_WhenResultIsNull()
        {
            // Arrange
            var request = new UpdateMuteAlertsLogByCauseId();
            var mockresult = new
            {
                Property1 = "value1",
            };
            _mockRepository.Setup(service => service.UpdatemutealertslogByCauseIdListAsync(It.IsAny<UpdateMuteAlertsLogByCauseId>()));


            // Act
            var result = await _controller.UpdatemutealertslogByCauseIdList(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Getmutealertslog_ValidRequestWithData_ReturnsOkResult()
        {
            // Arrange
            var request = new MuteAlertsLogRequest
            {
                affiliateId = 1,
            };

            var mockData = new List<object> { new { Log = "Test Log Data" } };

            _mockRepository
                .Setup(service => service.GetmutealertslogAsync(It.IsAny<MuteAlertsLogRequest>()))
                .ReturnsAsync(mockData);

            // Act
            var result = await _controller.Getmutealertslog(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Getmutealertslog_ValidRequestNoData_ReturnsEmptyResponse()
        {
            // Arrange
            var request = new MuteAlertsLogRequest
            {
                affiliateId = 1,
            };

            _mockRepository
                .Setup(service => service.GetmutealertslogAsync(It.IsAny<MuteAlertsLogRequest>()))
                .ReturnsAsync((List<object>)null!);

            // Act
            var result = await _controller.Getmutealertslog(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
        }

        [Fact]
        public async Task GetOdsTrendDataByRequestIdAndTimeRange_InvalidTimeRange_ReturnsBadRequest()
        {
            // Arrange
            var request = new RequestIdTimeStringRangeRequest
            {
                sTime = "2025-03-21T10:00:00",
                eTime = "2025-03-20T10:00:00"
            };
            _mockRepository.Setup(r => r.GetOdsTrendDataByRequestIdAndTimeRangeAsync(request));

            // Act
            var result = await _controller.GetOdsTrendDataByRequestIdAndTimeRange(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetOdsTrendDataByRequestIdAndTimeRange_ValidData_ReturnsOkResult()
        {
            // Arrange
            var request = new RequestIdTimeStringRangeRequest
            {
                requestId = 1,
                sTime = "2025-03-20T10:00:00",
                eTime = "2025-03-21T10:00:00"
            };
            var expectedResult = new List<GetOdsTrendDataByRequestIdAndTimeRangeStoredProcedureResponse>
                {
                    new GetOdsTrendDataByRequestIdAndTimeRangeStoredProcedureResponse
                    {
                        causeValueActual = 42.5,
                        causeValueOptimum = 40.0,
                        gap = 2.5,
                        timeStamp = new DateTime(2025, 04, 15, 14, 30, 00, DateTimeKind.Utc),
                        timeEpoch = new DateTimeOffset(new DateTime(2025, 04, 15, 14, 30, 00,DateTimeKind.Utc)).ToUnixTimeMilliseconds()
                    },
                    new GetOdsTrendDataByRequestIdAndTimeRangeStoredProcedureResponse
                    {
                        causeValueActual = 38.2,
                        causeValueOptimum = 40.0,
                        gap = -1.8,
                        timeStamp = new DateTime(2025, 04, 15, 15, 30, 00, DateTimeKind.Utc),
                        timeEpoch = new DateTimeOffset(new DateTime(2025, 04, 15, 15, 30, 00, DateTimeKind.Utc)).ToUnixTimeMilliseconds()
                    }

                };


            var mockData = new List<object> { new { Data = "Test Data" } };
            _mockRepository.Setup(r => r.GetOdsTrendDataByRequestIdAndTimeRangeAsync(request)).ReturnsAsync(expectedResult);            
            // Act
            var result = await _controller.GetOdsTrendDataByRequestIdAndTimeRange(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);


        }

        [Fact]
        public async Task GetOdsTrendDataByRequestIdAndTimeRange_ReturnsOkWithEmptyData_WhenNoResults()
        {
            // Arrange
            var request = new RequestIdTimeStringRangeRequest
            {
                requestId = 1,
                sTime = "2025-03-20T10:00:00",
                eTime = "2025-03-21T10:00:00"
            };

            _mockRepository
                .Setup(r => r.GetOdsTrendDataByRequestIdAndTimeRangeAsync(request))
                .ReturnsAsync(new List<GetOdsTrendDataByRequestIdAndTimeRangeStoredProcedureResponse>());

            // Act
            var result = await _controller.GetOdsTrendDataByRequestIdAndTimeRange(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYOK, response.statuscode);
            Assert.Equal(ResponseConstants.EMPTYOK_MESSAGE, response.errormsg);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public void GetOdsClosedAlertStatisticsByCaseIDListReturnsOkWithData()
        {
            // Arrange
            GetOdsClosedAlertStatisticsByCaseIDListRequest request = new GetOdsClosedAlertStatisticsByCaseIDListRequest
            {
                caseIdList = "54,23",
                dateTime = DateTime.Now
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new GetOdsClosedAlertStatisticsByCaseIDListResponse { };
            _mockRepository.Setup(r => r.GetOdsClosedAlertStatisticsByCaseIDList(request.caseIdList, request.dateTime)).ReturnsAsync(dataGridList);
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);
            // Act
            var result = _controller.GetOdsClosedAlertStatisticsByCaseIDList(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsClosedAlertStatisticsByCaseIDListReturnsOkWithNoData()
        {
            // Arrange
            GetOdsClosedAlertStatisticsByCaseIDListRequest request = new GetOdsClosedAlertStatisticsByCaseIDListRequest
            {
                caseIdList = "54,23",
                dateTime = DateTime.Now,
            };
            int requestCount = request.caseIdList.Split(",").Length;            
            _mockRepository.Setup(r => r.GetOdsClosedAlertStatisticsByCaseIDList(request.caseIdList, request.dateTime)).ReturnsAsync(() => null!);
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);
            // Act
            var result = _controller.GetOdsClosedAlertStatisticsByCaseIDList(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsClosedAlertStatisticsByCaseIDListReturnsBadRequest_WhenCaseCountMismatch()
        {
            // Arrange
            var request = new GetOdsClosedAlertStatisticsByCaseIDListRequest
            {
                caseIdList = "54,23",
                dateTime = DateTime.Now
            };

            int returnedCountFromService = 1; 

            accountServicesMock
                .Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!))
                .ReturnsAsync(returnedCountFromService);

            // Act
            var result = _controller.GetOdsClosedAlertStatisticsByCaseIDList(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, badRequestResult.StatusCode);
            Assert.Equal(ResponseConstants.CUSTOMERROR, response.statuscode);
            Assert.Equal("Invalid caseID", response.errormsg);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public void GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsReturnsOkWithData()
        {
            // Arrange
            var request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsResponse> { };
            _mockRepository.Setup(r => r.GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsAsync(request)).ReturnsAsync(dataGridList);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);


            // Act
            var result = _controller.GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsReturnsOkWithNoData()
        {
            // Arrange
            var request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int requestCount = request.caseIdList.Split(",").Length;

            var dataGridList = new List<GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsResponse> { };
            _mockRepository.Setup(r => r.GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsAsync(request)).ReturnsAsync(() => null!);
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(requestCount);

            // Act
            var result = _controller.GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlertsReturnsBadRequest_WhenCaseCountMismatch()
        {
            // Arrange
            var request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23" 
            };

            int requestCount = request.caseIdList.Split(",").Length;
            int mismatchedCaseCount = 1; 

            accountServicesMock
                .Setup(s => s.GetCaseIDCountFromCaseIDListAsync(request.caseIdList!))
                .ReturnsAsync(mismatchedCaseCount);

            // Act
            var result = _controller.GetOdsClosedAlertStatisticsStatisticsTargetModifiedAlerts(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, badRequestResult.StatusCode);
            Assert.Equal(ResponseConstants.CUSTOMERROR, response.statuscode);
            Assert.Equal("Invalid caseID", response.errormsg);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        #region GetOdsAlertStatisticsPendingAlerts
        [Fact]
        public void GetOdsAlertStatisticsPendingAlertsReturnsResposneWhenInvalidCaseID()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int caseIDCount = request.caseIdList.Split(",").Length;

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(caseIDCount - 1);

            // Act
            var result = _controller.GetOdsAlertStatisticsPendingAlerts(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
            Assert.Equal("Invalid caseID", response.errormsg);
        }
        [Fact]
        public void GetOdsAlertStatisticsPendingAlertsReturnsOkWithData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int caseIDCount = request.caseIdList.Split(",").Length;

            var expectedResult = new List<GetOdsAlertStatisticsPendingAlertsResponse>
            {
                new GetOdsAlertStatisticsPendingAlertsResponse
                {
                    alertId = 101,
                    name = "test1",
                    pendingSince = DateTime.UtcNow,
                    pendingSinceEpoch = 2023,
                    role = "Admin"
                },
                 new GetOdsAlertStatisticsPendingAlertsResponse
                {
                    alertId = 102,
                    name = "test2",
                    pendingSince = DateTime.UtcNow,
                    pendingSinceEpoch = 2024,
                    role = "Admin"
                }
            };


            _mockRepository.Setup(r => r.GetOdsAlertStatisticsPendingAlerts(request)).ReturnsAsync(expectedResult);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(caseIDCount);

            // Act
            var result = _controller.GetOdsAlertStatisticsPendingAlerts(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetOdsAlertStatisticsPendingAlertsReturnsOkWithNoData()
        {
            // Arrange
            OdsCaseIdListRequest request = new OdsCaseIdListRequest
            {
                caseIdList = "54,23"
            };
            int caseIDCount = request.caseIdList.Split(",").Length;

            var expectedResult = new List<GetOdsAlertStatisticsPendingAlertsResponse> { };

            _mockRepository.Setup(r => r.GetOdsAlertStatisticsPendingAlerts(request)).ReturnsAsync(expectedResult);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(caseIDCount);

            // Act
            var result = _controller.GetOdsAlertStatisticsPendingAlerts(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        #endregion

        #region DownloadOdsAlertStatisticsData
        [Fact]
        public void DownloadOdsAlertStatisticsDataReturnsOkWithData()
        {
            // Arrange
            OdsStatisticsDownloadDataRequest request = new OdsStatisticsDownloadDataRequest
            {
                caseIdList = "54,23",
                chunkSize = 100
            };

            var expectedResult = new List<dynamic>
            {
                new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object>
                    {
                        { "Column1", "Value1" },
                        { "Column2", 123 }
                    },
                    new Dictionary<string, object>
                    {
                        { "Column1", "Value2" },
                        { "Column2", 456 }
                    }
                }
            };



            _mockRepository.Setup(r => r.GetOdsAlertStatisticsDownloadDataAsync(It.IsAny<OdsStatisticsDownloadDataRequest>())).ReturnsAsync(expectedResult);

            // Act
            var result = _controller.DownloadOdsAlertStatisticsData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void DownloadOdsAlertStatisticsDataReturnsOkWithNoData()
        {
            // Arrange
            OdsStatisticsDownloadDataRequest request = new OdsStatisticsDownloadDataRequest
            {
                caseIdList = "54,23",
                chunkSize = 100
            };

            var expectedResult = new List<dynamic> { };

            _mockRepository.Setup(r => r.GetOdsAlertStatisticsDownloadDataAsync(It.IsAny<OdsStatisticsDownloadDataRequest>())).ReturnsAsync(expectedResult);

            // Act
            var result = _controller.DownloadOdsAlertStatisticsData(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region UpdatePeOdsAlertDetails
        [Fact]
        public void UpdatePeOdsAlertDetails_ReturnsOkWithData()
        {
            // Arrange
            var request = new UpdatePeOdsAlertDetails
            {
                requestID = 1,
                modifiedBy = "user1",
                status = "Closed",
                assignedTo = "user2",
                stageID = 3,
                targetDate = 20250530,
                actionID = 5
            };

            var expectedResponse = "Success";

            _mockRepository
                .Setup(r => r.UpdatePeOdsAlertDetailsAsync(request))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = _controller.UpdatePeOdsAlertDetails(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void UpdatePeOdsAlertDetails_ReturnsOkWithEmptyData_WhenResultIsNull()
        {
            // Arrange
            var request = new UpdatePeOdsAlertDetails
            {
                requestID = 2,
                modifiedBy = "user1",
                status = "Open",
                assignedTo = "user3",
                stageID = 2,
                targetDate = 20250601,
                actionID = 4
            };

            _mockRepository
                .Setup(r => r.UpdatePeOdsAlertDetailsAsync(request))
                .ReturnsAsync((string)null!);

            // Act
            var result = _controller.UpdatePeOdsAlertDetails(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }
        #endregion
    }
}