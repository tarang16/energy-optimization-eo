using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using EOApplication.Contracts.Services;
using EOWebMicroservice.Controllers.v1;
using EODomain.Models.Requests;
using EODomain.Common;
using EODomain.Models.Network;
using System;
using System.Threading.Tasks;
using EODomain.Models.Config;
using System.Dynamic;
using EOApplication.Contracts.Repositories;
using EOInfrastructure.Services;
using EODomain.Models.Current;
using AutoFixture;




namespace UnitTestEODashboard.Tests
{
    public class CurrentTests
    {
        private readonly CurrentServices _mockCurrentServices;
        private readonly CurrentController _controller;
        private readonly Mock<ICurrentRepository> _mockCurrentRepository;

        public CurrentTests()
        {
            _mockCurrentRepository = new Mock<ICurrentRepository>();

            _mockCurrentServices = new CurrentServices(_mockCurrentRepository.Object);
            _controller = new CurrentController(_mockCurrentServices);
           
        }
        [Fact]
        public async Task GetKpiOutput_ReturnsOkWithData_WhenDataIsAvailable()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1, time = DateTime.Now };
            var expectedData = new { Key = "Value" }; // Replace with actual type

            _mockCurrentRepository.Setup(s => s.GetKpiOutputAsync(request.caseID, request.time))
                                .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetKpiOutput(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.Equal(expectedData, response.data);
        }
        [Fact]
        public async Task GetKpiOutput_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1, time = DateTime.Now };

            _mockCurrentRepository.Setup(s => s.GetKpiOutputAsync(request.caseID, request.time))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetKpiOutput(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204,response.statuscode);
            


        }
        [Fact]
        public async Task GetTimeActualDataAsync_ReturnsOkWithData_WhenDataIsAvailable()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 1 };
            var expectedData = new { Time = "10:00 AM" }; // Replace with actual type

            _mockCurrentRepository.Setup(s => s.GetTimeActualDataAsync(request.caseID))
                                .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetTimeActualDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.Equal(expectedData, response.data);
        }
        [Fact]
        public async Task GetTimeActualDataAsync_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 1 };

            _mockCurrentRepository.Setup(s => s.GetTimeActualDataAsync(request.caseID))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetTimeActualDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.Equal(204, response.statuscode);
        }
        [Fact]
        public async Task GetSystemTopTileDataAsync_ReturnsOkWithData_WhenDataIsAvailable()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1, time =  DateTime.Now };
            
            var expectedResult = new List<GetSystemTopTileDataStoredProcResponse>
            {
                new GetSystemTopTileDataStoredProcResponse
                {
                    caseId = 201,
                    tagId = 701,
                    tagName = "Pump Pressure",
                    actual = 45.6,
                    uomName = "psi",
                    deviationActive = 1,
                    deviationOverdue = 0
                },
                new GetSystemTopTileDataStoredProcResponse
                {
                    caseId = 202,
                    tagId = 702,
                    tagName = "Boiler Temperature",
                    actual = 102.4,
                    uomName = "°C",
                    deviationActive = 0,
                    deviationOverdue = 1
                }
            };
            _mockCurrentRepository.Setup(s => s.GetSystemTopTileDataAsync(request.caseID, request.time))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetSystemTopTileDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            
        }
        [Fact]
        public async Task GetSystemTopTileDataAsync_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1, time=DateTime.Now };
            var expectedResult = new List<GetSystemTopTileDataStoredProcResponse>() { };
            _mockCurrentRepository.Setup(s => s.GetSystemTopTileDataAsync(request.caseID, request.time))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetSystemTopTileDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(200,response.statuscode);


        }
        [Fact]
        public async Task GetMonitoringData_ReturnsOkWithData_WhenDataIsAvailable()
        {
            // Arrange
            var dataGridList = new GetMonitoringDataStoredProcedurePaginatedResponse();
            Fixture _fixture = new Fixture();

            dataGridList.GetMonitoringDataStoredProcedureResponse = _fixture.CreateMany<GetMonitoringDataStoredProcedureResponse>().ToList();//.AddRange(A.CollectionOfDummy<GetMonitoringDataStoredProcedureResponse>(8).AsEnumerable());
            dataGridList.pageCount = _fixture.Create<int>();
            var request = new CaseIdDateTimeApiMonitoringRequest { caseID = 1, time = DateTime.Now };

            _mockCurrentRepository.Setup(s => s.GetMonitoringDataAsync(request))
                                .ReturnsAsync(dataGridList);

            // Act
            var result = await _controller.GetMonitoringData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<PaginatedResponse<object>>(okResult.Value);
            Assert.NotNull(response.data);

        }
        [Fact]
        public async Task GetMonitoringData_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new CaseIdDateTimeApiMonitoringRequest { caseID = 1, time = DateTime.Now };
            var dataGridList = new GetMonitoringDataStoredProcedurePaginatedResponse();
            _mockCurrentRepository.Setup(s => s.GetMonitoringDataAsync(request))
                                .ReturnsAsync(dataGridList);

            // Act
            var result = await _controller.GetMonitoringData(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.NotNull(response.data);
        }
        [Fact]
        public async Task GetTreeDiagramByCaseID_ReturnsOkWithData_WhenDataIsAvailable()
        {
            // Arrange
            var request = new GetTreeDiagramByCaseIDRequest { caseId = 1 };
            var expectedData = new { Nodes = 10, Edges = 15 }; // Replace with actual type

            _mockCurrentRepository.Setup(s => s.GetTreeDiagramByCaseIDAsync(request))
                                .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetTreeDiagramByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.Equal(expectedData, response.data);
        }
        [Fact]
        public async Task GetTreeDiagramByCaseID_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new GetTreeDiagramByCaseIDRequest { caseId = 1 };

            _mockCurrentRepository.Setup(s => s.GetTreeDiagramByCaseIDAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetTreeDiagramByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204,response.statuscode);
            Assert.NotNull(response.data);
        }
        [Fact]
        public async Task GetOverviewTrendDataAsync_ReturnsOkWithData_WhenDataIsAvailable()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 1 };
            var expectedData = new { Trend = "Increasing" }; // Replace with actual type

            _mockCurrentRepository.Setup(s => s.GetOverviewTrendDataAsync(request.caseID))
                                .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetOverviewTrendDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.Equal(expectedData, response.data);
        }
        [Fact]
        public async Task GetOverviewTrendDataAsync_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 1 };

            _mockCurrentRepository.Setup(s => s.GetOverviewTrendDataAsync(request.caseID))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetOverviewTrendDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204,response.statuscode);
            Assert.NotNull(response.data);

        }
        #region GetSeuOutputDataAsyn
        [Fact]
        public void GetSeuOutputDataAsyncResponseWhenDataExists()
        {
            // Arrange
            var expectedResult = new List<ExpandoObject>();
            int caseID = 123456;
            DateTime time= DateTime.Now;
            var request = new CaseIdDateTimeRequest
            {
                caseID = caseID,
                time = time
            };
            


            dynamic obj1 = new ExpandoObject();
            obj1.caseID = 201;
            obj1.caseName = "Energy Optimization Project";
            obj1.frequency = 12;


            expectedResult.Add(obj1);

            dynamic obj2 = new ExpandoObject();
            obj2.caseID = 202;
            obj2.caseName = "Safety Compliance Upgrade";
            obj2.frequency = 6;

            _mockCurrentRepository.Setup(r => r.GetSeuOutputDataAsync(caseID,time)).ReturnsAsync(expectedResult);

            // Act
            var result = _controller.GetSeuOutputDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetSeuOutputDataAsyncResponseWhenNoDataExists()
        {
            // Arrange
            
            int caseID = 123456;
            DateTime time = DateTime.Now;
            var request = new CaseIdDateTimeRequest
            {
                caseID = caseID,
                time = time
            };

            _mockCurrentRepository.Setup(r => r.GetSeuOutputDataAsync(caseID, time)).ReturnsAsync(null);

            // Act
            var result = _controller.GetSeuOutputDataAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetSeecTrendDataAsync
        [Fact]
        public void GetSeecTrendDataAsyncResponseWhenDataExists()
        {
            // Arrange
            var expectedResult = new List<ExpandoObject>();
            
            var request = new CaseIdTimeRangeGroupByRequest
            {
                caseID = 123456, 
                sDate =  DateTime.Now,
                eDate = DateTime.Now,
                groupBy = "month" 
            };

            dynamic obj1 = new ExpandoObject();
            obj1.caseID = 201;
            obj1.caseName = "Energy Optimization Project";
            obj1.frequency = 12;
            expectedResult.Add(obj1);

            dynamic obj2 = new ExpandoObject();
            obj2.caseID = 202;
            obj2.caseName = "Safety Compliance Upgrade";
            obj2.frequency = 6;

            _mockCurrentRepository.Setup(r => r.GetSeecTrendDataAsync(request)).ReturnsAsync(expectedResult);

            // Act
            var result = _controller.GetSeecTrendDataAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetSeecTrendDataAsyncResponseWhenNoDataExists()
        {
            // Arrange
            

            var request = new CaseIdTimeRangeGroupByRequest
            {
                caseID = 123456,
                sDate = DateTime.Now,
                eDate =DateTime.Now,
                groupBy = "month"
            };

            _mockCurrentRepository.Setup(r => r.GetSeecTrendDataAsync(request)).ReturnsAsync(null);

            // Act
            var result = _controller.GetSeecTrendDataAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetEnegryDistributionAsync
        [Fact]
        public async Task GetEnegryDistributionAsync_ReturnsEmptyResponse_WhenResultIsNull()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1, time = DateTime.UtcNow };

            _mockCurrentRepository
                .Setup(x => x.GetEnegryDistributionAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetEnegryDistributionAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]
        public async Task GetEnegryDistributionAsync_ReturnsDataResponse_WhenResultIsNotNull()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1, time = DateTime.UtcNow };

            var dummyData = new List<dynamic>
            {
                new { Property1 = "Value1", Property2 = 123 },
                new { Property1 = "Value2", Property2 = 456 }
            };

            _mockCurrentRepository
                .Setup(x => x.GetEnegryDistributionAsync(It.IsAny<CaseIdDateTimeRequest>()))
                .ReturnsAsync(dummyData);

            // Act
            var result = await _controller.GetEnegryDistributionAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(dummyData, response.data);
        }
        #endregion

        #region GetKevsOutputAsync
        [Fact]
        public async Task GetKevsOutputAsync_ReturnsSuccessResponse_WhenResultIsNotNull()
        {
            // Arrange 
            var request = new CaseIdDateTimeRequest { caseID = 1, time = DateTime.UtcNow };
            var serviceResponse = new { id = 123, output = "Some KEVs Data" };

            _mockCurrentRepository
                 .Setup(s => s.GetKevsOutputAsync(It.IsAny<CaseIdDateTimeRequest>()))
                 .ReturnsAsync(serviceResponse);

            // Act 
            var result = await _controller.GetKevsOutputAsync(request);

                   var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);

            Assert.Equal(200, response.statuscode);
                }
        [Fact]
        public async Task GetKevsOutputAsync_ReturnsEmptyResponse_WhenResultIsNull()
        {
            // Arrange 
            var request = new CaseIdDateTimeRequest { caseID = 2, time = DateTime.UtcNow };

            _mockCurrentRepository
                 .Setup(s => s.GetKevsOutputAsync(It.IsAny<CaseIdDateTimeRequest>()))
                 .Returns(Task.FromResult<dynamic>(null!));

            // Act 
            var result = await _controller.GetKevsOutputAsync(request);

            // Assert 
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(204, response.statuscode);

        }
        #endregion
    }
}
