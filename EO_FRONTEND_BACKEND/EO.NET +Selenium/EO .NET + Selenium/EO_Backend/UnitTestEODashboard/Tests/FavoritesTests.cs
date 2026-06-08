using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models;
using EODomain.Models.Account;
using EODomain.Models.Config;
using EODomain.Models.Favorites;
using EOInfrastructure.Services;
using EOWebMicroservice.Controllers.v1;
using FakeItEasy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Diagnostics.CodeAnalysis;
using System.Dynamic;
using System.Net;
using System.Security.Claims;
using Xunit;


namespace UnitTestEODashboard.Tests
{

    [ExcludeFromCodeCoverage]
    public  class FavoritesTests
    {
        private readonly FavoritesServices favServicesMock;
        private readonly Mock<IFavoritesRepository> favRepositoryMock;
        private readonly Mock<IAccountServices> accountServicesMock;
        private readonly Mock<IAccountRepository> accountRepositoryMock;
        private readonly Mock<IWinAuthServices> winAuthServicesMock;
        private readonly FavoritesController controller;
        public FavoritesTests()
        {
            favRepositoryMock = new Mock<IFavoritesRepository>();
            accountRepositoryMock = new Mock<IAccountRepository>();
            accountServicesMock = new Mock<IAccountServices>();
            winAuthServicesMock = new Mock<IWinAuthServices>();
            favServicesMock = new FavoritesServices(favRepositoryMock.Object, accountRepositoryMock.Object);            
            controller = new FavoritesController(favServicesMock, accountServicesMock.Object, winAuthServicesMock.Object);
        }

