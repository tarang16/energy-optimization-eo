using Xunit;
using Moq;
using System.Security.Principal;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.Account;
using Microsoft.AspNetCore.Authentication.Negotiate;
using EOWebMicroservice.Controllers.v1;
using EOApplication.Contracts.Services;
using EODomain.Models.WinAuth;
using EODomain.Common;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using EOApplication.Contracts.Repositories;
using FakeItEasy;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using EOInfrastructure.Services;
using EODomain.Models.LogTables;
using EODomain.Models.Account.Workflow;
using Moq.Protected;
using Newtonsoft.Json;
using System.Text;
using System.Net.Http;

namespace UnitTestEODashboard.Tests
{
    public class WinAuthTests
    {
        private readonly Mock<IWinAuthServices> _mockWinAuthServices;
        private readonly WinAuthController _controller;
        private readonly Mock<HttpContext> _mockHttpContext;
        private readonly Mock<IWebHostEnvironment> _env;
        private readonly Mock<IConfiguration> _config;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;

        public WinAuthTests()
        {
            _mockWinAuthServices = new Mock<IWinAuthServices>();
            _mockHttpContext = new Mock<HttpContext>();
            _env = new Mock<IWebHostEnvironment>();
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            _config = new Mock<IConfiguration>();
            _controller = new WinAuthController(_mockWinAuthServices.Object, _env.Object, _config.Object);
            // Set up mock HttpContext
            var mockIdentity = new Mock<IIdentity>();
            mockIdentity.Setup(i => i.IsAuthenticated).Returns(true);
            mockIdentity.Setup(i => i.Name).Returns("TestUser");

            var mockUser = new Mock<ClaimsPrincipal>();
            mockUser.Setup(u => u.Identity).Returns(mockIdentity.Object);

            _mockHttpContext.SetupGet(c => c.User).Returns(mockUser.Object);
            _mockHttpContext.Setup(c => c.Connection.RemoteIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            _mockHttpContext.Setup(c => c.Connection.LocalIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            _mockHttpContext.Setup(c => c.Request.Headers["Sec-Ch-Ua"]).Returns("BrowserName");
            _mockHttpContext.Setup(c => c.Request.Headers.UserAgent).Returns("UserAgent");
            _mockHttpContext.Setup(c => c.Request.Headers.AcceptLanguage).Returns("en-US");

            _controller.ControllerContext.HttpContext = _mockHttpContext.Object;
        }

        [Fact]
        public async Task AuthenticateAsync_ReturnsOk_WhenAuthenticationSuccessful()
        {
            // Arrange
            var token = "TestToken";
            var request = new GetTokenRequest { forcedLogin = 2 };
            _mockWinAuthServices
                .Setup(s => s.AuthenticateAsync(It.IsAny<IIdentity>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(new AuthenticationResponse
                {
                    StatusCode = ResponseConstants.OK,
                    Token = token
                });
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);



            // Act
            var result = await _controller.AuthenticateAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(token, response.data);
        }

        [Fact]
        public async Task AuthenticateAsync_ReturnsUnauthorized_WhenAuthenticationFails()
        {
            // Arrange
            var request = new GetTokenRequest { forcedLogin = 2 };
            _mockWinAuthServices
                .Setup(s => s.AuthenticateAsync(It.IsAny<IIdentity>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(new AuthenticationResponse
                {
                    StatusCode = ResponseConstants.CUSTOMERROR
                });
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);

            // Act
            var result = await _controller.AuthenticateAsync(request);

            // Assert
            Assert.IsType<UnauthorizedResult>(result);
        }

        [Fact]
        public void GetWindowsUsername_ReturnsCorrectUsername_WhenUserIsAuthenticated()
        {
            // Arrange
            const string expectedUsername = "DOMAIN\\User";
            var controller = new WinAuthController(Mock.Of<IWinAuthServices>(), Mock.Of<IWebHostEnvironment>(), Mock.Of<IConfiguration>());

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, expectedUsername)
            }, "Negotiate"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user
                }
            };

            // Act
            var result = controller.GetWindowsUsername();

            // Assert
            Assert.Equal(expectedUsername, result);
        }

        [Fact]
        public void GetWindowsUsername_ReturnsNull_WhenUserIsUnauthenticated()
        {
            // Arrange
            var controller = new WinAuthController(Mock.Of<IWinAuthServices>(), Mock.Of<IWebHostEnvironment>(), Mock.Of<IConfiguration>());

            var user = new ClaimsPrincipal(new ClaimsIdentity()); // No authentication
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user
                }
            };

            // Act
            var result = controller.GetWindowsUsername();

