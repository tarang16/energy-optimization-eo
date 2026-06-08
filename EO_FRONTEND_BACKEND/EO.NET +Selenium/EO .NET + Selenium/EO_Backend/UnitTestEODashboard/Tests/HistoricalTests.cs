using Moq;
using Xunit;
using System.Security.Claims;
using EODomain.Models;
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
using Bogus;
using EODomain.Models.HistoricalData;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class HistoricalTests
    {
        private Mock<IHistoricalRepository> historicalRepositorymock;
        private Mock<IConfiguration> configurationMock;
        private Mock<ClaimsIdentity> claimsIdentityMock;
        private Mock<IAccountServices> accountServicesMock;
        private Mock<IHistoricalServices> historyServicesMock;
        private readonly HistoricalController controller;
        public HistoricalTests()
        {
            historicalRepositorymock = new Mock<IHistoricalRepository>();
            configurationMock = new Mock<IConfiguration>();
            claimsIdentityMock = new Mock<ClaimsIdentity>();
            accountServicesMock = new Mock<IAccountServices>();
            historyServicesMock= new Mock<IHistoricalServices>();
            controller = new HistoricalController(historyServicesMock.Object);
        }

        [Fact]
        public void GetTrendDataActualOptimumReturnsOkWithData()
        {
            // Arrange
            var request = new GetTrendDataActualOptimumRequest
            {
                caseID = 10,
                tagNameList = "Test",
                sTime = DateTime.Now.AddMinutes(-10000),
                eTime = DateTime.Now,
                roundFactor = 1
            };

            historicalRepositorymock.Setup(r => r.GetTrendDataActualOptimumAsync(It.IsAny<GetTrendDataActualOptimumRequest>()))
                .ReturnsAsync(new List<GetDataTimeStartEndStoredProcResponse>
                {
                    new GetDataTimeStartEndStoredProcResponse
                    {
                        actualValue = 123.21,
                        name = "Test", 
                    }
                });

            var historicalservices = new HistoricalServices(historicalRepositorymock.Object);
            var controller = new HistoricalController(historicalservices);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext { User = user };
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act 
            var result = controller.GetTrendDataActualOptimum(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetTrendDataActualOptimumReturnsEmptyOkWhenNoDataFound()
        {
            // Arrange
            GetTrendDataActualOptimumRequest request = new GetTrendDataActualOptimumRequest
            {
                caseID = 10,
                tagNameList = "TestTags",
                sTime = DateTime.Now.AddMinutes(-10000),
                eTime = DateTime.Now,
                roundFactor = 1
            };
            var faker = new Faker();
            int caseID = faker.Random.Number(100000, 999999);
            string tagNameList = faker.Lorem.Word();
            DateTime sTime = faker.Date.Recent();
            DateTime eTime = faker.Date.Soon(5);
            //int rounding_factor = 2;

            historyServicesMock.Setup(s => s.GetActualOptimumTrendDataAsync(request))
                .ReturnsAsync(() => null!);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetTrendDataActualOptimum(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetTrendDataActualOptimumReturnsOktagname()
        {
            // Arrange
            GetTrendDataActualOptimumRequest request = new GetTrendDataActualOptimumRequest
            {
                caseID = 10,
                tagNameList = ",TestTags,TestTags1,",
                sTime = DateTime.Now.AddMinutes(-10000),
                eTime = DateTime.Now,
                roundFactor = 1
            };
            var faker = new Faker();
            int caseID = faker.Random.Number(100000, 999999);
            string tagNameList = faker.Lorem.Word();
            DateTime sTime = faker.Date.Recent();
            DateTime eTime = faker.Date.Soon(5);

            var dataList = new List<GetDataTimeStartEndStoredProcResponse>()
            {
                new GetDataTimeStartEndStoredProcResponse()
                {
                    actualValue = Convert.ToDouble(123.21),
                    name = "Test",
                }
            };
            List<ActualOptimumTrendResponse> res = new List<ActualOptimumTrendResponse>() {
                new ActualOptimumTrendResponse
                {
                    a = (double) 10.4,
                    o = (double) 10.5,
                    r = 1,
                    t = 1232,
                }
            };

            historicalRepositorymock.Setup(r => r.GetTrendDataActualOptimumAsync(request)).ReturnsAsync(dataList);

            var historicalservicesmock = new HistoricalServices(historicalRepositorymock.Object);
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetTrendDataActualOptimum(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetCalenderDataReturnsOkWithData()
        {
            // Arrange
            CaseIdInputRequest request = new CaseIdInputRequest { caseID = 31 };
            var faker = new Faker();
            int caseID = faker.Random.Number(100000, 999999);

            var dataList = new List<GetCalendarDataStoredProcResponse> { };
            dataList.AddRange(A.CollectionOfDummy<GetCalendarDataStoredProcResponse>(8).AsEnumerable());

            historicalRepositorymock.Setup(r => r.GetCalenderDataAsync(It.IsAny<int>())).ReturnsAsync(dataList);

            var historicalservicesmock = new HistoricalServices(historicalRepositorymock.Object);
            var configurationMock = new Mock<IConfiguration>();
            var loggingservicesMock = new Mock<ILoggingServices>();
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            var accountServicesMock = new Mock<IAccountServices>();

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            var controller = new HistoricalController(historicalservicesmock);
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetCalenderData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public void GetCalenderDataReturnsBadRequestWhenNoDataFound()
        {
            // Arrange
            CaseIdInputRequest request = new CaseIdInputRequest { caseID = 31 };
            var faker = new Faker();
            int caseID = faker.Random.Number(100000, 999999);


            var historicalservicesmock = new Mock<IHistoricalServices>();
            historicalservicesmock.Setup(s => s.GetCalenderDataAsync(It.IsAny<int>()))
                .ReturnsAsync(null);

            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>()))
                      .ReturnsAsync(1);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetCalenderData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetDataModelSkipReturnsOkWithData()
        {
            // Arrange
            var request = new CaseIdTimeRangeDayDiffRequest
            {
                caseID = 31,
                sTime = DateTime.Now.AddDays(-1),
                eTime = DateTime.Now,
                dayDiff = 5,
                pageSize = 10,
                pageNumber = 1
            };

            var repoResponse = new List<GetDataModelSkipStoredProcedureResponse>()
            {
              new GetDataModelSkipStoredProcedureResponse()
                 {
                    actual = "10.321",
                    status = "completed",
                    max = "100.231"
                 } 
            };

            historicalRepositorymock.Setup(r => r.GetDataModelSkipDataAsync(request))
                .ReturnsAsync(repoResponse);

            var historicalServicesMock = new HistoricalServices(historicalRepositorymock.Object);
            var controller = new HistoricalController(historicalServicesMock);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext { User = user };
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await controller.GetDataModelSkipMonitoringData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetDataModelSkipReturnsOkWithNoData()
        {
            // Arrange
            var request = new CaseIdTimeRangeDayDiffRequest
            {
                caseID = 31,
                sTime = DateTime.Now.AddDays(-1),
                eTime = DateTime.Now,
                dayDiff = 5,
                pageSize = 10,
                pageNumber = 1
            };


            historicalRepositorymock
                .Setup(r => r.GetDataModelSkipDataAsync(It.IsAny<CaseIdTimeRangeDayDiffRequest>()))
                .ReturnsAsync((List<GetDataModelSkipStoredProcedureResponse>)null!);

            // Act
            var result = await controller.GetDataModelSkipMonitoringData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

            [Fact]
        public void GetOpportunityTrendByCaseIDListReturnsOkWithData()
        {
            // Arrange
            var request = new CaseIdListTimeRangeStringRequest
            {
                caseIDList = "54,55,56",
                sTime = DateTime.Now.AddDays(-1),
                eTime = DateTime.Now
            };
            
            historicalRepositorymock
                .Setup(r => r.GetOpportunityTrendDataAsync(It.IsAny<CaseIdListTimeRangeStringRequest>()))
                .ReturnsAsync(new { dummy = "data" });

            var historicalservicesmock = new HistoricalServices(historicalRepositorymock.Object);
            
            var controller = new HistoricalController(historicalservicesmock);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext { User = user };
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetOpportunityTrendDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetOpportunityTrendByCaseIDListReturnsOkWithNoData()
        {
            // Arrange
            CaseIdListTimeRangeStringRequest request = new CaseIdListTimeRangeStringRequest
            {
                caseIDList = "54,55,56",
                sTime = DateTime.Now.AddDays(-1),
                eTime = DateTime.Now
            };
            var faker = new Faker();
            int caseID = faker.Random.Number(100000, 999999);
            string sTime = faker.Date.Recent().ToString();
            string eTime = faker.Date.Soon(5).ToString();
            string? caseIDList = "54,55,56";

            historicalRepositorymock.Setup(r => r.GetOpportunityTrendDataAsync(request)).ReturnsAsync(null);

            var historicalservicesmock = new HistoricalServices(historicalRepositorymock.Object);
            accountServicesMock.Setup(s => s.GetCaseIDCountFromCaseIDListAsync(caseIDList)).ReturnsAsync(3);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;



            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetOpportunityTrendDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetDataModelSkipCalenderDataReturnsOkWhenNoDataFound()
        {
            //Arrange
            CaseIdTimeRangeRequest request = new CaseIdTimeRangeRequest
            {
                caseID = 54,
                sTime = DateTime.Now.AddDays(-1),
                eTime = DateTime.Now
            };

            string caseIDList = "54";
            accountServicesMock.Setup(x => x.GetCaseIDCountFromCaseIDListAsync(caseIDList))
                .ReturnsAsync(1);
            historicalRepositorymock.Setup(x => x.GetDataModelSkipMonitoringCalendarDataAsync(request))
                                .ReturnsAsync(new List<GetCalendarDataStoredProcResponse>());
            //Act
            var result = controller.GetDataModelSkipMonitoringCalendarData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetDataModelSkipCalenderDataReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new CaseIdTimeRangeRequest
            {
                caseID = 54,
                sTime = DateTime.Now.AddDays(-1),
                eTime = DateTime.Now
            };

            var storedProcResponse = new List<GetCalendarDataStoredProcResponse>
            {
                new GetCalendarDataStoredProcResponse
                {
                    status = 200,
                    time = DateTime.Now,
                    timeEpoch = "1231241254"
                }
            };

            historicalRepositorymock.Setup(x => x.GetDataModelSkipMonitoringCalendarDataAsync(It.IsAny<CaseIdTimeRangeRequest>()))
                                    .ReturnsAsync(storedProcResponse);

            var historicalservicesmock = new HistoricalServices(historicalRepositorymock.Object);
            var controller = new HistoricalController(historicalservicesmock);

            // Act
            var result = controller.GetDataModelSkipMonitoringCalendarData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }
    }
}
