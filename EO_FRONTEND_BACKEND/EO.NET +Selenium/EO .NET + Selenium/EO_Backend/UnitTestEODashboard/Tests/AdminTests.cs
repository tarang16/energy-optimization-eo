using Moq;
using Xunit;
using FakeItEasy;
using System.Net;
using EODomain.Common;
using EODomain.Models;
using EODomain.Contracts;
using EODomain.Models.Admin;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using EODomain.Models.Account;
using EODomain.Models.Workflow;
using EODomain.Models.LogTables;
using EOInfrastructure.Services;
using System.Collections.Generic;
using Microsoft.Extensions.Options;
using EODomain.Models.RequestModels;
using EOWebMicroservice.Controllers;
using System.Diagnostics.CodeAnalysis;
using EOApplication.Contracts.Services;
using EOApplication.Contracts.Repositories;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.IdentityModel.Protocols.WsTrust;
using EODomain.Models.Search;
using EOWebMicroservice.Controllers.v1;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class AdminTests
    {
        private readonly Mock<IAdminRepository> adminRepositoryMock;
        private readonly Mock<IAccountRepository> accountRepositoryMock;
        private readonly AdminServices adminServicesMock;
        private readonly AdminController controller;
        private readonly Mock<IOptions<JwtSettings>>  jwtSettingsMock ;

        public AdminTests()
        {
            adminRepositoryMock = new Mock<IAdminRepository>();
            accountRepositoryMock = new Mock<IAccountRepository>();
            jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            adminServicesMock = new AdminServices(accountRepositoryMock.Object, adminRepositoryMock.Object);

            controller = new AdminController(adminServicesMock, jwtSettingsMock.Object);
        }



        

        [Fact]
        public async Task GetUserActivityDataBySessionIDOkResultWithData()
        {
            // Arrange
            var request = new GetUserActivityDataBySessionIDRequest()
            {
                pageNumber = 1,
                pageSize = 20,
                sessionId = "session"
            };


            int pageNumber = 1;
            int pageSize = 20;
            string sessionId = "session";

            
            var expectedRepoResult = new GetUserActivityStaticDataBySessionIDStoredProcedureResponse()
            {
                employeeId = 1
            };
            var userDetails = new List<GetUsersByRoleStoredProcedureResponse>()
            {
                new GetUsersByRoleStoredProcedureResponse()
                {
                    employeeId = 1234,
                    email = "random@email",
                    employeeName = "test, user"
                }
            };

            List<GetUserActivityDynamicDataBySessionIDStoredProcedureResponse> dynamicData = new List<GetUserActivityDynamicDataBySessionIDStoredProcedureResponse>()
            {
                new GetUserActivityDynamicDataBySessionIDStoredProcedureResponse()
                {
                    actionName = "On Load",
                    clientIpAdress = "0.0.0.0",
                   createdOn= DateTime.Now,
                },
            };

            var dynamicResponse = new GetUserActivityDynamicDataBySessionIDRepositoryResponse()
            {
                pageCount = 5,
                data = dynamicData
            };
            
            accountRepositoryMock.Setup(x => x.GetUserDetailsAsync(It.IsAny<string>()))
                                .ReturnsAsync(userDetails);

            adminRepositoryMock.Setup(x => x.GetUserActivityStaticDataBySessionIDAsync(sessionId))
                    .ReturnsAsync(expectedRepoResult);

            adminRepositoryMock.Setup(x => x.GetUserActivityDynamicDataBySessionIDAsync(sessionId, pageNumber, pageSize))
                    .ReturnsAsync(dynamicResponse);
            

            // Act
            var result = await controller.GetUserActivityDataBySessionID(request);

            // Assert
           Assert.IsType<OkObjectResult>(result);
           
        }

        [Fact]
        public async Task GetUserActivityDataBySessionIDReturnsOkWhenEmptyData()
        {
            // Arrange
            var request = new GetUserActivityDataBySessionIDRequest()
            {
                pageNumber = 1,
                pageSize = 20,
                sessionId = "session"
            };


            int pageNumber = 1;
            int pageSize = 20;
            string sessionId = "session";

            

            var expectedRepoResult = new GetUserActivityStaticDataBySessionIDStoredProcedureResponse()
            {
            };
            var userDetails = new List<GetUsersByRoleStoredProcedureResponse>()
            {
                new GetUsersByRoleStoredProcedureResponse()
                {
                    employeeId = 1234,
                    email = "random@email",
                    employeeName = "test, user"
                }
            };

            List<GetUserActivityDynamicDataBySessionIDStoredProcedureResponse> dynamicData = new List<GetUserActivityDynamicDataBySessionIDStoredProcedureResponse>()
            {
                new GetUserActivityDynamicDataBySessionIDStoredProcedureResponse()
                {
                    actionName = "On Load",
                    clientIpAdress = "0.0.0.0",
                    createdOn = DateTime.Now,
                },
            };

            var dynamicResponse = new GetUserActivityDynamicDataBySessionIDRepositoryResponse()
            {
                pageCount = 5,
                data = dynamicData
            };
            

            accountRepositoryMock.Setup(x => x.GetUserDetailsAsync(It.IsAny<string>()))
                                .ReturnsAsync(userDetails);

            adminRepositoryMock.Setup(x => x.GetUserActivityStaticDataBySessionIDAsync(sessionId))
                    .ReturnsAsync(expectedRepoResult);

            adminRepositoryMock.Setup(x => x.GetUserActivityDynamicDataBySessionIDAsync(sessionId, pageNumber, pageSize))
                    .ReturnsAsync(dynamicResponse);

           

            // Act
            var result = await controller.GetUserActivityDataBySessionID(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        

        [Fact]
        public async  Task ModifyErrorStatusByErrorIDOkResultWithData()
        {
            // Arrange
            int errorID = 1;
            string? status = "completed";
            string? assignedTo = "Debug Admin";

            var request = new ModifyErrorStatusByErrorIDRequest()
            {
                errorID = errorID.ToString(),
                status = status,
                assignedTo = assignedTo
            };

            

            adminRepositoryMock.Setup(x => x.ModifyErrorStatusByErrorID(errorID, status, assignedTo))
                                .ReturnsAsync(true);
            adminRepositoryMock.Setup(x => x.GetValidErrorStatusList())
                                .ReturnsAsync(new List<string> { "yts", "active", "completed" });

            

            // Act
            var result = await controller.ModifyErrorStatusByErrorID(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task ModifyErrorStatusByErrorIDBadRequest()
        {
            // Arrange
            int errorID = 1;
            string? status = "completed";
            string? assignedTo = "Debug Admin";

            var request = new ModifyErrorStatusByErrorIDRequest()
            {
                errorID = "asd",
                status = status,
                assignedTo = assignedTo
            };

            

            adminRepositoryMock.Setup(x => x.ModifyErrorStatusByErrorID(errorID, status, assignedTo))
                                .ReturnsAsync(true);
            adminRepositoryMock.Setup(x => x.GetValidErrorStatusList())
                    .ReturnsAsync(new List<string> { "yts", "active", "completed" });


            // Act
            var result = await controller.ModifyErrorStatusByErrorID(request);

            // Assert
             Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ModifyErrorStatusByErrorIDReturnsBadRequestWithBadInput()
        {
            // Arrange

            int errorID = 1;
            string? status = "not working on it";
            string? assignedTo = "Debug Admin";

            var request = new ModifyErrorStatusByErrorIDRequest()
            {
                errorID = errorID.ToString(),
                status = status,
                assignedTo = assignedTo
            };

            adminRepositoryMock.Setup(x => x.ModifyErrorStatusByErrorID(errorID, status, assignedTo))
                                .ReturnsAsync(true);
            adminRepositoryMock.Setup(x => x.GetValidErrorStatusList())
                    .ReturnsAsync(new List<string> { "yts", "active", "completed" });


            // Act
            var result = await controller.ModifyErrorStatusByErrorID(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        
        [Fact]
        public void GetErrorLogsAsyncReturnsOkWhenDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetErrorTrackingRepositoryLayerResponse
            {
                pageCount = 345,
                data = new List<GetErrorTrackingStoredProcedureResponse>
                {
                    new GetErrorTrackingStoredProcedureResponse
                    {
                        SessionID = Guid.NewGuid().ToString(),
                        CreatedOn = DateTime.Now
                    }
                }
            };
            
            adminRepositoryMock.Setup(s => s.GetErrorLogsAsync(It.IsAny<PaginatedSearch>()))
                                .ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetErrorLoggingDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetErrorLogsAsyncReturnsOkWhenNoDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetErrorTrackingRepositoryLayerResponse
            {
                pageCount = 0,
                data = null
            };
            
            adminRepositoryMock.Setup(s => s.GetErrorLogsAsync(It.IsAny<PaginatedSearch>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetErrorLoggingDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        


        [Fact]
        public void GetLoginLogsAsyncReturnsOkWhenDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetLoginTrackerRepositoryLayerResponse
            {
                pageCount = 345,
                data = new List<GetLoginTrackerStoredProcedureResponse>
                {
                    new GetLoginTrackerStoredProcedureResponse
                    {
                        EmployeeID = 12345678,
                        CreatedOn = DateTime.Now
                    }
                }
            };
            
            adminRepositoryMock.Setup(s => s.GetLoginLogsAsync(It.IsAny<PaginatedSearch>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetLoginActivityDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetLoginLogsAsyncReturnsOkWhenNoDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetLoginTrackerRepositoryLayerResponse
            {
                pageCount = 0,
                data = null
            };
            

            adminRepositoryMock.Setup(s => s.GetLoginLogsAsync(It.IsAny<PaginatedSearch>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetLoginActivityDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        


        [Fact]
        public void GetApiRequestLogsAsyncReturnsOkWhenDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetApiRequestLogsRepositoryLayerResponse
            {
                pageCount = 345,
                data = new List<GetApiRequestLogsStoredProcedureResponse>
                {
                    new GetApiRequestLogsStoredProcedureResponse
                    {
                        EmployeeID = 12345678,
                        CreatedOn = DateTime.Now
                    }
                }
            };
            
            adminRepositoryMock.Setup(s => s.GetApiRequestLogsAsync(It.IsAny<Dictionary<string, object>>(), It.IsAny<int>(), It.IsAny<int>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetApiRequestLogDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetApiRequestLogsAsyncReturnsOkWhenNoDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetApiRequestLogsRepositoryLayerResponse
            {
                pageCount = 0,
                data = null
            };
            

            adminRepositoryMock.Setup(s => s.GetApiRequestLogsAsync(It.IsAny<Dictionary<string, object>>(), It.IsAny<int>(), It.IsAny<int>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetApiRequestLogDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        


        [Fact]
        public void GetPerformanceLogsAsyncReturnsOkWhenDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetPerformanceLogsRepositoryLayerResponse
            {
                pageCount = 345,
                data = new List<GetPerformanceLogsStoredProcedureResponse>
                {
                    new GetPerformanceLogsStoredProcedureResponse
                    {
                        EmployeeID = 12345678,
                        CreatedOn = DateTime.Now
                    }
                }
            };
            

            adminRepositoryMock.Setup(s => s.GetPerformanceLogsAsync(It.IsAny<PaginatedSearch>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetPerformanceLogDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetPerformanceLogsAsyncReturnsOkWhenNoDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetPerformanceLogsRepositoryLayerResponse
            {
                pageCount = 0,
                data = null
            };
            

            adminRepositoryMock.Setup(s => s.GetPerformanceLogsAsync(It.IsAny<PaginatedSearch>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetPerformanceLogDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        


        [Fact]
        public void GetActivityTrackerLogsAsyncReturnsOkWhenDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetActivityTrackerLogsRepositoryLayerResponse
            {
                pageCount = 345,
                data = new List<GetActivityTrackerLogsStoredProcedureResponse>
                {
                    new GetActivityTrackerLogsStoredProcedureResponse
                    {
                        employeeId = 12345678,
                        createdOn = DateTime.Now
                    }
                }
            };
            

            adminRepositoryMock.Setup(s => s.GetActivityTrackerLogsAsync(It.IsAny<Dictionary<string, object>>(), It.IsAny<int>(), It.IsAny<int>()))
                                .ReturnsAsync(expectedResult);
            

            // Act
            var result = controller.GetUserActivityDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetActivityTrackerLogsAsyncReturnsEmptyOkWhenNoData()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetActivityTrackerLogsRepositoryLayerResponse
            {
                pageCount = 0,
                data = null
            };
            

            adminRepositoryMock.Setup(s => s.GetActivityTrackerLogsAsync(It.IsAny<Dictionary<string, object>>(), It.IsAny<int>(), It.IsAny<int>()))
                                .ReturnsAsync(expectedResult);


            // Act
            var result = controller.GetUserActivityDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        
        [Fact]
        public void GetQueryTrackerLogsAsyncReturnsOkWhenDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetQueryTrackerLogsRepositoryLayerResponse
            {
                pageCount = 345,
                data = new List<GetQueryTrackerLogsStoredProcedureResponse>
                {
                    new GetQueryTrackerLogsStoredProcedureResponse
                    {
                        createdDate = DateTime.Now,
                        actionUrl = "test/url",
                        size = Convert.ToDouble(1.231),
                    }
                }
            };
            

            adminRepositoryMock.Setup(s => s.GetQueryTrackerLogsAsync(It.IsAny<Dictionary<string, object>>(), It.IsAny<int>(), It.IsAny<int>()))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetQueryTrackerDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetQueryTrackerLogsAsyncReturnsOkWhenNoDataFound()
        {
            // Arrange
            GetLoggingDataWithDynamicSearchRequest request = new GetLoggingDataWithDynamicSearchRequest
            {
                pageNumber = 1,
                pageSize = 10,
                keyword = "employeeId,12345678"
            };

            var expectedResult = new GetQueryTrackerLogsRepositoryLayerResponse
            {
                pageCount = 0,
                data = null
            };
            

            adminRepositoryMock.Setup(s => s.GetQueryTrackerLogsAsync(It.IsAny<Dictionary<string, object>>(), It.IsAny<int>(), It.IsAny<int>()))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = controller.GetQueryTrackerDataWithDynamicSearch(request);
            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        


        [Fact]
        public void GetUserStatisticsReturnsOkWhenDataFound()
        {
            //Arrange
            var request = new GetUserStatisticsRequest
            {
                screenIDs = "1,2",
                affiliateIDs = "1400"
            };

            var repoResponse = new GetUserStatisticsStoredProcedureResponse
            {
                avgScreenTimeInMin = 1,
                totalActiveUsers = 1,
                totalusersonline = 1,
            };

           

            adminRepositoryMock.Setup(x => x.GetUserStatisticsAsync(request))
                        .ReturnsAsync(repoResponse);

            
            //Act
            var result = controller.GetUserStatistics(request);

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetUserStatisticsReturnsOkWhenNoDataFound()
        {
            //Arrange
            var request = new GetUserStatisticsRequest
            {
                screenIDs = "1,2",
                affiliateIDs = "1400"
            };

           

           
            //Act
            var result = controller.GetUserStatistics(request);

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        


        [Fact]
        public void GetUserStatisticsLogsReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetUserStatisticsLogsRequest
            {
                screenIDs = "13",
                affiliateIDs = "1400",
                pageSize = 10,
                pageNumber = 1
            };

            var repoResponse = new GetUserStatisticsLogsPaginatedResponse
            {
                pageCount = 1,
                data = new List<GetUserStatisticsLogsStoredProcedureResponse>
                {
                    new GetUserStatisticsLogsStoredProcedureResponse
                    {
                        screenAccessedTimeInSec = 1,
                        screenName = "Admin"
                    }
                }
            };

           
            adminRepositoryMock.Setup(x => x.GetUserStatisticsLogsAsync(request))
                        .ReturnsAsync(repoResponse);

           

            // Act
            var result = controller.GetUserStatisticsLogs(request);

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetUserStatisticsLogsReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetUserStatisticsLogsRequest
            {
                screenIDs = "13",
                affiliateIDs = "1400",
                pageSize = 10,
                pageNumber = 1
            };

           

            

            // Act
            var result = controller.GetUserStatisticsLogs(request);

            //Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        

        [Fact]
        public void GetUserAnalyticsLogsReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetUserAnalyticsLogsRequest
            {
                pageSize = 10,
                pageNumber = 1
            };

            var repoResponse = new GetUserAnalyticsLogsPaginatedResponse
            {
                pageCount = 1,
                data = new List<GetUserAnalyticsLogsStoredProcedureResponse>
                {
                    new GetUserAnalyticsLogsStoredProcedureResponse
                    {
                        ScreenName = "Admin",
                        ScreenDurationInSec = 10,
                    }
                }
            };

           
            adminRepositoryMock.Setup(x => x.GetUserAnalyticsLogsAsync(request))
                        .ReturnsAsync(repoResponse);

            

            // Act
            var response = controller.GetUserAnalyticsLogs(request);

            // Assert
            Assert.IsType<OkObjectResult>(response.Result);
        }

        [Fact]
        public void GetUserAnalyticsLogsReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetUserAnalyticsLogsRequest
            {
                pageSize = 10,
                pageNumber = 1
            };

                     
            // Act
            var response = controller.GetUserAnalyticsLogs(request);

            // Assert
            Assert.IsType<OkObjectResult>(response.Result);
        }
        


        [Fact]
        public void GetUserStatisticsGraphDataReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetUserStatisticsGraphDataRequest
            {
                screenIDs = "12"
            };

            var repoResponse = new GetUserStatisticsGraphDataCombinedResponse
            {
                distinctUsersData = new List<GetUserStatisticsGraphDataDistinctUsersStoredProcedureResponse>
               {
                   new GetUserStatisticsGraphDataDistinctUsersStoredProcedureResponse
                   {
                       affiliateName = "Affiliate",
                       distinctUsers = 1
                   }
               },
                timeWiseData = new List<GetUserStatisticsGraphDataStoredProcedureResponse>
               {
                   new GetUserStatisticsGraphDataStoredProcedureResponse
                   {
                       affiliateName = "Affiliate",
                       avgScreenTimeInMin = 10
                   }
               }
            };

            
            adminRepositoryMock.Setup(x => x.GetUserStatisticsGraphDataAsync(request))
                        .ReturnsAsync(repoResponse);


            // Act
            var result = controller.GetUserStatisticsGraphData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetUserStatisticsGraphDataReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetUserStatisticsGraphDataRequest
            {
                screenIDs = "12"
            };

                                   // Act
            var result = controller.GetUserStatisticsGraphData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        

        [Fact]
        public void GetUserAnalyticsScreenWiseReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetUserAnalyticsScreenWiseRequest
            {
                screenIDs = "12",
                employeeId = 1234
            };

            var repoResponse = new GetUserAnalyticsScreenWiseStoredProcedureResponse
            {
                screenWiseAccess = new List<ScreenNameWiseAccess>
               {
                   new ScreenNameWiseAccess
                   {
                       screenAccessedTimeInSec = 10,
                       screenName = "Admin"
                   }
               },
                dayWiseScreenAccess = new List<DayWiseScreenAccess>
               {
                   new DayWiseScreenAccess
                   {
                      screenAccessedTimeInSec = 12,
                       dayWise = "1",
                       dayWiseEpoch = 1,
                   }
               }

            };

           
            adminRepositoryMock.Setup(x => x.GetUserAnalyticsScreenWiseAsync(request))
                        .ReturnsAsync(repoResponse);


            // Act
            var result = controller.GetUserAnalyticsScreenWise(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetUserAnalyticsScreenWiseReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetUserAnalyticsScreenWiseRequest
            {
                screenIDs = "12",
                employeeId= 1234
            };

            // Act
            var result = controller.GetUserAnalyticsScreenWise(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        


        [Fact]
        public void GetUserStatisticsOnlineUsersReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new GetUserStatisticsOnlineUsersRequest
            {
                screenIDs = "12",
                affiliateIDs = "1400"
            };

            var repoResponse = new List<GetUserStatisticsOnlineUsersStoredProcedureResponse>
            {
                new GetUserStatisticsOnlineUsersStoredProcedureResponse
                {
                    ScreenName = "admin",
                    employeeId = 123,
                    employeeName = "A B C"
                }
            };

            
            adminRepositoryMock.Setup(x => x.GetUserStatisticsOnlineUsersAsync(request))
                        .ReturnsAsync(repoResponse);


            // Act
            var result = controller.GetUserStatisticsOnlineUsers(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetUserStatisticsOnlineUsersReturnsOkWhenNoDataFound()
        {
            // Arrange
            var request = new GetUserStatisticsOnlineUsersRequest
            {
                screenIDs = "12",
                affiliateIDs = "1400"
            };

           
            // Act
            var result = controller.GetUserStatisticsOnlineUsers(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

    }
}