            // Assert
            Assert.Null(result); // Adjust based on actual implementation
        }

        #region AuthenticateAsync
        [Fact]
        public void AuthenticateAsync_ReturnsUnAuthorizedWhenUserNotAuthenticated()
        {
            // Arrange
            GetTokenRequest request = new GetTokenRequest { forcedLogin = 1 };
            var tempusermock = new Mock<ClaimsIdentity>();
            tempusermock.SetupGet(u => u.IsAuthenticated).Returns(true);
            tempusermock.SetupGet(u => u.Name).Returns(() => null);
            var JwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var peeouser = new User();
            var expectedResult = new AuthenticationResponse
            {
                StatusCode = 200,
                Token = "token",
            };

            mockAccountRepository.Setup(s => s.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(peeouser);
            var winAuthServicesMock = new Mock<IWinAuthServices>();
            winAuthServicesMock.Setup(s => s.AuthenticateAsync(It.IsAny<IIdentity>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(expectedResult);
            var logservicesmock = new Mock<ILogger<WinAuthController>>();

            var connectionfeature = new Mock<IHttpConnectionFeature>();
            var mockhttpcontextaccessor = new Fake<IHttpContextAccessor>();

            _controller.ControllerContext = new ControllerContext();

            _controller.ControllerContext.HttpContext = new DefaultHttpContext()
            {
                User = new ClaimsPrincipal(tempusermock.Object),
            };
            _controller.ControllerContext.HttpContext.Request.Headers["Sec-Ch-Ua"] = "CHROME";
            _controller.ControllerContext.HttpContext.Request.Headers.UserAgent = "User Agent";
            _controller.ControllerContext.HttpContext.Request.Headers.AcceptLanguage = "en-US,en;q=0.9";
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(tempusermock.Object);
            _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress = new IPAddress(16885952);
            _controller.ControllerContext.HttpContext.Connection.LocalIpAddress = new IPAddress(16885952);

            tempusermock.SetupGet(u => u.IsAuthenticated).Returns(false);
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);


            // Act
            var result = _controller.AuthenticateAsync(request);

            // Assert
            var okResult = Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public void AuthenticateAsync_ReturnsOkResponseWithTokenWhenUserAuthenticatedUserName()
        {
            // Arrange
            GetTokenRequest request = new GetTokenRequest { forcedLogin = 1 };
            var tempusermock = new Mock<System.Security.Claims.ClaimsIdentity>();
            tempusermock.SetupGet(u => u.IsAuthenticated).Returns(true);
            tempusermock.SetupGet(u => u.Name).Returns("svcappscan");
            var JwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var peeouser = new User();
            var expectedResult = new AuthenticationResponse
            {
                StatusCode = 200,
                Token = "token",
            };

            mockAccountRepository.Setup(s => s.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(peeouser);
            var logservicesmock = new Mock<ILogger<WinAuthController>>();

            _mockWinAuthServices
            .Setup(s => s.AuthenticateAsync(It.IsAny<IIdentity>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
            .ReturnsAsync(expectedResult);

            var connectionfeature = new Mock<IHttpConnectionFeature>();
            var mockhttpcontextaccessor = new Fake<IHttpContextAccessor>();

            _controller.ControllerContext = new ControllerContext();

            _controller.ControllerContext.HttpContext = new DefaultHttpContext()
            {
                User = new ClaimsPrincipal(tempusermock.Object),
            };
            _controller.ControllerContext.HttpContext.Request.Headers["Sec-Ch-Ua"] = "CHROME";
            _controller.ControllerContext.HttpContext.Request.Headers.UserAgent = "User Agent";
            _controller.ControllerContext.HttpContext.Request.Headers.AcceptLanguage = "en-US,en;q=0.9";
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(tempusermock.Object);
            _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress = new IPAddress(16885952);
            _controller.ControllerContext.HttpContext.Connection.LocalIpAddress = new IPAddress(16885952);

            tempusermock.SetupGet(u => u.IsAuthenticated).Returns(true);
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);


            // Act
            var result = _controller.AuthenticateAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void AuthenticateAsync_ReturnsCUSTOMERROR()
        {
            // Arrange
            GetTokenRequest request = new GetTokenRequest { forcedLogin = 1 };
            var tempusermock = new Mock<System.Security.Claims.ClaimsIdentity>();
            tempusermock.SetupGet(u => u.IsAuthenticated).Returns(true);
            tempusermock.SetupGet(u => u.Name).Returns("svcappscan");
            var JwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var peeouser = new User();
            var expectedResult = new AuthenticationResponse
            {
                StatusCode = 204,
                Token = "token",
            };

            mockAccountRepository.Setup(s => s.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(peeouser);
            var logservicesmock = new Mock<ILogger<WinAuthController>>();

            _mockWinAuthServices.Setup(s => s.AuthenticateAsync(It.IsAny<IIdentity>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            var connectionfeature = new Mock<IHttpConnectionFeature>();
            var mockhttpcontextaccessor = new Fake<IHttpContextAccessor>();

            _controller.ControllerContext = new ControllerContext();

            _controller.ControllerContext.HttpContext = new DefaultHttpContext()
            {
                User = new ClaimsPrincipal(tempusermock.Object),
            };
            _controller.ControllerContext.HttpContext.Request.Headers["Sec-Ch-Ua"] = "CHROME";
            _controller.ControllerContext.HttpContext.Request.Headers.UserAgent = "User Agent";
            _controller.ControllerContext.HttpContext.Request.Headers.AcceptLanguage = "en-US,en;q=0.9";
            _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(tempusermock.Object);
            _controller.ControllerContext.HttpContext.Connection.RemoteIpAddress = new IPAddress(16885952);
            _controller.ControllerContext.HttpContext.Connection.LocalIpAddress = new IPAddress(16885952);

            tempusermock.SetupGet(u => u.IsAuthenticated).Returns(true);
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);


            // Act
            var result = _controller.AuthenticateAsync(request);

            // Assert
            var okResult = Assert.IsType<UnauthorizedResult>(result.Result);
        }

        [Fact]
        public void AuthenticateAsyncService_ReturnsCUSTOMERROR()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", Guid.NewGuid().ToString())
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var JwtSettingsMock = new Mock<IOptions<JwtSettings>>();

            var services = new WinAuthServices(JwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.AuthenticateAsync(identity, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>());

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void AuthenticateAsyncService_ReturnsEMPTYOK()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", Guid.NewGuid().ToString())
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            identity.AddClaim(new Claim(ClaimTypes.Name, "desiredName"));

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var JwtSettingsMock = new Mock<IOptions<JwtSettings>>();

            var services = new WinAuthServices(JwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            //Act
            var result = services.AuthenticateAsync(identity, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>());

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void AuthenticateAsyncService_ReturnsRoleEmpty()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", Guid.NewGuid().ToString())
            };

            var user = new User
            {
                affiliateCode = "15",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "desiredName",
                email = "test@gmail.com",
                employeeId = "1",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            identity.AddClaim(new Claim(ClaimTypes.Name, "desiredName"));

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var JwtSettingsMock = new Mock<IOptions<JwtSettings>>();

            mockAccountRepository.Setup(x => x.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(user);

            var services = new WinAuthServices(JwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.AuthenticateAsync(identity, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>());

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void AuthenticateAsyncReturnsEmptyOkWhenRoleIsNull()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", Guid.NewGuid().ToString())
            };

            var user = new User
            {
                affiliateCode = "15",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "1",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };

            var role = new GetRolesRoleIdByUserIdStoredProcResponse()
            {
                name = "name",
                roleId = "role"
            };

            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    isOnline = 0,
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    endTime = DateTime.Now,
                    ipAddress = "::1",
                    loginGuid = Guid.NewGuid(),
                    loginTime = DateTime.Now.AddMinutes(-20),
                    logoutTime = DateTime.Now,
                    userId = 12345678
                },
                userRole = null
            };
            string ipAddress = "127.0.0.1|112";
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            int isLogin = 1;
            var identity = new ClaimsIdentity(claims, "TestAuth");
            identity.AddClaim(new Claim(ClaimTypes.Name, "desiredName"));

            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var jwtSettings = new JwtSettings
            {
                Audience = "Test",
                DurationInMinutes = 10,
                Issuer = "Test",
                Key = "84322CFB66934ECC86D547C5CF4F2EFC",
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            };

            jwtSettingsMock.Setup(x => x.Value).Returns(jwtSettings);
            var jwtSettingsInstance = jwtSettingsMock.Object;

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();

            mockAccountRepository.Setup(x => x.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(user);
            mockAccountRepository.Setup(x => x.GetDataForAuthenticationByUserIdAsync(It.IsAny<int>())).ReturnsAsync(userData);

            var services = new WinAuthServices(jwtSettingsInstance, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.AuthenticateAsync(identity, ipAddress, browser, isLogin, It.IsAny<string>());

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void AuthenticateAsyncReturnsEmptyOkWhenGenerateTokenReturnsNull()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", Guid.NewGuid().ToString())
            };

            var user = new User()
            {
                affiliateCode = "15",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "1",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };

            var role = new GetRolesRoleIdByUserIdStoredProcResponse()
            {
                name = "name",
                roleId = "role"
            };

            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    isOnline = 0,
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    endTime = DateTime.Now,
                    ipAddress = "::1",
                    loginGuid = Guid.NewGuid(),
                    loginTime = DateTime.Now.AddMinutes(-20),
                    logoutTime = DateTime.Now,
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                }
            };

            string ipAddress = "127.0.0.1|112";
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            int isLogin = 1;
            var identity = new ClaimsIdentity(claims, "TestAuth");
            identity.AddClaim(new Claim(ClaimTypes.Name, "desiredName"));

            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var jwtSettings = new JwtSettings
            {
                Audience = "Test",
                DurationInMinutes = 10,
                Issuer = "Test",
                Key = "84322CFB66934ECC86D547C5CF4F2EFC",
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            };

            jwtSettingsMock.Setup(x => x.Value).Returns(jwtSettings);
            var jwtSettingsInstance = jwtSettingsMock.Object;

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();

            mockAccountRepository.Setup(x => x.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(user);
            mockAccountRepository.Setup(x => x.GetDataForAuthenticationByUserIdAsync(It.IsAny<int>())).ReturnsAsync(userData);

            var services = new WinAuthServices(jwtSettingsInstance, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.AuthenticateAsync(identity, ipAddress, browser, isLogin, It.IsAny<string>());

            // Assert
            Assert.NotNull(result);
        }
        #endregion

        #region GenerateToken
        [Fact]
        public void GenerateTokenTest()
        {
            // Arrange
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var jwtSettings = new JwtSettings
            {
                Audience = "Test",
                DurationInMinutes = 10,
                Issuer = "Test",
                Key = "84322CFB66934ECC86D547C5CF4F2EFC"
            };

            jwtSettingsMock.Setup(x => x.Value).Returns(jwtSettings);
            var jwtSettingsInstance = jwtSettingsMock.Object;
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var mockConfigServices = new Mock<IConfigServices>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);
            var user = new User()
            {
                affiliateCode = "15",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "1",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };

            string ipAddress = "127.0.0.1|112";
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            int isLogin = 1;

            var datalistclaim = new List<ClaimDto>()
            {
                new ClaimDto()
                {
                    claimId = 1,
                    claimType = "Admin",
                    claimValue = "Admin"
                }
            };

            GetDataForAuthenticationByUserIdStoredProcedureResponse userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse();
            var datalistroles = new GetRolesRoleIdByUserIdStoredProcResponse
            {
                name = "Admin",
                roleId = "1"
            };

            string roles = "admin";
            List<string> affiliateCaseID = new List<string> { "13", "15", "14", "54" };
            var claims = new List<Claim>
            {
                new Claim("uid", "123")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var userIdentity = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(userIdentity);
            mockAccountRepository.Setup(r => r.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(datalistclaim);
            mockAccountRepository.Setup(r => r.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object)).ReturnsAsync(roles);
            mockAccountRepository.Setup(r => r.GetRolesRoleIDByUserIdAsync(It.IsAny<int>(), httpContext.Object)).ReturnsAsync(datalistroles);
            mockAccountRepository.Setup(r => r.GetDataForAuthenticationByUserIdAsync(It.IsAny<int>())).ReturnsAsync(new GetDataForAuthenticationByUserIdStoredProcedureResponse());

            // Act
            var result1 = services.GenerateToken(user, ipAddress, browser, isLogin, userData);

            // Assert
            Assert.NotNull(result1);
        }

        [Fact]
        public void GenerateTokenWhenLoginSessionIsNotNull()
        {
            // Arrange
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var jwtSettings = new JwtSettings
            {
                Audience = "Test",
                DurationInMinutes = 10,
                Issuer = "Test",
                Key = "84322CFB66934ECC86D547C5CF4F2EFC"
            };

            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    isOnline = 0,
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    endTime = null,
                    ipAddress = "::1",
                    loginGuid = Guid.NewGuid(),
                    loginTime = DateTime.Now.AddMinutes(-20),
                    logoutTime = null,
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                }
            };

            jwtSettingsMock.Setup(x => x.Value).Returns(jwtSettings);
            var jwtSettingsInstance = jwtSettingsMock.Object;
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var mockConfigServices = new Mock<IConfigServices>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);
            var user = new User()
            {
                affiliateCode = "15",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "1",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };
            string ipAddress = "127.0.0.1|112";
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            int isLogin = 1;

            mockAccountRepository.Setup(r => r.GetDataForAuthenticationByUserIdAsync(It.IsAny<int>())).ReturnsAsync(new GetDataForAuthenticationByUserIdStoredProcedureResponse());

            // Act
            var result1 = services.GenerateToken(user, ipAddress, browser, isLogin, userData);

            // Assert
            Assert.NotNull(result1);
        }
        #endregion

        #region LogUserLoginAsync
        [Fact]
        public void LogUserLoginResturnsGuid()
        {
            // Arrange
            var user = new User()
            {
                affiliateCode = "1234",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "testuser",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };

            string ipAddress = "::1|::1";
            string browser = """Not_A Brand"; v = "8", "Chromium"; v = "120", "Microsoft Edge"; v = "120" | en - US | Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 120.0.0.0 Safari / 537.36 Edg/120.0.0.0Edge""";
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddLoginLogAsync(It.IsAny<AdmUserLoginInsert>()))
                                .ReturnsAsync(new Guid());

            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.LogUserLoginAsync(user, ipAddress, browser);

            // Assert
            Assert.IsType<Guid>(result.Result);
        }
        #endregion

        #region GetBrowserVersion
        [Fact]
        public void GetBrowserVersionTest()
        {
            // Arrange
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result1 = WinAuthServices.GetBrowserVersion("Edge", "Edge/Version1  ");
            var result2 = WinAuthServices.GetBrowserVersion("Chrome", "Chrome/Version1");
            var result3 = WinAuthServices.GetBrowserVersion("Firefox", "MozillaFirefox/Version1");

            // Assert
            Assert.Equal("Version1", result1);
            Assert.Equal("Version1", result2);
            Assert.Equal("Version1", result3);
        }
        #endregion

        #region GetBrowserName
        [Fact]
        public void GetBrowserNameReturnsString()
        {
            // Arrange
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result1 = WinAuthServices.GetBrowserName("Edge");
            var result2 = WinAuthServices.GetBrowserName("Chrome");
            var result3 = WinAuthServices.GetBrowserName("Firefox");
            var result4 = WinAuthServices.GetBrowserName("Chromium");

            // Assert
            Assert.Equal("Microsoft Edge", result1);
            Assert.Equal("Google Chrome", result2);
            Assert.Equal("Mozilla Firefox", result3);
            Assert.Equal("Chromium", result4);
        }
        #endregion

        #region GenerateLoginActivityData
        [Fact]
        public void GenerateLoginActivityDataReturnsValidDataType()
        {
            // Arrange
            var user = new User()
            {
                affiliateCode = "asd",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "testuser",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };

            string ipAddress = "::1|::1";
            string browser = """Not_A Brand"; v = "8", "Chromium"; v = "120", "Microsoft Edge"; v = "120" | en - US | Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 120.0.0.0 Safari / 537.36 Edg/120.0.0.0Edge""";
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = WinAuthServices.GenerateLoginActivityData(user, ipAddress, browser);

            // Assert
            Assert.IsType<AdmUserLoginInsert>(result);
        }
        #endregion

        #region ValidateRequestSource
        [Fact]
        public void ValidateRequestSourceReturnsTrueWhenSourceIsValid()
        {
            // Arrange
            string currentIp = "::1|::1";
            RequestIpBrowserVersion source = new RequestIpBrowserVersion
            {
                BrowserName = "Microsoft Edge",
                BrowserVersion = "120.0.0.1",
                IpAddress = "::1"
            };

            // Act
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            var result = services.ValidateRequestSource(currentIp, source);

            // Assert
            Assert.IsType<bool>(result);
            Assert.True(result);
        }

        [Fact]
        public void ValidateRequestSourceReturnsFalseWhenSourceIsValid()
        {
            // Arrange
            string currentIp = "::1|::1";
            RequestIpBrowserVersion source = new RequestIpBrowserVersion
            {
                BrowserName = "Microsoft Edge",
                BrowserVersion = "120.0.0.1",
                IpAddress = "::6"
            };

            // Act
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            var result = services.ValidateRequestSource(currentIp, source);

            // Assert
            Assert.IsType<bool>(result);
            Assert.False(result);
        }
        #endregion

        #region GetLatestLoginSessionBySessionAsync
        [Fact]
        public void GetLatestLoginSessionBySessionReturnsValidDataType()
        {
            // Arrange
            Guid guid = new Guid();
            string sessionGuid = guid.ToString();
            GetLatestLoginSessionByUserStoredProcedureResponse expectedRespnse = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-20),
                isOnline = 0,
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                endTime = DateTime.Now,
                ipAddress = "::1",
                loginGuid = Guid.NewGuid(),
                loginTime = DateTime.Now.AddMinutes(-20),
                logoutTime = DateTime.Now,
                userId = 1234
            };

            // Act
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetLatestLoginSessionBySessionAsync(It.IsAny<string>(), It.IsAny<string>()))
                            .ReturnsAsync(expectedRespnse);

            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);
            var result = services.GetLatestLoginSessionBySessionAsync(sessionGuid, "");

            // Assert
            Assert.IsType<GetLatestLoginSessionByUserStoredProcedureResponse>(result.Result);
        }
        #endregion

        #region EndUserSessionAsync
        [Fact]
        public async void EndUserSessionIsVoidMethod()
        {
            // Arrange
            int userId = 1234;

            // Act
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.EndUserSessionAsync(It.IsAny<int>()));
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);
            await services.EndUserSessionAsync(userId);

            // Assert
            Assert.IsType<int>(userId);
        }
        #endregion

        #region LogoutAndEndSessionByUserIdAsync
        [Fact]
        public async void LogoutAndEndSessionByUserIdAsyncIsVoidMethod()
        {
            // Arrange
            int userId = 1234;

            // Act
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.LogoutAndEndSessionByUserIdAsync(It.IsAny<int>()));
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);
            await services.LogoutAndEndSessionByUserIdAsync(userId);

            // Assert
            Assert.IsType<int>(userId);
        }
        #endregion

        #region GetLatestLoginSessionByUserAsync
        [Fact]
        public void GetLatestLoginSessionByUserReturnsValidDataType()
        {
            // Arrange
            int userId = 1234;
            GetLatestLoginSessionByUserStoredProcedureResponse expectedResponse = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.UtcNow,
                isOnline = 1,
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                endTime = DateTime.Now,
                ipAddress = "::1",
                loginGuid = Guid.NewGuid(),
                loginTime = DateTime.UtcNow,
                logoutTime = DateTime.Now,
                userId = userId
            };

            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetLatestLoginSessionByUserAsync(It.IsAny<int>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResponse);
            var services = new WinAuthServices(jwtSettingsMock.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GetLatestLoginSessionByUserAsync(userId, "test");

            // Assert
            Assert.IsType<GetLatestLoginSessionByUserStoredProcedureResponse>(result.Result);
        }
        #endregion

        #region CreateNewTokenGivenSessionGuid
        [Fact]
        public void CreateNewTokenGivenSessionGuidReturnsToken()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", Guid.NewGuid().ToString())
            };
            var user = new User()
            {
                affiliateCode = "15",
                affiliateName = "asda",
                country = "KSA",
                createdDate = DateTime.Now,
                domainLoginId = "fasf",
                email = "test@gmail.com",
                employeeId = "1",
                employeeName = "test user",
                isActive = true,
                region = "outerspace",
                wmUserDetailId = 1
            };
            var role = new GetRolesRoleIdByUserIdStoredProcResponse()
            {
                name = "name",
                roleId = "role"
            };

            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    isOnline = 1,
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    endTime = null,
                    ipAddress = "::1",
                    loginGuid = Guid.NewGuid(),
                    loginTime = DateTime.Now.AddMinutes(-20),
                    logoutTime = null,
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                },
                workflowData = new List<GetWorkflowUserRoleByUserId>
                {
                    new GetWorkflowUserRoleByUserId
                    {
                        roleId = 1,
                        roleName = "process manager"
                    }
                }
            };

            string ipAddress = "127.0.0.1|112";
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            var identity = new ClaimsIdentity(claims, "TestAuth");
            identity.AddClaim(new Claim(ClaimTypes.Name, "desiredName"));
            GetLatestLoginSessionByUserStoredProcedureResponse expectedResponse = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = new Guid(),
                startTime = DateTime.Now.AddMinutes(-20),
                isOnline = 0,
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                endTime = DateTime.Now,
                ipAddress = "::1",
                loginGuid = new Guid(),
                loginTime = DateTime.Now.AddMinutes(-20),
                logoutTime = DateTime.Now,
                userId = 1234
            };
            GetPlantBasedClaimsByUserIdStoredProcedureResponse res1 = new GetPlantBasedClaimsByUserIdStoredProcedureResponse()
            {
                affiliateClaimID = 1,
                caseClaimID = 1,
                plantClaimID = 1
            };

            List<GetPlantBasedClaimsByUserIdStoredProcedureResponse> res1List = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>();
            res1List.Add(res1);
            var jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
            var jwtSettings = new JwtSettings
            {
                Audience = "Test",
                DurationInMinutes = 10,
                Issuer = "Test",
                Key = "84322CFB66934ECC86D547C5CF4F2EFC",
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"

            };

            var userClaims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
                new ClaimDto
                {
                    claimId = 15,
                    claimType = "plant",
                    claimValue = "23"
                },
                new ClaimDto
                {
                    claimId = 20,
                    claimType = "plant",
                    claimValue = "30"
                }
            };

            var httpContext = new Mock<HttpContext>();
            jwtSettingsMock.Setup(x => x.Value).Returns(jwtSettings);
            var jwtSettingsInstance = jwtSettingsMock.Object;

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var mockAccountRepository = new Mock<IAccountRepository>();

            mockAccountRepository.Setup(x => x.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(user);
            mockAccountRepository.Setup(x => x.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object)).ReturnsAsync("Admin");
            mockAccountRepository.Setup(x => x.GetLatestLoginSessionByUserAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(expectedResponse);
            mockAccountRepository.Setup(x => x.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>())).ReturnsAsync(userClaims);

            string sessionGuid = Guid.NewGuid().ToString();

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1
            };
            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });

            mockAccountRepository
            .Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), It.IsAny<HttpContext>()))
            .ReturnsAsync("admin");
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));

            var services = new WinAuthServices(jwtSettingsInstance, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.CreateNewTokenGivenSessionGuid(sessionGuid, user, ipAddress, browser, 1, userData);

            // Assert
            Assert.IsType<string>(result.Result);
        }
        #endregion

        #region GenerateToken
        [Fact]
        public void GenerateTokenWhenActiveSessionNotFound()
        {
            // Arrange
            string sessionGuid = Guid.NewGuid().ToString();
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            string ipAddress = "::1|::1";
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1"; ;
            int forcedLogin = 1;
            var claims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
            };
            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    isOnline = 0,
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    endTime = DateTime.Now,
                    ipAddress = "::1",
                    loginGuid = Guid.NewGuid(),
                    loginTime = DateTime.Now.AddMinutes(-20),
                    logoutTime = DateTime.Now,
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                },
                workflowData = new List<GetWorkflowUserRoleByUserId>
                {
                    new GetWorkflowUserRoleByUserId
                    {
                        roleId = 1,
                        roleName = "process manager"
                    }
                }
            };

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1
            };

            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(claims);
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));

            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateToken(user, ipAddress, browser, forcedLogin, userData);

            // Assert
            Assert.IsType<string>(result.Result);
        }
        #endregion

        #region GenerateTokenWhenActiveSessionFound
        [Fact]
        public void GenerateTokenWhenActiveSessionFound409()
        {
            // Arrange
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };

            var request = new GenerateTokenWhenActiveSessionFoundInputRequest()
            {
                user = user
            };

            Guid guid = Guid.NewGuid();
            Guid tokenGuid = Guid.NewGuid();
            string sessionGuid = Guid.NewGuid().ToString();

            var claims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
            };

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1,
            };

            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });
            var latestLoginSession = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-20),
                isOnline = 1,
                browserName = "Microsoft Edge",
                browserVersion = "127.0.0.1",
                endTime = null,
                ipAddress = "127.0.0.1",
                loginGuid = Guid.NewGuid(),
                loginTime = DateTime.Now.AddMinutes(-20),
                logoutTime = null,
                userId = 123456

            };
            var claimsSecond = new List<Claim>
            {
                new Claim("uid", "123")
            };

            var identity = new ClaimsIdentity(claimsSecond, "TestAuth");
            var userSecond = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(userSecond);
            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetLatestLoginSessionByUserAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(latestLoginSession);
            mockAccountRepository.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(claims);
            mockAccountRepository.Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object))
                            .ReturnsAsync("admin");
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));

            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateTokenWhenActiveSessionFound(request, userData);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GenerateTokenWhenActiveSessionFoundnulltoken()
        {
            // Arrange
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            Guid guid = Guid.NewGuid();
            Guid tokenGuid = Guid.NewGuid();
            string ipAddress = "127.0.0.4|127.0.0.5";

            var request = new GenerateTokenWhenActiveSessionFoundInputRequest()
            {
                user = user,
                guid = guid,
                tokenGuid = tokenGuid,
                ipAddress = ipAddress
            };

            string sessionGuid = Guid.NewGuid().ToString();

            var claims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
            };

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1,
            };

            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });
            var latestLoginSession = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-10),
                isOnline = 1,
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                endTime = null,
                ipAddress = "127.0.0.1",
                loginGuid = Guid.NewGuid(),
                loginTime = DateTime.Now.AddMinutes(-10),
                logoutTime = null,
                userId = 123456
            };
            var claimsSecond = new List<Claim>
            {
                new Claim("uid", "123")
            };

            var identity = new ClaimsIdentity(claimsSecond, "TestAuth");
            var userSecond = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(userSecond);
            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetLatestLoginSessionByUserAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(latestLoginSession);
            mockAccountRepository.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(claims);
            mockAccountRepository.Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object))
                            .ReturnsAsync("admin");
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));

            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateTokenWhenActiveSessionFound(request, userData);

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void GenerateTokenWhenActiveSessionFound()
        {
            // Arrange
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            Guid guid = Guid.NewGuid();
            Guid tokenGuid = Guid.NewGuid();
            string ipAddress = "127.0.0.4|127.0.0.5";
            var latestLoginSession = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-10),
                endTime = null,
                logoutTime = null,
                loginTime = DateTime.Now.AddMinutes(-10),
                ipAddress = "127.0.0.1",
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                isOnline = 1,
                loginGuid = Guid.NewGuid(),
                userId = 123456
            };

            var request = new GenerateTokenWhenActiveSessionFoundInputRequest()
            {
                user = user,
                guid = guid,
                tokenGuid = tokenGuid,
                ipAddress = ipAddress,
                loginSessionData = latestLoginSession
            };

            string sessionGuid = Guid.NewGuid().ToString();

            var claims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
            };

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1,
            };

            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });
            GetPlantBasedClaimsByUserIdStoredProcedureResponse res1 = new GetPlantBasedClaimsByUserIdStoredProcedureResponse()
            {
                affiliateClaimID = 1,
                caseClaimID = 1,
                plantClaimID = 1
            };
            var claimsSecond = new List<Claim>
            {
                new Claim("uid", "123")
            };

            var identity = new ClaimsIdentity(claimsSecond, "TestAuth");
            var userSecond = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(userSecond);
            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse();

            List<GetPlantBasedClaimsByUserIdStoredProcedureResponse> res1List = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>();
            res1List.Add(res1);

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetLatestLoginSessionByUserAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(latestLoginSession);
            mockAccountRepository.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(claims);
            mockAccountRepository.Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object))
                            .ReturnsAsync("admin");
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));
            mockAccountRepository.Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object))
                            .ReturnsAsync("admin");


            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateTokenWhenActiveSessionFound(request, userData);

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void GenerateTokenWhenActiveSessionFoundValidSource()
        {
            // Arrange
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            Guid guid = Guid.NewGuid();
            Guid tokenGuid = Guid.NewGuid();
            string ipAddress = "127.0.0.4|127.0.0.5";
            var latestLoginSession = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-10),
                endTime = null,
                logoutTime = null,
                loginTime = DateTime.Now.AddMinutes(-10),
                ipAddress = "127.0.0.1",
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                isOnline = 1,
                loginGuid = Guid.NewGuid(),
                userId = 123456

            };
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            var request = new GenerateTokenWhenActiveSessionFoundInputRequest()
            {
                user = user,
                forcedLogin = 1,
                guid = guid,
                tokenGuid = tokenGuid,
                ipAddress = ipAddress,
                loginSessionData = latestLoginSession,
                browser = browser,
            };

            string sessionGuid = Guid.NewGuid().ToString();
            var claims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
            };

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1,
            };

            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });


            GetPlantBasedClaimsByUserIdStoredProcedureResponse res1 = new GetPlantBasedClaimsByUserIdStoredProcedureResponse()
            {
                affiliateClaimID = 1,
                caseClaimID = 1,
                plantClaimID = 1
            };
            var claimsSecond = new List<Claim>
            {
                new Claim("uid", "123")
            };

            var identity = new ClaimsIdentity(claimsSecond, "TestAuth");
            var userSecond = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(userSecond);
            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse();
            List<GetPlantBasedClaimsByUserIdStoredProcedureResponse> res1List = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>();
            res1List.Add(res1);

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetLatestLoginSessionByUserAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(latestLoginSession);
            mockAccountRepository.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(claims);
            mockAccountRepository.Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object))
                            .ReturnsAsync("admin");
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));
            mockAccountRepository.Setup(s => s.GetRolesbyUserIdAsync(It.IsAny<int>(), httpContext.Object))
                            .ReturnsAsync("admin");


            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateTokenWhenActiveSessionFound(request, userData);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GenerateTokenWhenActiveSessionFoundWhenForcedLogin()
        {
            // Arrange
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            Guid guid = Guid.NewGuid();
            Guid tokenGuid = Guid.NewGuid();
            string ipAddress = "127.0.0.4|127.0.0.5";
            var latestLoginSession = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-10),
                endTime = null,
                logoutTime = null,
                loginTime = DateTime.Now.AddMinutes(-10),
                ipAddress = "127.0.0.1",
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                isOnline = 1,
                loginGuid = Guid.NewGuid(),
                userId = 123456

            };
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            var request = new GenerateTokenWhenActiveSessionFoundInputRequest()
            {
                user = user,
                forcedLogin = 1,
                guid = guid,
                tokenGuid = tokenGuid,
                ipAddress = ipAddress,
                loginSessionData = latestLoginSession,
                browser = browser,
            };

            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    endTime = DateTime.Now,
                    logoutTime = DateTime.Now,
                    loginTime = DateTime.Now.AddMinutes(-20),
                    ipAddress = "::1",
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    isOnline = 0,
                    loginGuid = Guid.NewGuid(),
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                },
                workflowData = new List<GetWorkflowUserRoleByUserId>
                {
                    new GetWorkflowUserRoleByUserId
                    {
                        affiliateId = 1,
                        roleId = 1,
                        roleName = "Process Manager"
                    }
                }
            };
            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1,
            };

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));


            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateTokenWhenActiveSessionFound(request, userData);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GenerateTokenWhenActiveSessionFoundWhenNotForcedLogin()
        {
            // Arrange
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            Guid guid = Guid.NewGuid();
            Guid tokenGuid = Guid.NewGuid();
            string ipAddress = "127.0.0.4|127.0.0.5";
            var latestLoginSession = new GetLatestLoginSessionByUserStoredProcedureResponse
            {
                sessionGuid = Guid.NewGuid(),
                startTime = DateTime.Now.AddMinutes(-10),
                endTime = null,
                logoutTime = null,
                loginTime = DateTime.Now.AddMinutes(-10),
                ipAddress = "127.0.0.1",
                browserName = "Microsoft Edge",
                browserVersion = "120.0.0.1",
                isOnline = 1,
                loginGuid = Guid.NewGuid(),
                userId = 123456

            };
            string browser = "MozillaFirefox/Version1|En-en|MozillaFirefox/Version1";
            var request = new GenerateTokenWhenActiveSessionFoundInputRequest()
            {
                user = user,
                forcedLogin = 0,
                guid = guid,
                tokenGuid = tokenGuid,
                ipAddress = ipAddress,
                loginSessionData = latestLoginSession,
                browser = browser,
            };

            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    endTime = DateTime.Now,
                    logoutTime = DateTime.Now,
                    loginTime = DateTime.Now.AddMinutes(-20),
                    ipAddress = "::1",
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    isOnline = 0,
                    loginGuid = Guid.NewGuid(),
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                },
                workflowData = new List<GetWorkflowUserRoleByUserId>
                {
                    new GetWorkflowUserRoleByUserId
                    {
                        affiliateId = 1,
                        roleId = 1,
                        roleName = "Process Manager"
                    }
                }
            };
            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
            new JwtSettings
            {
                Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                Audience = "SABIC",
                Issuer = "SABIC",
                DurationInMinutes = 20,
                AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
            });

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1,
            };

            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));


            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateTokenWhenActiveSessionFound(request, userData);

            // Assert
            Assert.NotNull(result);
        }
        #endregion

        #region GenerateJwt
        [Fact]
        public void GenerateJwtReturnsToken()
        {
            // Arrange
            var guid = Guid.NewGuid();
            var tokenGuid = Guid.NewGuid();
            User user = new User
            {
                wmUserDetailId = 123,
                affiliateCode = "1000",
                employeeId = "123456",
                affiliateName = "AFFILIATE"
            };
            string ipAddress = "::1|::1";
            var claims = new List<ClaimDto>
            {
                new ClaimDto
                {
                    claimId = 1,
                    claimType = "ccp",
                    claimValue = "1"
                },
                new ClaimDto
                {
                    claimId = 2,
                    claimType = "ccp",
                    claimValue = "2"
                },
            };
            var userData = new GetDataForAuthenticationByUserIdStoredProcedureResponse()
            {
                claims = new List<ClaimDto>
                {
                    new ClaimDto
                    {
                        claimId = 1,
                        claimType = "ccp",
                        claimValue = "12"
                    },
                    new ClaimDto
                    {
                        claimId = 2,
                        claimType = "plant",
                        claimValue = "15"
                    }
                },
                plantClaims = new List<GetPlantBasedClaimsByUserIdStoredProcedureResponse>
                {
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 1,
                        caseClaimID = 2,
                        plantClaimID = 3
                    },
                    new GetPlantBasedClaimsByUserIdStoredProcedureResponse
                    {
                        affiliateClaimID = 4,
                        caseClaimID = 5,
                        plantClaimID = 6
                    }
                },
                sessionData = new GetLatestLoginSessionByUserStoredProcedureResponse
                {
                    sessionGuid = Guid.NewGuid(),
                    startTime = DateTime.Now.AddMinutes(-20),
                    endTime = DateTime.Now,
                    logoutTime = DateTime.Now,
                    loginTime = DateTime.Now.AddMinutes(-20),
                    ipAddress = "::1",
                    browserName = "Microsoft Edge",
                    browserVersion = "1.21.32.12",
                    isOnline = 0,
                    loginGuid = Guid.NewGuid(),
                    userId = 12345678
                },
                userRole = new GetRolesRoleIdByUserIdStoredProcResponse
                {
                    roleId = "12314-21421-asfas-asafs",
                    name = "Test",
                },
                workflowData = new List<GetWorkflowUserRoleByUserId>
                {
                    new GetWorkflowUserRoleByUserId
                    {
                        roleId = 1,
                        roleName = "process manager"
                    }
                }
            };

            AdmUserTokenInsert userTokenLog = new AdmUserTokenInsert
            {
                TokenGuid = Guid.NewGuid(),
                SessionGuid = Guid.NewGuid(),
                CreatedBy = 123456,
                UpdatedBy = 123456,
                IsActive = 1
            };

            IOptions<JwtSettings> mockJwt = Options.Create<JwtSettings>(
                                new JwtSettings
                                {
                                    Key = "84322CFB66934ECC86D547C5CF4F2EFC345123tsacs",
                                    Audience = "SABIC",
                                    Issuer = "SABIC",
                                    DurationInMinutes = 20,
                                    AesKey = "b14ca5898a4e4133bbce2ea2315a1916"
                                });
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            mockLoggingRepository.Setup(s => s.AddSessionLogAsync(It.IsAny<AdmUserSessionInsert>()));
            mockLoggingRepository.Setup(s => s.AddTokenLogAsync(userTokenLog))
                            .ReturnsAsync(Guid.NewGuid());
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                            .ReturnsAsync(claims);
            mockAccountRepository.Setup(s => s.DeactivateUserTokensAsync(It.IsAny<int>()));

            var services = new WinAuthServices(mockJwt, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = services.GenerateJwt(guid, tokenGuid, user, ipAddress, userData);

            // Assert
            Assert.IsType<string>(result);
        }
        #endregion

        #region GetTokenSessionLoginDataByTokenAsync
        [Fact]
        public void GetTokenSessionLoginDataByTokenReturnsData()
        {
            // Arrange
            string? tokenGuid = "asj12412nkl==12142120";
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(x => x.GetTokenSessionLoginDataByTokenAsync(tokenGuid, It.IsAny<string>()))
                                .ReturnsAsync(new GetLatestTokenDataBySessionStoredProcedureResponse());

            var mockJwtSettings = new Mock<IOptions<JwtSettings>>();
            var mockLoggingRepository = new Mock<ILoggingRepository>();
            var winauthService = new WinAuthServices(mockJwtSettings.Object, mockAccountRepository.Object, mockLoggingRepository.Object);

            // Act
            var result = winauthService.GetTokenSessionLoginDataByTokenAsync(tokenGuid, "testes");

            // Assert
            Assert.IsType<GetLatestTokenDataBySessionStoredProcedureResponse>(result.Result);
        }
        #endregion

    }
}