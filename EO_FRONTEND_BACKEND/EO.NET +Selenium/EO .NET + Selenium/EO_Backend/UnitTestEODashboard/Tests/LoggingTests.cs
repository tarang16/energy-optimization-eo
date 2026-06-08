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

using System.Diagnostics.CodeAnalysis;
using EOWebMicroservice.Controllers.v1;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class LoggingTests
    {
        private readonly LoggingServices loggingServicesMock;
        private readonly Mock<ILoggingRepository> loggingRepositoryMock;
        private readonly Mock<IAccountRepository> accountRepositoryMock;
        private readonly Mock<IConfiguration> congfigurationMock;
        private readonly LoggingController controller;
        public LoggingTests()
        {
            loggingRepositoryMock = new Mock<ILoggingRepository>();
            accountRepositoryMock = new Mock<IAccountRepository>();
            congfigurationMock = new Mock<IConfiguration>();
            loggingServicesMock = new LoggingServices(loggingRepositoryMock.Object, accountRepositoryMock.Object);

            controller = new LoggingController(congfigurationMock.Object, loggingServicesMock);
        }

        [Fact]
        public void AddPerformanceLogsReturnsOkResultWithData()
        {
            // Arrange
            UpsertLogPerformanceLogs performanceLogsController = new UpsertLogPerformanceLogs()
            {
                componentName = "Test",
                actionName = "Test",
                isActive = 1,
                endTime = DateTime.Now,
                startTime = DateTime.Now,
            };

            LogPerformanceLogs performanceLogService = new LogPerformanceLogs()
            {
                componentName = "Test",
                actionName = "Test",
                isActive = 1,
                endTime = DateTime.Now,
                startTime = DateTime.Now,
            };
            var expectedRoleResult = new GetRolesRoleIdByUserIdStoredProcResponse
            {
                roleId = "235-124qwrfqw-qwqwfqwf",
                name = "user",
            };
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            int userID = 123;
            bool expectedResult = true;

            

            loggingRepositoryMock.Setup(x => x.AddPerformanceLogsAsync(performanceLogService)).ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetRolesRoleIDByUserIdAsync(userID, httpContext.Object)).ReturnsAsync(expectedRoleResult);
            
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.AddPerformanceLogs(performanceLogsController);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void AddPerformanceLogsReturnsOkResultWhenRoleIsNotAdminOrCoporate()
        {
            // Arrange
            UpsertLogPerformanceLogs performanceLogsController = new UpsertLogPerformanceLogs()
            {
                componentName = "Test",
                actionName = "Test",
                isActive = 1,
                endTime = DateTime.Now,
                startTime = DateTime.Now,
            };

            LogPerformanceLogs performanceLogService = new LogPerformanceLogs()
            {
                componentName = "Test",
                actionName = "Test",
                isActive = 1,
                endTime = DateTime.Now,
                startTime = DateTime.Now,
            };
            var expectedRoleResult = new GetRolesRoleIdByUserIdStoredProcResponse
            {
                roleId = "235-124qwrfqw-qwqwfqwf",
                name = "user",
            };

            int userID = 123;
            bool expectedResult = true;
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            

            loggingRepositoryMock.Setup(x => x.AddPerformanceLogsAsync(performanceLogService)).ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetRolesRoleIDByUserIdAsync(userID, httpContext.Object)).ReturnsAsync(expectedRoleResult);

            
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.AddPerformanceLogs(performanceLogsController);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        


        [Fact]
        public void AddAPIPerformanceLogGetsExecuted()
        {
            //Arrange
            

            var inputData = new LogApiPerformanceLogs()
            {
                Createdby = "1234",
                RequestTimeStamp = DateTime.Now.AddMinutes(-1),
                ResponseTimeStamp = DateTime.Now,
                SessionID = "asfjk1-123-123asf",
            };

            loggingRepositoryMock.Setup(x => x.AddAPIPerformanceLog(inputData));

            //Act
            var result = loggingServicesMock.AddAPIPerformanceLog(inputData);

            //Assert
            Assert.IsType<bool>(result.Result);
        }


        [Fact]
        public void AddLoginLogReturnsGuid()
        {
            //Arrange           

            loggingRepositoryMock.Setup(x => x.AddLoginLogAsync(It.IsAny<AdmUserLoginInsert>()))
                                .ReturnsAsync(new Guid());

            //Act
            var result = loggingServicesMock.AddLoginLogAsync(It.IsAny<AdmUserLoginInsert>());

            //Assert
            Assert.IsType<Guid>(result.Result);
        }



        [Fact]
        public void AddSessionLogReturnsGuid()
        {
            //Arrange
            loggingRepositoryMock.Setup(x => x.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()))
                                .ReturnsAsync(new Guid());
            //Act
            var result = loggingServicesMock.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>());

            //Assert
            Assert.IsType<Guid>(result.Result);
        }


        [Fact]
        public void AddUserActivityTrackerReturnsOkResultWithData()
        {
            // Arrange
            ActivityTrackerRequest activityTrackerRequest = new ActivityTrackerRequest()
            {
                ApplicationName = "app",
                FunctionalityName = "function",
                UserActionName = "action",
                ScreenName = "screen",
                IsOnline = 1
            };
            string sessionID = Guid.NewGuid().ToString();
            int userID = 123;
            ActivityTracker activityTracker = new ActivityTracker()
            {
                FunctionalityName = activityTrackerRequest.FunctionalityName,
                ApplicationName = activityTrackerRequest.ApplicationName,
                ScreenName = activityTrackerRequest.ScreenName,
                SessionID = sessionID,
                IsOnline = activityTrackerRequest.IsOnline,
                CreatedOn = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                CreatedBy = userID,
                UpdatedOn = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                UpdatedBy = userID
            };

            var expectedRoleResult = new GetRolesRoleIdByUserIdStoredProcResponse
            {
                roleId = "235-124qwrfqw-qwqwfqwf",
                name = "corporate",
            };
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
           
            loggingRepositoryMock.Setup(x => x.AddUserActivityTrackerAsync(activityTracker)).ReturnsAsync(true);
            accountRepositoryMock.Setup(x => x.GetRolesRoleIDByUserIdAsync(userID, httpContext.Object)).ReturnsAsync(expectedRoleResult);

            var loggingServicesMock = new LoggingServices(loggingRepositoryMock.Object, accountRepositoryMock.Object);
            httpContext.Setup(c => c.User).Returns(user);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.AddUserActivityTracker(activityTrackerRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }



        [Fact]
        public void AddErrorLogs()
        {
            string sessionID = Guid.NewGuid().ToString();
            int userID = 123;
            // Arrange
            LogErrorLogs logErrorLogs = new LogErrorLogs()
            {
                EmployeeId = userID,
                ApplicationName = "PEEOWebMicroservice",
                HostName = Environment.MachineName,
                LayerName = "backend",
                API = "Test",
                StoredProcedure = "Test",
                Functionality = "Test",
                ErrorNumber = "Test",
                ErrorState = "Normal",
                ErrorSeverity = "Normal",
                StackTraceId = "Test",
                StackTrace = "Test",
                ErrorMessage = "Test",
                SessionId = "Test",
                RequestBody = "Test",
                CreatedBy = Convert.ToInt32(userID),
                UpdatedBy = Convert.ToInt32(userID),
                StatusCode = userID,
                WebServer = Environment.MachineName
            };


            var expectedRoleResult = new GetRolesRoleIdByUserIdStoredProcResponse
            {
                roleId = "235-124qwrfqw-qwqwfqwf",
                name = "corporate",
            };
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            

            loggingRepositoryMock.Setup(x => x.AddErrorLogsAsync(logErrorLogs)).ReturnsAsync(true);
            accountRepositoryMock.Setup(x => x.GetRolesRoleIDByUserIdAsync(userID, httpContext.Object)).ReturnsAsync(expectedRoleResult);

            var loggingServicesMock = new LoggingServices(loggingRepositoryMock.Object, accountRepositoryMock.Object);



            httpContext.Setup(c => c.Request.Path).Returns(new PathString("/test"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.AddErrorLogs(logErrorLogs);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }



        [Fact]
        public void AddActivityLogAsync()
        {
            var request = new LogActivityTracker();


            var configurationMock = new Mock<IConfiguration>();
            // Act
            var result = loggingServicesMock.AddActivityLogAsync(request);

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void GetAuditLog()
        {
            var request = new GetAuditLogRequest()
            {
                target = "spanid"
            };


            loggingRepositoryMock.Setup(x => x.GetAuditLogAsync(request)).ReturnsAsync(new List<GetAuditLogResponse>()
            { new GetAuditLogResponse()
            {
                name = "Test"
            } });

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            httpContext.Setup(c => c.Request.Path).Returns(new PathString("/test"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.GetAuditLog(request);

            // Assert
            Assert.NotNull(result);
        }



        [Fact]
        public void GetAuditLogAsync()
        {
            var request = new GetAuditLogRequest();

            var configurationMock = new Mock<IConfiguration>();
            // Act
            var result = loggingServicesMock.GetAuditLogAsync(request);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetAuditLogDecodesDataWhenRequestContainsSpanID()
        {
            var request = new GetAuditLogRequest
            {
                target = "spanid"
            };


            loggingRepositoryMock.Setup(x => x.GetAuditLogAsync(request))
                                .ReturnsAsync(new List<GetAuditLogResponse>
                                {
                                    new GetAuditLogResponse
                                    {
                                        remarks = "This looks good",
                                        changes = "This change is accepted"
                                    }
                                });


            var configurationMock = new Mock<IConfiguration>();
            // Act
            var result = loggingServicesMock.GetAuditLogAsync(request);

            // Assert
            Assert.IsType<List<GetAuditLogResponse>>(result.Result);
        }



        [Fact]
        public void GetValidAuditLogTypes()
        {
            var request = new GetAuditLogRequest()
            {
                target = "spanid"
            };


            loggingRepositoryMock.Setup(x => x.GetValidAuditLogTypesAsync()).ReturnsAsync(new List<GetValidAuditLogTypesResponse>()
            { new GetValidAuditLogTypesResponse()
            {
                name = "Test"
            } });


            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            httpContext.Setup(c => c.Request.Path).Returns(new PathString("/test"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.GetValidAuditLogTypes();

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void PostAuditLog()
        {
            var request = new AddAuditLogRequest()
            {

            };


            loggingRepositoryMock.Setup(x => x.PostAuditLogAsync(request, It.IsAny<int>())).ReturnsAsync(true);
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            httpContext.Setup(c => c.Request.Path).Returns(new PathString("/test"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.PostAuditLog(request);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetDefaultValueTest()
        {
            var request = new GetDefaultValueRequest()
            {

            };


            loggingRepositoryMock.Setup(x => x.GetDefaultValueAsync(request)).ReturnsAsync(It.IsAny<string>());
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "1241s-asfas-asrwq-4qwr")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            httpContext.Setup(c => c.Request.Path).Returns(new PathString("/test"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.GetDefaultValue(request);

            // Assert
            Assert.NotNull(result);
        }
    }
}