        [Fact]
        public void GetFavoriteByUserIDEmptyOkResponseWhenNoData()
        {
            // Arrange
            int userID = 1;
            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(s => s.GetFavoriteByUserIDAsync(userID))
                    .ReturnsAsync(new List<GetFavoriteByUserIDStoredProcedureResponse>());

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetFavoriteByUserID();

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]
        public void GetFavoriteByUserIDResponseWhenDataExists()
        {
            // Arrange

            int userID = 1;
            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var getFavoriteResponse = new List<GetFavoriteByUserIDStoredProcedureResponse>
            {
                new GetFavoriteByUserIDStoredProcedureResponse
                {
                    Id = 1123,
                    url = "https://home",
                    title = "Home"
                }
            };
            var peeoUser = new User()
            {
                employeeId = "123",
                email = null,
                wmUserDetailId = userID,
                affiliateCode = "1000",
                affiliateName = null,
                isActive = true,
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();

            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.GetFavoriteByUserIDAsync(It.IsAny<int>()))
                            .ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>()))
                            .ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetFavoriteByUserID();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetFavoriteByUserIDResponseWhenDataExistsNULL()
        {
            // Arrange

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var getFavoriteResponse = new List<GetFavoriteByUserIDStoredProcedureResponse>
            {
                new GetFavoriteByUserIDStoredProcedureResponse
                {
                    Id = 1123,
                    url = "https://home",
                    title = "Home"
                }
            };
            User peeoUser = null!;

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.GetFavoriteByUserIDAsync(It.IsAny<int>()))
                            .ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>()))
                            .ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetFavoriteByUserID();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void PostAddFavoriteByUserIDEmptyOkResponse()
        {
            // Arrange
            var request = new PostAddFavoriteByUserIDRequest
            {
                title = "Title",
                url = string.Empty,
                userID = 1
            };
            int userID = 1;
            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "1"));

            var getFavoriteResponse = new List<PostAddFavoriteByUserIDStoredProcedureResponse> { };
            getFavoriteResponse.AddRange(A.CollectionOfDummy<PostAddFavoriteByUserIDStoredProcedureResponse>(8).AsEnumerable());
            var peeoUser = new User()
            {
                employeeId = "123",
                email = null,
                wmUserDetailId = userID,
                affiliateCode = "1000",
                affiliateName = null,
                isActive = true,
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();

            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.PostAddFavoriteByUserIDAsync(request)).ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(userID)).ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostAddFavoriteByUserID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Object>>(okResult.Value);
        }

        [Fact]
        public void PostAddFavoriteByUserIDResponseWhenDataDoesntExists()
        {
            // Arrange
            var request = new PostAddFavoriteByUserIDRequest
            {
                title = "Title",
                url = string.Empty,
                userID = 1
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();

            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.PostAddFavoriteByUserIDAsync(request)).ReturnsAsync(new List<PostAddFavoriteByUserIDStoredProcedureResponse>());
            
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostAddFavoriteByUserID(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]
        public void PostDeleteFavoriteByFavIDReturnsOkResponse()
        {
            // Arrange
           var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
        httpContext.Request.Headers.UserAgent = "Mock-Agent";

        var mockAccessor = new Mock<IHttpContextAccessor>();
        mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);

        

            var request = new PostDeleteFavoriteByFavIDRequest
            {
                ID = 1,
                userID = 321445
            };
            int userID = 12;
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };

            var getFavoriteResponse = new List<PostDeleteFavoriteByFavIDStoredProcedureResponse> { };
            getFavoriteResponse.AddRange(A.CollectionOfDummy<PostDeleteFavoriteByFavIDStoredProcedureResponse>(2).AsEnumerable());
            var peeoUser = new User()
            {
                employeeId = "123",
                email = null,
                wmUserDetailId = userID,
                affiliateCode = "1000",
                affiliateName = null,
                isActive = true,
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();

            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.PostDeleteFavoriteByFavIDAsync(request))
                            .ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(userID))
                            .ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostDeleteFavoriteByFavID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Object>>(okResult.Value);
        }

        [Fact]
        public void PostDeleteFavoriteByFavIDEmptyOKResponse()
        {
            // Arrange
            var request = new PostDeleteFavoriteByFavIDRequest();

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(cs => cs.PostDeleteFavoriteByFavIDAsync(request)).ReturnsAsync(new List<PostDeleteFavoriteByFavIDStoredProcedureResponse>());
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;
            
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);

            

            // Act
            var result = controller.PostDeleteFavoriteByFavID(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }


        [Fact]
        public void PostDeleteFavoriteByFavIDReturnsOk()
        {
            // Arrange
            var request = new PostDeleteFavoriteByFavIDRequest
            {
                ID = 1,
                userID = 321445
            };
            int userID = 12;
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };

            var getFavoriteResponse = new List<PostDeleteFavoriteByFavIDStoredProcedureResponse> { };
            getFavoriteResponse.AddRange(A.CollectionOfDummy<PostDeleteFavoriteByFavIDStoredProcedureResponse>(2).AsEnumerable());
            User peeoUser = new User();

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.PostDeleteFavoriteByFavIDAsync(request))
                            .ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(userID))
                            .ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            controller.ControllerContext.HttpContext = httpContext;
            
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);

            

            // Act
            var result = controller.PostDeleteFavoriteByFavID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Object>>(okResult.Value);
        }

        [Fact]
        public void PostDeleteFavoriteByFavIDReturnsOkUser()
        {
            // Arrange
            var request = new PostDeleteFavoriteByFavIDRequest
            {
                ID = 1,
                userID = 321445
            };
            int userID = 12;
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };

            var getFavoriteResponse = new List<PostDeleteFavoriteByFavIDStoredProcedureResponse> { };
            getFavoriteResponse.AddRange(A.CollectionOfDummy<PostDeleteFavoriteByFavIDStoredProcedureResponse>(2).AsEnumerable());
            User peeoUser = new User();

            var claimsIdentityMock = new Mock<ClaimsIdentity>();

            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            claimsIdentityMock.Setup(x => x.IsAuthenticated).Returns(true);
            favRepositoryMock.Setup(x => x.PostDeleteFavoriteByFavIDAsync(request))
                            .ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(userID))
                            .ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            winAuthServicesMock.Setup(x => x.GenerateToken(
                                                It.IsAny<User>(),
                                                It.IsAny<string>(),
                                                It.IsAny<string>(),
                                                It.IsAny<int>(),
                                                It.IsAny<GetDataForAuthenticationByUserIdStoredProcedureResponse>())).ReturnsAsync("some");

            controller.ControllerContext.HttpContext = httpContext;
            controller.ControllerContext.HttpContext.Request.Headers["Sec-Ch-Ua"] = "CHROME";
            controller.ControllerContext.HttpContext.Request.Headers.UserAgent = "User Agent";
            controller.ControllerContext.HttpContext.Request.Headers.AcceptLanguage = "en-US,en;q=0.9";
            controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(user);
            controller.ControllerContext.HttpContext.Connection.RemoteIpAddress = new IPAddress(16885952);
            controller.ControllerContext.HttpContext.Connection.LocalIpAddress = new IPAddress(16885952);
            
            httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.10.10.10");
            httpContext.Request.Headers.UserAgent = "Mock-Agent";

            var mockAccessor = new Mock<IHttpContextAccessor>();
            mockAccessor.Setup(x => x.HttpContext).Returns(httpContext);

            // Act
            var result = controller.PostDeleteFavoriteByFavID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Object>>(okResult.Value);
        }

        [Fact]
        public void PostAddFavoriteTrendByCaseIDOkResponse()
        {
            // Arrange
            int userID = 12;
            var request = new PostFavTrendByUserID
            {
                caseID = 1,
                eTime = DateTime.Now,
                sTime = DateTime.Now,
                title = "Title",
                url = string.Empty,
                //postFavTrendTagByCaseID = new List<PostFavTrendTagByCaseID>()
                TagDetails = new List<string>()
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));

            FavTrendRequest? getFavoriteResponse = new FavTrendRequest { FavTrendGUID = new Guid() };
            var peeoUser = new User()
            {
                employeeId = "123",
                email = null,
                wmUserDetailId = userID,
                affiliateCode = "1000",
                affiliateName = null,
                isActive = true,
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.PostAddFavoriteTrendByUserIDAsync(userID, request))
                            .ReturnsAsync(getFavoriteResponse);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(userID))
                            .ReturnsAsync(peeoUser);            

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostAddFavoriteTrendByUserID(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void PostAddFavoriteTrendByCaseIDDataDoesntExists()
        {
            // Arrange
            int userID = 1;
            var request = new PostFavTrendByUserID
            {
                caseID = 1,
                eTime = DateTime.Now,
                sTime = DateTime.Now,
                title = "Title",
                url = string.Empty,
                TagDetails = new List<string>()
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var mockFavoritesServices = new Mock<IFavoritesServices>();
            mockFavoritesServices.Setup(cs => cs.PostAddFavoriteTrendByUserIDAsync(userID, request))
                .ReturnsAsync(() => null!);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = controller.PostAddFavoriteTrendByUserID(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        [Fact]
        public void PostAddFavoriteTrendByCaseIDOkResponseNuLL()
        {
            // Arrange
            int userID = 12;
            var request = new PostFavTrendByUserID
            {
                caseID = 1,
                eTime = DateTime.Now,
                sTime = DateTime.Now,
                title = "Title",
                url = string.Empty,
                //postFavTrendTagByCaseID = new List<PostFavTrendTagByCaseID>()
                TagDetails = new List<string>()
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));

            FavTrendRequest? getFavoriteResponse = null;
            User peeoUser = null!;



            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            favRepositoryMock.Setup(x => x.PostAddFavoriteTrendByUserIDAsync(userID, request))
                            .ReturnsAsync(getFavoriteResponse!);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(userID))
                            .ReturnsAsync(peeoUser);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostAddFavoriteTrendByUserID(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetFavoriteTrendByCaseIDReturnsOkWithData()
        {
            // Arrange
            Guid caseID = new Guid();
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID,
            };

            var expectedResult = new PostFavTrendByUserID();

            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };

            //favRepositoryMock.Setup(x => x.GetFavoriteTrendByUserDAsync(It.IsAny<int>(), It.IsAny<Guid>()))
            //                    .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);

            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetFavoriteTrendByFavID(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetFavoriteTrendByCaseIDReturnsOkWithNoData()
        {
            // Arrange
            int userID = 1;
            Guid caseID = new Guid();
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID
            };

            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var mockFavoritesServices = new Mock<IFavoritesServices>();
            mockFavoritesServices.Setup(cs => cs.GetFavoriteTrendByFavIDAsync(userID, caseID))
                .ReturnsAsync(new PostFavTrendByUserID());
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = controller.GetFavoriteTrendByFavID(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        //12thmarch
        [Fact]
        public void GetAllFavoriteTrendByFavIDAsyncReturnsOkNULL()
        {
            // Arrange
            Guid caseID = new Guid();
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID,
            };


            var expectedResult = new PostFavTrendByUserID();

            User newUser = null!;

            //favoritesRepositoryMock.Setup(x => x.GetFavoriteTrendByUserDAsync(It.IsAny<int>(), It.IsAny<Guid>()))
            //                    .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);

            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetFavoriteTrendByFavID(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetAllFavoriteTrendByFavIDAsyncReturnsOkWithData()
        {
            // Arrange
            Guid caseID = new Guid();
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID,
                //FavTrendId = caseID
            };


            var expectedResult = new PostFavTrendByUserID();
            //{
            //    url = "https://home/",
            //    userID = 1,
            //    caseID = 1,
            //};

            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };

            //favoritesRepositoryMock.Setup(x => x.GetFavoriteTrendByUserDAsync(It.IsAny<int>(), It.IsAny<Guid>()))
            //                    .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetAllFavoriteTrendByFavIDAsync();

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void GetAllFavoriteTrendByFavIDAsyncReturnsOkWithNoData()
        {
            // Arrange
            int userID = 1;
            Guid caseID = new Guid();
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var mockFavoritesServices = new Mock<IFavoritesServices>();
            mockFavoritesServices.Setup(cs => cs.GetFavoriteTrendByFavIDAsync(userID, caseID))
                .ReturnsAsync(new PostFavTrendByUserID());
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = controller.GetAllFavoriteTrendByFavIDAsync();

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void PostDeleteFavoriteTrendByCaseIDReturnsOkWhenDataFound()
        {
            // Arrange
            var expectedResult = new FavTrendRequest();
            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };
            Guid caseID = new Guid();
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));

            favRepositoryMock.Setup(x => x.PostDeleteFavoriteTrendByUserIDAsync(It.IsAny<int>(), It.IsAny<Guid>()))
                            .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>()))
                            .ReturnsAsync(newUser);

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostDeleteFavoriteTrendByFavTrendID(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public void PostDeleteFavoriteTrendByCaseIDReturnsOkWhenNoDataFound()
        {
            // Arrange
            Guid caseID = new Guid();
            int userID = 1;
            var request = new FavTrendRequest()
            {
                FavTrendGUID = caseID
            };

            var claims = new List<Claim>();
            claims.Add(new Claim("uid", "12"));
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var mockFavoritesServices = new Mock<IFavoritesServices>();
            mockFavoritesServices.Setup(cs => cs.PostDeleteFavoriteTrendByFavIDAsync(userID, caseID)).ReturnsAsync(() => null!);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = controller.PostDeleteFavoriteTrendByFavTrendID(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #region PostUserPreferencesAsync
        [Fact]
        public void PostUserPreferencesAsyncAsyncReturnsOkWithData()
        {
            // Arrange

            var request = new
            {
                key = "UserDashboardSettings",
                parameter = "{\"token\":\"abc123xyz\",\"theme\":\"Dark\",\"layout\":\"Compact\"}"
            };
            var expectedResult = 5;

            var expectedResultuserpref = new List<GetUserPreferencesStoredProcedureResponse>
            {
                new GetUserPreferencesStoredProcedureResponse
                {
                    id = 1,
                    preferences = "{\"theme\":\"Dark\",\"layout\":\"Compact\"}"
                },
                new GetUserPreferencesStoredProcedureResponse
                {
                    id = 2,
                    preferences = "{\"notifications\":true,\"language\":\"en-US\"}"
                }
            };
            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };
            favRepositoryMock.Setup(x => x.GetUserPreferencesAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResultuserpref);
            favRepositoryMock.Setup(x => x.PostUserPreferencesAsync(It.IsAny<int>(),It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostUserPreferencesAsync(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void PostUserPreferencesAsyncAsyncReturnsOkWithNullData()
        {
            // Arrange

            var request = new
            {
                key = "UserDashboardSettings",
                parameter = "{\"token\":\"abc123xyz\",\"theme\":\"Dark\",\"layout\":\"Compact\"}"
            };
            int? expectedResult = null;

            var expectedResultuserpref = new List<GetUserPreferencesStoredProcedureResponse> { };
           
            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };
            favRepositoryMock.Setup(x => x.GetUserPreferencesAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResultuserpref);
            favRepositoryMock.Setup(x => x.PostUserPreferencesAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.PostUserPreferencesAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }
        #endregion

        #region GetUserPreferences
        [Fact]
        public void GetUserPreferencesAsyncReturnsOkWithData()
        {
            // Arrange
            
            var request = new GetUserPreferencesRequest
            {
                key = "ThemePreference",
                parameter = "DarkMode"
            };

            var expectedResult = new List<GetUserPreferencesStoredProcedureResponse>
            {
                new GetUserPreferencesStoredProcedureResponse
                {
                    id = 1,
                    preferences = "{\"theme\":\"Dark\",\"layout\":\"Compact\"}"
                },
                new GetUserPreferencesStoredProcedureResponse
                {
                    id = 2,
                    preferences = "{\"notifications\":true,\"language\":\"en-US\"}"
                }
            };

            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };

            favRepositoryMock.Setup(x => x.GetUserPreferencesAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetUserPreferences(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void GetUserPreferencesAsyncReturnsOkWhenNoDataExist()
        {
            // Arrange

            var request = new GetUserPreferencesRequest
            {
                key = "ThemePreference",
                parameter = "DarkMode"
            };

            var expectedResult = new List<GetUserPreferencesStoredProcedureResponse> { };
           
            User newUser = new User()
            {
                employeeId = "123",
                affiliateCode = "123",
                isActive = true,
                affiliateName = "General",
            };

            favRepositoryMock.Setup(x => x.GetUserPreferencesAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                                .ReturnsAsync(expectedResult);
            accountRepositoryMock.Setup(x => x.GetUserbyEmployeeIdAsync(It.IsAny<int>())).
                                 ReturnsAsync(newUser);
            var claims = new List<Claim>
            {
                new Claim("uid", "12")
            };
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;

            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.GetUserPreferences(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        #endregion

        #region DeleteUserPreferences
        [Fact]
        public void DeleteUserPreferencesAsyncReturnsOkWithTrueResponse()
        {
            // Arrange

            var request = new DeleteUserPreferenceRequest
            {
                ids = "10,11,12,13,14"
            };

            var expectedResult = true;
           

            favRepositoryMock.Setup(x => x.DeleteUserPreferencesAsync(It.IsAny<string>()))
                                .ReturnsAsync(expectedResult);
           

            // Act
            var result = controller.DeleteUserPreferences(request);

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }
        [Fact]
        public void DeleteUserPreferencesAsyncReturnsOkWithFalseResponse()
        {
            // Arrange

            var request = new DeleteUserPreferenceRequest
            {
                ids = "10,11,12,13,14"
            };

            var expectedResult = false;


            favRepositoryMock.Setup(x => x.DeleteUserPreferencesAsync(It.IsAny<string>()))
                                .ReturnsAsync(expectedResult);


            // Act
            var result = controller.DeleteUserPreferences(request);

            // Assert
            var badRequestResult = Assert.IsType<OkObjectResult>(result.Result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(204, response.statuscode);
            Assert.Equal("No data found", response.errormsg);
        }

        #endregion

        #region
        [Fact]
        public async Task GetFavoriteTrendByFavIDAsync_ReturnsOkWithData()
        {
            // Arrange
            int userID = 1;
            Guid favID = Guid.NewGuid();
            var user = new User { wmUserDetailId = userID, employeeId = "123", employeeName = "Test User" };

            accountRepositoryMock
                .Setup(repo => repo.GetUserbyEmployeeIdAsync(userID))
                .ReturnsAsync(user);

            var mockFavTrends = new List<dynamic>();

            dynamic trend1_tag1 = new ExpandoObject();
            trend1_tag1.Id = favID;
            trend1_tag1.url = "http://example.com/trend1";
            trend1_tag1.title = "Trend Title 1";
            trend1_tag1.sTime = DateTime.Parse("2023-01-01");
            trend1_tag1.eTime = DateTime.Parse("2023-01-31");
            trend1_tag1.caseID = 101;
            trend1_tag1.subTitle = "Subtitle 1";
            trend1_tag1.skipModel = true;
            trend1_tag1.chartType = "Line";
            trend1_tag1.xAxisTagDetail = "X-Axis Detail";
            trend1_tag1.isMonitoringXY = false;
            trend1_tag1.timeParameter = "D";
            trend1_tag1.tagDetails = "Tag1";
            mockFavTrends.Add(trend1_tag1);

            dynamic trend1_tag2 = new ExpandoObject();
            trend1_tag2.Id = favID;
            trend1_tag2.url = "http://example.com/trend1";
            trend1_tag2.title = "Trend Title 1";
            trend1_tag2.sTime = DateTime.Parse("2023-01-01");
            trend1_tag2.eTime = DateTime.Parse("2023-01-31");
            trend1_tag2.caseID = 101;
            trend1_tag2.subTitle = "Subtitle 1";
            trend1_tag2.skipModel = true;
            trend1_tag2.chartType = "Line";
            trend1_tag2.xAxisTagDetail = "X-Axis Detail";
            trend1_tag2.isMonitoringXY = false;
            trend1_tag2.timeParameter = "D";
            trend1_tag2.tagDetails = "Tag2";
            mockFavTrends.Add(trend1_tag2);

            dynamic trend2 = new ExpandoObject();
            trend2.Id = Guid.NewGuid();
            trend2.url = "http://example.com/trend2";
            trend2.title = "Trend Title 2";
            trend2.sTime = DateTime.Parse("2023-02-01");
            trend2.eTime = DateTime.Parse("2023-02-28");
            trend2.caseID = 102;
            trend2.subTitle = "Subtitle 2";
            trend2.skipModel = false;
            trend2.chartType = "Bar";
            trend2.xAxisTagDetail = "X-Axis Detail 2";
            trend2.isMonitoringXY = true;
            trend2.timeParameter = "W";
            trend2.tagDetails = "TagA";
            mockFavTrends.Add(trend2);

            favRepositoryMock
                .Setup(repo => repo.GetFavoriteTrendByUserDAsync(userID, favID))
                .ReturnsAsync(mockFavTrends.Where(x => x.Id == favID).ToList());

            // Act
            var result = await favServicesMock.GetFavoriteTrendByFavIDAsync(userID, favID);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(favID, result.ID);
        }

        [Fact]
        public async Task GetAllFavoriteTrendByFavIDAsync_UserFound_FavoritesExist_ReturnsPopulatedList()
        {
            // Arrange
            int userID = 1;
            var user = new User { wmUserDetailId = userID, employeeId = "123", employeeName = "Test User" };

            accountRepositoryMock
                .Setup(repo => repo.GetUserbyEmployeeIdAsync(userID))
                .ReturnsAsync(user);

            var mockAllFavTrends = new List<dynamic>();
            Guid favID1 = Guid.NewGuid();

            dynamic trend1_tag1 = new ExpandoObject();
            trend1_tag1.Id = favID1;
            trend1_tag1.url = "http://example.com/all_trend1";
            trend1_tag1.title = "All Trend Title 1";
            trend1_tag1.subTitle = "All Subtitle 1";
            trend1_tag1.sTime = DateTime.Parse("2024-01-01");
            trend1_tag1.eTime = DateTime.Parse("2024-01-31");
            trend1_tag1.caseID = 201;
            trend1_tag1.chartType = "Bar";
            trend1_tag1.xAxisTagDetail = "All X-Axis Detail 1";
            trend1_tag1.isMonitoringXY = true;
            trend1_tag1.timeParameter = "M";
            trend1_tag1.skipModel = false;
            trend1_tag1.tagDetails = "AllTagA";
            mockAllFavTrends.Add(trend1_tag1);

            dynamic trend1_tag2 = new ExpandoObject();
            trend1_tag2.Id = favID1;
            trend1_tag2.url = "http://example.com/all_trend1";
            trend1_tag2.title = "All Trend Title 1";
            trend1_tag2.subTitle = "All Subtitle 1";
            trend1_tag2.sTime = DateTime.Parse("2024-01-01");
            trend1_tag2.eTime = DateTime.Parse("2024-01-31");
            trend1_tag2.caseID = 201;
            trend1_tag2.chartType = "Bar";
            trend1_tag2.xAxisTagDetail = "All X-Axis Detail 1";
            trend1_tag2.isMonitoringXY = true;
            trend1_tag2.timeParameter = "M";
            trend1_tag2.skipModel = false;
            trend1_tag2.tagDetails = "AllTagB";
            mockAllFavTrends.Add(trend1_tag2);
            Guid favID2 = Guid.NewGuid();

            dynamic trend2_tag1 = new ExpandoObject();
            trend2_tag1.Id = favID2;
            trend2_tag1.url = "http://example.com/all_trend2";
            trend2_tag1.title = "All Trend Title 2";
            trend2_tag1.subTitle = "All Subtitle 2";
            trend2_tag1.sTime = DateTime.Parse("2024-02-01");
            trend2_tag1.eTime = DateTime.Parse("2024-02-29");
            trend2_tag1.caseID = 202;
            trend2_tag1.chartType = "Line";
            trend2_tag1.xAxisTagDetail = "All X-Axis Detail 2";
            trend2_tag1.isMonitoringXY = false;
            trend2_tag1.timeParameter = "W";
            trend2_tag1.skipModel = true;
            trend2_tag1.tagDetails = "AllTagX";
            mockAllFavTrends.Add(trend2_tag1);

            favRepositoryMock
                .Setup(repo => repo.GetAllFavoriteTrendByFavIDAsync(userID))
                .ReturnsAsync(mockAllFavTrends);

            // Act
            var result = await favServicesMock.GetAllFavoriteTrendByFavIDAsync(userID);

            // Assert
            Assert.NotNull(result);
        }
        #endregion
    }
}
