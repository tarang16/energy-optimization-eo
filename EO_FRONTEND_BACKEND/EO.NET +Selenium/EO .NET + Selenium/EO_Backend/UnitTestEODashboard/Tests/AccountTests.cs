using EOApplication.Contracts.Repositories;
using EOApplication.Contracts.Services;
using EODomain.Common;
using EODomain.Models.Account;
using EODomain.Models.Account.Workflow;
using System.Collections.Generic;
using System.Threading.Tasks;
using EODomain.Models.Email;
using EODomain.Models.Requests;
using EODomain.Models.ValidationModels;
using EOInfrastructure.Services;
using EOWebMicroservice.Controllers.v1;
using FakeItEasy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Security.Claims;
using Xunit;
using EOInfrastructure.Repositories;



namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class AccountTests
    {
        private readonly Mock<IAccountRepository> accountRepositoryMock;
        private readonly Mock<IWinAuthServices> winAuthServices;
        private readonly Mock<IEmailServices> emailServices;
        private readonly AccountServices accountServicesMock;
        private readonly Mock<HttpContext> httpContext;
        private readonly AccountController controller;
        private readonly Mock<IAccountServices> accountServiceMock;
        public AccountTests()
        {
            accountServiceMock = new Mock<IAccountServices>();
            accountRepositoryMock = new Mock<IAccountRepository>();
            winAuthServices = new Mock<IWinAuthServices>();
            emailServices = new Mock<IEmailServices>();
            httpContext = new Mock<HttpContext>();
            accountServicesMock = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            controller = new AccountController(accountServicesMock, emailServices.Object);
        }



        public static IEnumerable<object[]> GetUsersByRoleTestData()
        {
            //right input request
            var ValidRequest = new GetUserByRoleRequest { role = "corporate" };

            //wrong input request
            var InvalidRequest = new GetUserByRoleRequest { role = "corpo" };


            //reponse
            var Response = new List<GetUsersByRoleStoredProcedureResponse>
            {
                new GetUsersByRoleStoredProcedureResponse
                {
                    employeeId=1,
                    firstName="tester",
                    lastName="quality",
                    employeeName="tester,quality",
                    affiliateName="Aff.Name",
                    email="test@email.com"
                },
                new GetUsersByRoleStoredProcedureResponse
                {
                    employeeId=1,
                    firstName="tester2",
                    lastName="quality2",
                    employeeName="tester2,quality2",
                    affiliateName="Aff.Name2",
                    email="test2@email.com"
                },
            };


            return new List<object[]>
            {
                // Scenario 1: Role is invalid
                new object[]
                {
                    InvalidRequest, // this is mentioned in GetUsersByRoleTestData above 
                    "ValidRole", // => this is not matching the InvalidRequest
                    new List<GetUsersByRoleStoredProcedureResponse>(),// As a response we get empty or null in the list 
                    new BadRequestObjectResult // the main response 
                    (
                        new Response<Array> // part of the main response
                        (
                            ResponseConstants.CUSTOMERROR,
                            "Invalid role",
                            ResponseConstants.EMPTYDATA
                        )
                    )
                },
                
                // Scenario 2: Empty Data wala scene
                new object[]
                {
                    ValidRequest, // this is mentioned in GetUsersByRoleTestData above 
                    "corporate", // Input role matches requested role
                    new List<GetUsersByRoleStoredProcedureResponse>(), // No users
                    new OkObjectResult // this is same like Line 50 in accountController
                    (new Response<Array>(ResponseConstants.EMPTYOK,ResponseConstants.EMPTYOK_MESSAGE,ResponseConstants.EMPTYDATA))
                },
                
                
                // Scenario 3: data found and result OK
                new object[]
                {
                    ValidRequest,// this is mentioned in GetUsersByRoleTestData above 
                    "corporate", // Input role matches requested role
                    Response, // Data found
                    new OkObjectResult(new Response<object>(Response)) //this is same like line 54 
                }
            };
        }

        [Theory]
        [MemberData(nameof(GetUsersByRoleTestData))]
        public async Task GetUsersByRole_ShouldHandleVariousScenarios(
            GetUserByRoleRequest request,
            string inputRole,
            List<GetUsersByRoleStoredProcedureResponse> usersByRoleResult,
            IActionResult expectedResponse)
        {


            // Arrange
            accountRepositoryMock
                .Setup(s => s.GetValidRoleAsync(request.role!))
                .ReturnsAsync(inputRole);

            accountRepositoryMock
                .Setup(s => s.GetUsersByRoleAsync(inputRole))
                .ReturnsAsync(usersByRoleResult);

            // Act
            var result = await controller.GetUsersByRole(request);

            // Assert
            Assert.Equal(expectedResponse.GetType(), result.GetType());

            if (expectedResponse is ObjectResult expectedOkResult && result is ObjectResult actualOkResult)
            {
                var expectedResponseValue = expectedOkResult.Value as Response<object>;
                var actualResponseValue = actualOkResult.Value as Response<object>;

                Assert.Equal(expectedResponseValue?.statuscode, actualResponseValue?.statuscode);
                Assert.Equal(expectedResponseValue?.errormsg, actualResponseValue?.errormsg);
                Assert.Equal(expectedResponseValue?.data, actualResponseValue?.data);
            }
        }



        #region GetUsersByRole

        [Fact]
        public async Task GetUsersByRole_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var request = new GetUserByRoleRequest()
            {
                role = "validRole"
            };

            var dataGridList = new List<GetRoleDetailsStoredProcedureResponse> { };
            dataGridList.AddRange(A.CollectionOfDummy<GetRoleDetailsStoredProcedureResponse>(8).AsEnumerable());

            var dataGridList2 = new List<GetUsersByRoleStoredProcedureResponse> { };
            dataGridList2.AddRange(A.CollectionOfDummy<GetUsersByRoleStoredProcedureResponse>(8).AsEnumerable());


            accountRepositoryMock.Setup(r => r.GetValidRoleAsync(request.role)).ReturnsAsync(request.role);
            accountRepositoryMock.Setup(r => r.GetUsersByRoleAsync(It.IsAny<string>())).ReturnsAsync(dataGridList2);


            var claims = new List<Claim>
            {
                new Claim("uid", "123")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            
            httpContext.Setup(c => c.User).Returns(user);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };


            // Act
            var result = await controller.GetUsersByRole(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }
      
        #endregion


        #region LogoutUser

        [Fact]
        public void LogoutUserReturnsOkWhenUserLoggedOut()
        {
            // Arrange


            accountRepositoryMock.Setup(x => x.LogoutUserAsync(It.IsAny<int>()))
                                .ReturnsAsync(true);


            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti", "asfn131-121-asfas")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
           
            httpContext.Setup(c => c.User).Returns(user);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.LogoutUser();
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void LogoutUserReturnsBadRequestOnFalse()
        {
            // Arrange


            accountRepositoryMock.Setup(x => x.LogoutUserAsync(It.IsAny<int>()))
                                .ReturnsAsync(false);
            var claims = new List<Claim>
                            {
                                new Claim("uid", "123"),
                                new Claim("jti", "asfn131-121-asfas")
                            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            
            httpContext.Setup(c => c.User).Returns(user);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.LogoutUser();
            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public void LogoutUserReturnsBadRequestWhenJtiAndUidNotFound()
        {
            // Arrange


            accountRepositoryMock.Setup(x => x.LogoutUserAsync(It.IsAny<int>()))
                                .ReturnsAsync(false);

            var claims = new List<Claim>
                            {
                                new Claim("uid", "123"),
                            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
           
            httpContext.Setup(c => c.User).Returns(user);
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.LogoutUser();
            //Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }
        #endregion
        #region AddRoleToUsers

        [Fact]


        public async Task PostAddRoleToUsers_ValidRequest_ReturnsOk()

        {

            // Arrange

            var request = new PostAddRoleToUsersRequest

            {
                createdByUserID = 30787362,
                userIDList = "30787362,30787361,30787369",

                role = "admin"

            };


            AddUserToRoleValidationResponse obj = new AddUserToRoleValidationResponse

            {
                isValid = true,
                userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { employeeName = "Test", employeeId=30787362,firstName="Test1",lastName="Test2",email="XYZ@gmail.com",affiliateName="ARRAZI-3"} },
                message = "OK"
            };

            var PostAddRoleToUsersStoredProcedureResponse = new List<PostAddRoleToUsersStoredProcedureResponse>
            {

                new PostAddRoleToUsersStoredProcedureResponse
                {
                userID=30787369,
                roleID="admin"
                },
                 new PostAddRoleToUsersStoredProcedureResponse
                {
                  userID=30787361,
                  roleID="corporate"

                },


            };


            var userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { employeeName = "Test", employeeId=30787362,firstName="Test1",lastName="Test2",email="XYZ@gmail.com",affiliateName="ARRAZI-3"} };



            var GetValidationDataForAddRoleToUsersStoredProcedureResponse = new GetValidationDataForAddRoleToUsersStoredProcedureResponse
            {


               
                validRole = "admin",
                createdByCount = 1,
                usersCount = 3,
                users = userData
                
            };
            CommonMethod.IsValidIDType(request.userIDList).Equals(true);

            accountRepositoryMock.Setup(x => x.GetValidationDataForAddRoleToUsersAsync(request))
                .ReturnsAsync(GetValidationDataForAddRoleToUsersStoredProcedureResponse);

            accountServiceMock

                .Setup(service => service.ValidationsPostAddRoleToUsers(request))

                .ReturnsAsync(obj);

            accountServiceMock

                .Setup(service => service.GetUsersToAddAndExistingUsers(It.IsAny<List<GetUsersByRoleStoredProcedureResponse>>(), It.IsAny<string>()))

                .Returns(new List<string> { "user3,user4", "user1,user2" });

            accountRepositoryMock

                .Setup(service => service.PostAddRoleToUsersRequestAsync(It.IsAny<PostAddRoleToUsersRequest>()))

                .ReturnsAsync(PostAddRoleToUsersStoredProcedureResponse);

            // Act

            var result = await controller.PostAddRoleToUsers(request);

            // Assert

            var actionResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(actionResult.Value);

            Assert.Equal(200, response.statuscode);

        }


        [Fact]

        public async Task PostAddRoleToUsers_ValidRequest_ReturnsToken()

        {

            // Arrange

            var request = new PostAddRoleToUsersRequest

            {
                createdByUserID = 30787362,
                userIDList = "30787361,30787369",

                role = "admin"

            };


            AddUserToRoleValidationResponse obj = new AddUserToRoleValidationResponse

            {
                isValid = true,
                userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { employeeName = "Test", employeeId=30787362,firstName="Test1",lastName="Test2",email="XYZ@gmail.com",affiliateName="ARRAZI-3"} },
                message = "OK"
            };

            var PostAddRoleToUsersStoredProcedureResponse = new List<PostAddRoleToUsersStoredProcedureResponse>
            {

                new PostAddRoleToUsersStoredProcedureResponse
                {
                userID=30787369,
                roleID="admin"
                },
                 new PostAddRoleToUsersStoredProcedureResponse
                {
                  userID=30787361,
                  roleID="corporate"

                },


            };


            var userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { employeeName = "Test", employeeId=30787362,firstName="Test1",lastName="Test2",email="XYZ@gmail.com",affiliateName="ARRAZI-3"} };



            var GetValidationDataForAddRoleToUsersStoredProcedureResponse = new GetValidationDataForAddRoleToUsersStoredProcedureResponse
            {


               
                validRole = "admin",
                createdByCount = 1,
                usersCount = 2,
                users = userData
               
            };
            CommonMethod.IsValidIDType(request.userIDList).Equals(true);

            accountRepositoryMock.Setup(x => x.GetValidationDataForAddRoleToUsersAsync(request))
                .ReturnsAsync(GetValidationDataForAddRoleToUsersStoredProcedureResponse);

            accountServiceMock

                .Setup(service => service.ValidationsPostAddRoleToUsers(request))

                .ReturnsAsync(obj);

            accountServiceMock

                .Setup(service => service.GetUsersToAddAndExistingUsers(It.IsAny<List<GetUsersByRoleStoredProcedureResponse>>(), It.IsAny<string>()))

                .Returns(new List<string> { "user3,user4", "user1,user2" });

            accountRepositoryMock

                .Setup(service => service.PostAddRoleToUsersRequestAsync(It.IsAny<PostAddRoleToUsersRequest>()))

                .ReturnsAsync(PostAddRoleToUsersStoredProcedureResponse);


            var claims = new ClaimsIdentity(new[]

        {

            new Claim("uid", "12345"),

            new Claim("jti", "sessionGuid123")

        });

            var claimsPrincipal = new ClaimsPrincipal(claims);

            var mockHttpContext = new Mock<HttpContext>();

            var mockHttpRequest = new Mock<HttpRequest>();

            // Mock request headers

            mockHttpRequest.Setup(x => x.Headers["Sec-Ch-Ua"]).Returns("Chrome");

            mockHttpRequest.Setup(x => x.Headers.UserAgent).Returns("Mozilla/5.0");

            mockHttpRequest.Setup(x => x.Headers.AcceptLanguage).Returns("en-US,en;q=0.9");

            mockHttpContext.Setup(x => x.Connection.RemoteIpAddress).Returns(System.Net.IPAddress.Parse("192.168.1.1"));

            mockHttpContext.Setup(x => x.Connection.LocalIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));

            mockHttpContext.Setup(x => x.Request).Returns(mockHttpRequest.Object);

            mockHttpContext.Setup(x => x.User).Returns(claimsPrincipal);

            // Mock the methods that retrieve user data

            accountServiceMock.Setup(s => s.GetUserbyEmployeeIdAsync(It.IsAny<int>())).ReturnsAsync(new User()); // Adjust with actual return type

            accountServiceMock.Setup(s => s.GetDataForAuthenticationByUserIdAsync(It.IsAny<int>())).ReturnsAsync(new GetDataForAuthenticationByUserIdStoredProcedureResponse()); // Adjust with actual return type

            winAuthServices.Setup(s => s.CreateNewTokenGivenSessionGuid(It.IsAny<string>(), It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<GetDataForAuthenticationByUserIdStoredProcedureResponse>()))

                .ReturnsAsync("generated-token");
            // Mocking token creation
            accountServiceMock
             .Setup(s => s.GenerateNewTokenWhenAdminActionTakenAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<HttpContext>(), It.IsAny<HttpRequest>()))
             .ReturnsAsync("new-token");  // Mock token generation
            // Act
            controller.ControllerContext = new ControllerContext { HttpContext = mockHttpContext.Object };
            var result = await controller.PostAddRoleToUsers(request);

            // Assert

            var actionResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<TokenResponse<object>>(actionResult.Value);

            Assert.Equal(200, response.statuscode);

        }


        [Fact]

        public async Task PostAddRoleToUsers_InvalidRequest_ReturnsBadRequest()

        {

            // Arrange

            var request = new PostAddRoleToUsersRequest

            {
                createdByUserID = 1,
                userIDList = "",

                role = "admin"

            };

            AddUserToRoleValidationResponse obj = new AddUserToRoleValidationResponse

            {
                isValid = false,
                userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { } },
                message = "Validation failed"
            };




            accountServiceMock

                .Setup(service => service.ValidationsPostAddRoleToUsers(It.IsAny<PostAddRoleToUsersRequest>()))

                .ReturnsAsync(obj);

            // Act

            var result = await controller.PostAddRoleToUsers(request);

            // Assert

            var actionResult = Assert.IsType<BadRequestObjectResult>(result);

            var response = Assert.IsType<Response<Array>>(actionResult.Value);

            Assert.Equal(400, response.statuscode);

        }

        [Fact]
        public async Task GetUserAccessdataByEmployeeID_ReturnsEmptyOk_WhenNoDataFound()
        {
            // Arrange
            var employeeId = "12345";
            var request = new EmployeeIdAsStringRequest { employeeID = employeeId };

            var mockAccountService = new Mock<IAccountServices>();
            mockAccountService
                .Setup(s => s.GetUserAccessdataByEmployeeIDAsync(employeeId))
                .ReturnsAsync((GetUserAccessDetailsByEmployeeIDApiResponse)null!);

           
           
            

            // Act
            var result = await controller.GetUserAccessdataByEmployeeID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200,okResult.StatusCode);
            
        }

        [Fact]


        public async Task PostAddRoleToUsers_EmptyUsersToAdd_ReturnsBadRequest()

        {

            // Arrange

            var request = new PostAddRoleToUsersRequest

            {

                userIDList = "30787362",

                role = "admin"

            };

            AddUserToRoleValidationResponse obj = new AddUserToRoleValidationResponse

            {
                isValid = true,
                userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { employeeName = "Test", employeeId=30787362,firstName="Test1",lastName="Test2",email="XYZ@gmail.com",affiliateName="ARRAZI-3"} },
                message = "OK"
            };

            


            var userData = new List<GetUsersByRoleStoredProcedureResponse>
        { new GetUsersByRoleStoredProcedureResponse { employeeName = "Test", employeeId=30787362,firstName="Test1",lastName="Test2",email="XYZ@gmail.com",affiliateName="ARRAZI-3"} };



            var GetValidationDataForAddRoleToUsersStoredProcedureResponse = new GetValidationDataForAddRoleToUsersStoredProcedureResponse
            {


               
                validRole = "admin",
                createdByCount = 1,
                usersCount = 1,
                users = userData
                
            };

            accountServiceMock

                .Setup(service => service.ValidationsPostAddRoleToUsers(It.IsAny<PostAddRoleToUsersRequest>()))

                .ReturnsAsync(obj);

            accountRepositoryMock.Setup(x => x.GetValidationDataForAddRoleToUsersAsync(request))
                .ReturnsAsync(GetValidationDataForAddRoleToUsersStoredProcedureResponse);


            accountServiceMock

                .Setup(service => service.GetUsersToAddAndExistingUsers(It.IsAny<List<GetUsersByRoleStoredProcedureResponse>>(), It.IsAny<string>()))

                .Returns(new List<string> { "", "user1,user2" });

            // Act

            var result = await controller.PostAddRoleToUsers(request);

            // Assert

            var actionResult = Assert.IsType<BadRequestObjectResult>(result);

            var response = Assert.IsType<Response<Array>>(actionResult.Value);

            

            Assert.Equal(400, response.statuscode);

        }

        [Fact]
        public async Task PostAddRoleToUsers_ReturnsEmptyOk_WhenAddRoleToUsersResultIsNullOrEmpty()
        {
            // Arrange
            var request = new PostAddRoleToUsersRequest
            {
                role = "Admin",
                userIDList = "123,456",
                createdByUserID = 1
            };

            var validationResult = new AddUserToRoleValidationResponse
            {
                isValid = true,
                userData = new List<GetUsersByRoleStoredProcedureResponse>
                {
                    new GetUsersByRoleStoredProcedureResponse {
                        employeeId = 123,
                        employeeName = "John Doe",
                        firstName = "John",
                        lastName = "Doe",
                        email = "john.doe@example.com",
                        affiliateName = "AffiliateA"
                    }
                }
            };

            var mockAccountService = new Mock<IAccountServices>();
           
           
            

            mockAccountService
                .Setup(x => x.ValidationsPostAddRoleToUsers(It.IsAny<PostAddRoleToUsersRequest>()))
                .ReturnsAsync(validationResult);

            mockAccountService
                .Setup(x => x.GetUsersToAddAndExistingUsers(It.IsAny<List<GetUsersByRoleStoredProcedureResponse>>(), It.IsAny<string>()))
                .Returns(new List<string> { "123,456", "" });

            mockAccountService
                .Setup(x => x.PostAddRoleToUsersRequestAsync(It.IsAny<PostAddRoleToUsersRequest>()))
                .ReturnsAsync(new List<PostAddRoleToUsersStoredProcedureResponse>());

            

            // Act
            var result = await controller.PostAddRoleToUsers(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);

            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
        }

        #endregion
        #region

        [Fact]

        public async Task DeleteRoleForUserID_ReturnsBadRequest_WhenRoleIsInvalid()

        {

            // Arrange

            var request = new DeleteRoleForUserRequest { role = "invalidRole", userID = 1 };

            accountRepositoryMock.Setup(service => service.GetValidRoleAsync(request.role))
                  .ReturnsAsync("someOtherRole");  // Simulating an invalid role response

            // Act

            var result = await controller.DeleteRoleForUserID(request);

            // Assert

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);

            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);



        }

        [Fact]

        public async Task DeleteRoleForUserID_ReturnsBadRequest_WhenUserIDIsInvalid()

        {

            // Arrange

            var request = new DeleteRoleForUserRequest { role = "admin", userID = 999 }; // assuming 999 is invalid

            accountRepositoryMock

                .Setup(service => service.GetValidRoleAsync(request.role))

                .ReturnsAsync("admin");

            accountRepositoryMock

                .Setup(service => service.GetUserCountFromEmployeeListAsync(request.userID.ToString()))

                .ReturnsAsync(0);  // Simulating invalid user

            // Act

            var result = await controller.DeleteRoleForUserID(request);

            // Assert

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);

            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(ResponseConstants.CUSTOMERROR, response.statuscode);

            Assert.Equal("Invalid userID", response.errormsg);

        }

        [Fact]

        public async Task DeleteRoleForUserID_ReturnsOk_WhenRoleIsDeletedSuccessfully()

        {

            // Arrange

            var request = new DeleteRoleForUserRequest { role = "admin", userID = 1 };
            var DeleteRoletoUserStoredProcedureResponse = new List<DeleteRoletoUserStoredProcedureResponse> { new DeleteRoletoUserStoredProcedureResponse { roleID = "admin", isActive = 1 } };
            var EmailRsponse = new EmailSentResponse
            {
                SendEmailNotificationOutput = new SendEmailNotificationOutput
                { Status = "OK", StatusMessage = "OK" },
            };

            accountRepositoryMock
                            .Setup(service => service.GetValidRoleAsync(request.role))

                            .ReturnsAsync("admin");

            accountRepositoryMock


                .Setup(service => service.GetUserCountFromEmployeeListAsync(request.userID.ToString()))

                .ReturnsAsync(1);  // Simulating valid user

            // Simulate successful deletion
            var _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti","ABC")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var mockHttpContext = new Mock<HttpContext>();
            var mockRequest = new Mock<HttpRequest>();
            mockRequest.Setup(r => r.Headers["Sec-Ch-Ua"]).Returns("browserName");
            mockRequest.Setup(r => r.Headers.UserAgent).Returns("userAgent");
            mockRequest.Setup(r => r.Headers.AcceptLanguage).Returns("en-US,en;q=0.9");
            mockRequest.Setup(r => r.Path).Returns("/some/path");
            mockHttpContext.Setup(ctx => ctx.Request).Returns(mockRequest.Object);
            mockHttpContext.Setup(c => c.User).Returns(user);
            mockHttpContext.Setup(ctx => ctx.Connection.RemoteIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            mockHttpContext.Setup(ctx => ctx.Connection.LocalIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(mockHttpContext.Object);
            CommonMethod.GetEmployeeIdFromClaim(mockHttpContext.Object).Equals(true);

            // Mock the methods that fetch data from the database


            // Mock the CreateNewTokenGivenSessionGuid method
            winAuthServices.Setup(s => s.CreateNewTokenGivenSessionGuid(It.IsAny<string>(), It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<GetDataForAuthenticationByUserIdStoredProcedureResponse>()))
                .ReturnsAsync("new-token");

            var emailServiceMock = new Mock<IEmailServices>();

            emailServiceMock.Setup(service => service.SendAdminActivityEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string[]>(), false))

                .ReturnsAsync(EmailRsponse); // Simulate successful email sending

            accountServiceMock

                    .Setup(service => service.GenerateNewTokenWhenAdminActionTakenAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<HttpContext>(), It.IsAny<HttpRequest>()))

                    .ReturnsAsync("newToken");
            accountRepositoryMock

               .Setup(service => service.DeleteRoletoUserAsync(request))

               .ReturnsAsync(DeleteRoletoUserStoredProcedureResponse);
            // Act
            controller.ControllerContext = new ControllerContext { HttpContext = mockHttpContext.Object };
            var result = await controller.DeleteRoleForUserID(request);

            // Assert

            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<TokenResponse<object>>(okResult.Value);

            Assert.Equal("new-token", response.token);  // Ensure token is included

        }

        [Fact]
        public async Task DeleteRoleForUserID_ReturnsEmptyOk_WhenNoRoleDeleted()
        {
            // Arrange
            var request = new DeleteRoleForUserRequest
            {
                role = "admin",
                userID = 1
            };

            accountRepositoryMock
                .Setup(service => service.GetValidRoleAsync(request.role))
                .ReturnsAsync("admin");

            accountRepositoryMock
                .Setup(service => service.GetUserCountFromEmployeeListAsync(request.userID.ToString()))
                .ReturnsAsync(1);

            // Simulate no role deleted
            accountRepositoryMock
                .Setup(service => service.DeleteRoletoUserAsync(request))
                .ReturnsAsync(new List<DeleteRoletoUserStoredProcedureResponse>());

            // Mock claims and HttpContext
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
                new Claim("jti","ABC")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            var mockHttpContext = new Mock<HttpContext>();
            var mockRequest = new Mock<HttpRequest>();
            mockRequest.Setup(r => r.Path).Returns("/some/path");
            mockHttpContext.Setup(c => c.User).Returns(user);
            mockHttpContext.Setup(c => c.Request).Returns(mockRequest.Object);
            mockHttpContext.Setup(c => c.Connection.RemoteIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            mockHttpContext.Setup(c => c.Connection.LocalIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = mockHttpContext.Object
            };

            // Act
            var result = await controller.DeleteRoleForUserID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }


        #endregion
        #region add_custom_user
        [Fact]

        public async Task AddUserToCustomUserTable_ReturnsOkResult_WhenServiceCallIsSuccessful()

        {

            // Arrange

            var request = new AddUserToCustomUserTableRequest

            {

                // Initialize your request object properties here

            };
            List<dynamic> nullObj = new List<dynamic>() { };
            var expectedResultEmp = nullObj;

            var expectedResultRole = nullObj;

           
            accountRepositoryMock.Setup(service => service.GetUserAccessDataAsync(It.IsAny<string>())).ReturnsAsync(expectedResultEmp);
            accountRepositoryMock.Setup(service => service.GetUserFeatureAccessDataAsync(It.IsAny<string>())).ReturnsAsync(expectedResultRole);

            var expectedResult = 1; // Replace with actual result type expected from _accountService.AddUserToCustomUserTableAsync

            // Mock the AddUserToCustomUserTableAsync method to return a successful result

            accountRepositoryMock

                .Setup(service => service.AddUserToCustomUserTableAsync(It.IsAny<AddUserToCustomUserTableRequest>()))

                .ReturnsAsync(expectedResult);

            // Act

            var result = await controller.AddUserToCustomUserTable(request);

            // Assert

            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(okResult.Value);

            Assert.Equal(expectedResult, response.data);


            // Verify that the service method was called exactly once

        }
        [Fact]
        public async Task GetUserAccessdataByEmployeeID_ReturnsOkWithData_WhenDataFound()
        {
            // Arrange
            var employeeId = "12345";
            var request = new EmployeeIdAsStringRequest { employeeID = employeeId };
            var mockData = new { UserName = "testuser", Role = "Admin" };

            accountRepositoryMock
                .Setup(service => service.GetUserAccessDataAsync(employeeId))
                .ReturnsAsync(mockData);

            // Act
            var result = await controller.GetUserAccessdataByEmployeeID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response);
        }

        [Fact]
        public async Task GetUserDetailsWithAffiliateClaim_ReturnsEmptyOk_WhenNoDataFound()
        {
            // Arrange
            var request = new AffiliateIdListClaimTypeRequest();

            dynamic fakeResult = new System.Dynamic.ExpandoObject();
            fakeResult.Count = null;

            var mockAccountService = new Mock<IAccountServices>();
            mockAccountService
                .Setup(service => service.GetUserDetailsWithAffiliateClaimAsync(It.IsAny<AffiliateIdListClaimTypeRequest>()))
                .ReturnsAsync((object)fakeResult);
            
                 accountRepositoryMock
                .Setup(service => service.GetUserDetailsWithAffiliateClaimAsync(It.IsAny<AffiliateIdListClaimTypeRequest>()))
                .ReturnsAsync(null);





            // Act
            var result = await controller.GetUserDetailsWithAffiliateClaim(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]


        public async Task AddUserToCustomUserTable_ReturnsBadRequest_WhenServiceCallFails()
        {
            // Arrange
            var request = new AddUserToCustomUserTableRequest
            {
                employeeID = 30787363
            };

            var mockRoles = new List<dynamic> { new { Role = "Admin" } };
            var mockFeatures = new List<dynamic>();

            accountRepositoryMock
                .Setup(x => x.GetUserAccessDataAsync(It.IsAny<string>()))
                .ReturnsAsync(mockRoles);

            accountRepositoryMock
                .Setup(x => x.GetUserFeatureAccessDataAsync(It.IsAny<string>()))
                .ReturnsAsync(mockFeatures);

          
            

            // Act
            var result = await controller.AddUserToCustomUserTable(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }


        [Fact]
        public async Task GetUserDetailsWithAffiliateClaim_ReturnsOkWithData_WhenDataFound()
        {
            // Arrange
            var affiliateIdListClaim = new AffiliateIdListClaimTypeRequest
            {
                claimType = "user",
                affiliateIDList = "1,2,3"
            };

            var mockData = new List<object>
{
    new { UserName = "testuser", AffiliateRole = "AffiliateAdmin" }
};

            accountRepositoryMock
                .Setup(service => service.GetUserDetailsWithAffiliateClaimAsync(affiliateIdListClaim))
                .ReturnsAsync(mockData);

            // Act
            var result = await controller.GetUserDetailsWithAffiliateClaim(affiliateIdListClaim);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response);
        }

        [Fact]
        public async Task DeleteClaimsFromUser_ReturnsBadRequest_WhenClaimIDListIsEmpty()
        {
            // Arrange
            var request = new DeleteClaimFromUserRequest
            {
                claimIDList = " ",
                updatedByUserID = 1
            };

            var claims = new List<Claim>
    {
        new Claim("uid", "123")
    };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            httpContext.Setup(c => c.User).Returns(user);
            httpContext.Setup(c => c.Request.Path).Returns(new PathString("/test"));
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };
            accountRepositoryMock
               .Setup(service => service.GetUserbyEmployeeIdAsync(It.IsAny<int>()));
            // Act
            var result = await controller.DeleteClaimsFromUser(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<EODomain.Common.Response<Array>>(badRequestResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task DeleteClaimsFromUser_ReturnsOkResult_WhenDeleteClaimsFails()
        {
            // Arrange
            var request = new DeleteClaimFromUserRequest

            {
                claimIDList = "123,456,789"
            };
            var claims = new List<Claim>
    {
        new Claim("uid", "123"),
        new Claim("jti","123")

    };
            var context = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(context);
            ////var httpContext = new Mock<HttpContext>();
            var _httpContext = new DefaultHttpContext();
            _httpContext.User = user;
            _httpContext.Request.Path = "/test";
           
            controller.ControllerContext.HttpContext = _httpContext;
            controller.ControllerContext.HttpContext.Request.Headers["Sec-Ch-Ua"] = "CHROME";
            controller.ControllerContext.HttpContext.Request.Headers.UserAgent = "User Agent";
            controller.ControllerContext.HttpContext.Request.Headers.AcceptLanguage = "en-US,en;q=0.9";
            controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(user);
            controller.ControllerContext.HttpContext.Connection.RemoteIpAddress = new IPAddress(16885952);
            controller.ControllerContext.HttpContext.Connection.LocalIpAddress = new IPAddress(16885952);

            
            accountRepositoryMock
                .Setup(service => service.GetUserbyEmployeeIdAsync(It.IsAny<int>()));

            // Act
            var result = await controller.DeleteClaimsFromUser(request);

            // Assert
            var okObjectResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okObjectResult.StatusCode); 
        }

        [Fact]
        public void AddClaimstoUserReturnsOkWhenDataFound()
        {
            // Arrange
            var claim = new Dictionary<string, string> { { "ccp", "1" } };
            var request = new AddClaimToUserRequest
            {
                Claims = claim,
                UserId = "1"
            };

            var claims = new List<Claim> { new Claim("uid",request.UserId),new Claim("jti",request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var userPrincipal = new ClaimsPrincipal(identity);

            var peuser = new User { employeeId = "12" };
            var expectedClaimResult = new List<ClaimDto>
            {
                new ClaimDto { claimId = 1, claimType = "Role", claimValue = "Admin" }
            };

           
           
            
            var mockAccountServices = new Mock<IAccountServices>();

            // Mock repository methods
           accountRepositoryMock.Setup(s => s.GetUserbyEmployeeIdAsync(It.IsAny<int>()))
                                 .ReturnsAsync(peuser);
            accountRepositoryMock.Setup(s => s.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                                 .ReturnsAsync(expectedClaimResult);
            accountRepositoryMock.Setup(s => s.GetValidClaimTypes(It.IsAny<string>()))
                                 .ReturnsAsync(new List<string> { "ccp","plant" });

            // Mock the validation to return success
            mockAccountServices.Setup(s => s.AddClaimToUserRequestValidation(It.IsAny<AddClaimToUserRequest>(), It.IsAny<HttpContext>()))
                               .ReturnsAsync(new StatusMessageResponse
                               {
                                   isValid = true,
                                   message = string.Empty
                               });
            accountRepositoryMock.Setup(s => s.AddClaimsToUsersAsync(It.IsAny<DataTable>(), It.IsAny<int>()))
                                .ReturnsAsync(1);
            // Mock AddClaimsToUsersAsync to return 1 (indicating success)
            mockAccountServices.Setup(s => s.AddClaimsToUsersAsync(It.IsAny<AddClaimToUserRequest>(), It.IsAny<int>()))
                               .ReturnsAsync(1);

            // Mock GenerateNewTokenWhenAdminActionTakenAsync to return a mocked JWT token
            mockAccountServices.Setup(s => s.GenerateNewTokenWhenAdminActionTakenAsync(
                                                It.IsAny<ClaimsPrincipal>(),
                                                It.IsAny<HttpContext>(),
                                                It.IsAny<HttpRequest>()))
                               .ReturnsAsync("mocked-jwt-token");

           
            var httpRequest = new Mock<HttpRequest>();

            httpRequest.Setup(r => r.Path).Returns("/add_user_claim");
            httpContext.Setup(c => c.User).Returns(userPrincipal);
            httpRequest.Setup(x => x.Headers["Sec-Ch-Ua"]).Returns("Chrome");

            httpRequest.Setup(x => x.Headers.UserAgent).Returns("Mozilla/5.0");

            httpRequest.Setup(x => x.Headers.AcceptLanguage).Returns("en-US,en;q=0.9");

            httpContext.Setup(x => x.Connection.RemoteIpAddress).Returns(System.Net.IPAddress.Parse("192.168.1.1"));

            httpContext.Setup(x => x.Connection.LocalIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            httpContext.Setup(c => c.Request).Returns(httpRequest.Object);


          
            List<string> response = new List<string>();
            response.Add("ccp");
            
            
            
            
            accountRepositoryMock.Setup(c => c.GetValidClaimTypes(It.IsAny<string>())).ReturnsAsync(response);


            controller.ControllerContext = new ControllerContext
            {
                HttpContext =  httpContext.Object 
            };
            // Act
            var result = controller.AddClaimstoUser(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var tokenResponse = Assert.IsType<TokenResponse<object>>(okResult.Value);
            Assert.Equal(1, tokenResponse.data);
            
        }

        [Fact]
        public void AddClaimstoUserReturnsBadRequestWhenValidationFails()
        {
            // Arrange
            var request = new AddClaimToUserRequest
            {
                Claims = new Dictionary<string, string>(),
                UserId = "1"
            };

            var mockAccountServices = new Mock<IAccountServices>();
            
            

            mockAccountServices.Setup(s => s.AddClaimToUserRequestValidation(It.IsAny<AddClaimToUserRequest>(), It.IsAny<HttpContext>()))
                               .ReturnsAsync(new StatusMessageResponse
                               {
                                   isValid = false,
                                   message = "Validation failed"
                               });

           

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            // Act
            var result = controller.AddClaimstoUser(request).GetAwaiter().GetResult();

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public void AddClaimstoUserReturnsBadRequestWhenAddClaimsFails()
        {
            // Arrange
            var request = new AddClaimToUserRequest
            {
                Claims = new Dictionary<string, string> { { "ccp", "1" } },
                UserId = "1"
            };

           
            


            var mockAccountServices = new Mock<IAccountServices>();

            accountRepositoryMock.Setup(s => s.GetValidClaimTypes(It.IsAny<string>()))
                                .ReturnsAsync(new List<string> { "ccp", "plant" });
            accountRepositoryMock.Setup(s => s.AddClaimsToUsersAsync(It.IsAny<DataTable>(), It.IsAny<int>()))
                              .ReturnsAsync(0);

            mockAccountServices.Setup(s => s.AddClaimToUserRequestValidation(It.IsAny<AddClaimToUserRequest>(), It.IsAny<HttpContext>()))
                               .ReturnsAsync(new StatusMessageResponse
                               {
                                   isValid = true
                               });

            mockAccountServices.Setup(s => s.AddClaimsToUsersAsync(It.IsAny<AddClaimToUserRequest>(), It.IsAny<int>()))
                               .ReturnsAsync(0);

            var claims = new List<Claim> { new Claim("uid", request.UserId), new Claim("jti", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var userPrincipal = new ClaimsPrincipal(identity);

            var httpRequest = new Mock<HttpRequest>();

            httpRequest.Setup(r => r.Path).Returns("/add_user_claim");
            httpContext.Setup(c => c.User).Returns(userPrincipal);
            httpRequest.Setup(x => x.Headers["Sec-Ch-Ua"]).Returns("Chrome");

            httpRequest.Setup(x => x.Headers.UserAgent).Returns("Mozilla/5.0");

            httpRequest.Setup(x => x.Headers.AcceptLanguage).Returns("en-US,en;q=0.9");

            httpContext.Setup(x => x.Connection.RemoteIpAddress).Returns(System.Net.IPAddress.Parse("192.168.1.1"));

            httpContext.Setup(x => x.Connection.LocalIpAddress).Returns(System.Net.IPAddress.Parse("127.0.0.1"));
            httpContext.Setup(c => c.Request).Returns(httpRequest.Object);

            controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Act
            var result = controller.AddClaimstoUser(request).GetAwaiter().GetResult();

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }
        #endregion

        [Fact]
        public void GetClaimsbyUserIdAsync()
        {
            // Arrange
            
            List<ClaimDto> response = new List<ClaimDto>() { new ClaimDto() };

            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(x => x.GetClaimsbyUserIdAsync(It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(response);

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act
            var result = mockAccountServices.GetClaimsbyUserIdAsync(1, "");

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetTokenAuthorizationDataAsynctest()
        {
            // Arrange
            

            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(x => x.GetTokenAuthorizationDataAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<HttpContext>()))
                .ReturnsAsync(new GetTokenAuthorizationDataStoredProcedureResponse());

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act
            var result = mockAccountServices.GetTokenAuthorizationDataAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<HttpContext>());

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetValidClaimTypes_Test()
        {
            // Arrange
            var request = "";
            List<string> response = new List<string>();
            response.Add("test");
            var mockAccountRepository = new Mock<IAccountRepository>();
            
            
            
            mockAccountRepository.Setup(c => c.GetValidClaimTypes(It.IsAny<string>())).ReturnsAsync(response);
            var _mockAccountService = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act

            var result = _mockAccountService.GetValidClaimTypes(request);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void DeleteWorkflowUserAsync_ShouldReturnExpectedResult()
        {
            // Arrange
            var mockAccountRepository = new Mock<IAccountRepository>();
            var expectedResponse = new DeleteWorkflowUserStoredProcedureResponse
            {
                roleId = 1,
                isActive = 2
            };

            string userId = "user123";
            string role = "Admin";
            string updatedBy = "adminUser";

            mockAccountRepository.Setup(repo => repo.DeleteWorkflowUserAsync(userId, role, updatedBy))
                    .ReturnsAsync(expectedResponse);

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);


            // Act
            var result = mockAccountServices.DeleteWorkflowUserAsync(userId, role, updatedBy);

            // Assert
            Assert.NotNull(result);

        }

        [Fact]
        public void AddWorkflowUsersAsync_ShouldReturnExpectedIds()
        {
            // Arrange
            var mockAccountRepository = new Mock<IAccountRepository>();

            var expectedIds = new List<int> { 101, 102, 103 };

            mockAccountRepository.Setup(r => r.AddWorkflowUsersAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>()))
                    .ReturnsAsync(expectedIds);

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act
            var result = mockAccountServices.AddWorkflowUsersAsync("user1,user2,user3", "Admin", 123,"managerID", "creatorUser");

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetValidWorkflowRoles_ShouldReturnValidRoles()
        {
            // Arrange

            var mockAccountRepository = new Mock<IAccountRepository>();
            var expectedRoles = new List<GetRolesRoleIdByUserIdStoredProcResponse>
        {
            new GetRolesRoleIdByUserIdStoredProcResponse { roleId = "1", name = "Admin" }
        };

            mockAccountRepository.Setup(r => r.GetValidWorkflowRoles()).ReturnsAsync(expectedRoles);

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);
            
            // Act

            var result = mockAccountServices.GetValidWorkflowRoles();

            // Assert

            Assert.NotNull(result);
        }

        [Fact]
        public void GetWorkflowRequestRole_ShouldReturnMatchingRoleAsync()
        {
            // Arrange
            var request = new AddWorkflowUserRequest { role = "admin" };
            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);
            var expectedRole = new GetWorkFlowUserRolesStoredProcedureResponse { role = "Admin", roleId = 1, stageId = 2 };
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(s => s.GetWorkflowUserRoles())
                .ReturnsAsync(new List<GetWorkFlowUserRolesStoredProcedureResponse>
                {
                expectedRole,
                new GetWorkFlowUserRolesStoredProcedureResponse { role = "Manager", roleId = 2, stageId = 1 }
                });
            

            // Act
            var result = mockAccountServices.GetWorkflowRequestRole(request);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetWorkflowUsersByRoleAffiliatePlantAsync_ValidInputs_ReturnsExpectedUsers()
        {
            // Arrange
            var mockAccountRepository = new Mock<IAccountRepository>();
            var repo = new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
            {
                new GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse
                {   employeeID = "123",
                    employeeName = "john.doe" ,
                    role = "developer",
                    roleId = 1,
                    email = "abc.com",
                    managerEmail="",
                    managerName=""
                },
            };

            mockAccountRepository.Setup(r => r.GetWorkflowUsersByRoleAffiliatePlant(It.IsAny<string?>(), It.IsAny<int?>()))
                    .ReturnsAsync(repo);

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act
            var result = mockAccountServices.GetWorkflowUsersByRoleAffiliatePlantAsync("Admin", 1);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void AddClaimsToUsersAsync_ValidInput_CreatesClaimsAndReturnsResult()
        {
            // Arrange
            var mockRepo = new Mock<IAccountRepository>();
            var expectedResult = 1;

            mockRepo.Setup(r => r.AddClaimsToUsersAsync(It.IsAny<DataTable>(), It.IsAny<int>()))
                    .ReturnsAsync(expectedResult);

            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            var request = new AddClaimToUserRequest
            {
                UserId = "1,2",
                Claims = new Dictionary<string, string> { { "Role", "101,102" } }
            };

            // Act
            var result = mockAccountServices.AddClaimsToUsersAsync(request, createdBy: 10);

            // Assert
            Assert.NotNull (result);    
            
        }

        [Fact]
        public void GetCaseIDCountFromCaseIDListAsyncTest()
        {
            //Arrange

            
            var mockAccountRepository = new Mock<IAccountRepository>();
            mockAccountRepository.Setup(r => r.GetCaseIDCountFromCaseIDListAsync(It.IsAny<string>())).ReturnsAsync(3);
           
            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act
            var result = mockAccountServices.GetCaseIDCountFromCaseIDListAsync("role");

            // Assert
            Assert.Equal(0, result.Result);

        }

        [Fact]
        public void GetUserbyLoginIdAsync()
        {
            // Arrange
            
            
            var mockAccountServices = new AccountServices(accountRepositoryMock.Object, winAuthServices.Object);

            // Act
            var result = mockAccountServices.GetUserbyLoginIdAsync(It.IsAny<string>(), It.IsAny<string>());

            // Assert
            Assert.NotNull(result);
        }

        #region AddClaimToUserRequestValidation
        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claims_Null()
        {
            // Arrange
            var request = new AddClaimToUserRequest { UserId = "123", Claims = null };
            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claims_Empty()
        {
            // Arrange
            var request = new AddClaimToUserRequest { UserId = "123", Claims = new Dictionary<string, string>() };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claims_More_Than_One()
        {
            // Arrange
            var request = new AddClaimToUserRequest
            {
                UserId = "123",
                Claims = new Dictionary<string, string> { { "type1", "1" }, { "type2", "2" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claim_Key_Null_Or_Empty()
        {
            // Arrange
            var request = new AddClaimToUserRequest
            {
                UserId = "123",
                Claims = new Dictionary<string, string> { { "", "1" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400,response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claim_Value_Null_Or_Empty()
        {
            // Arrange
            var request = new AddClaimToUserRequest
            {
                UserId = "123",
                Claims = new Dictionary<string, string> { { "type", "" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claim_Type_Not_Valid()
        {
            // Arrange
            accountRepositoryMock.Setup(x => x.GetValidClaimTypes(It.IsAny<string>()))
                .ReturnsAsync(new List<string> { "role", "admin" });

            var request = new AddClaimToUserRequest
            {
                UserId = "123",
                Claims = new Dictionary<string, string> { { "invalidtype", "1" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_UserId_Invalid()
        {
            // Arrange
            accountRepositoryMock.Setup(x => x.GetValidClaimTypes(It.IsAny<string>()))
                .ReturnsAsync(new List<string> { "type" });

            var request = new AddClaimToUserRequest
            {
                UserId = "invalid_user_id",
                Claims = new Dictionary<string, string> { { "type", "1" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Fail_When_Claim_Value_Invalid()
        {
            // Arrange
            accountRepositoryMock.Setup(x => x.GetValidClaimTypes(It.IsAny<string>()))
                .ReturnsAsync(new List<string> { "type" });

            var request = new AddClaimToUserRequest
            {
                UserId = "1",
                Claims = new Dictionary<string, string> { { "type", "invalid_claim_value" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }

        [Fact]
        public async Task AddClaimstoUser_Should_Pass_When_All_Valid()
        {
            // Arrange
            accountRepositoryMock.Setup(x => x.GetValidClaimTypes(It.IsAny<string>()))
                .ReturnsAsync(new List<string> { "type" });

            var request = new AddClaimToUserRequest
            {
                UserId = "1",
                Claims = new Dictionary<string, string> { { "type", "1" } }
            };

            var claims = new List<Claim> { new Claim("uid", request.UserId) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            // Act
            var result = await controller.AddClaimstoUser(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }
        #endregion

        #region WorkflowUserAdditionValidation
        [Fact]
        public async Task WorkflowUserAdditionValidation_Should_Fail_When_UserId_Invalid()
        {
            var result = await accountServicesMock.WorkflowUserAdditionValidation("invalid", "anyrole", 1);

            // Assert
            Assert.False(result.isValid);
            Assert.Equal(ResponseConstants.INT_DATATYPE_VALIDATION_ERROR, result.message);
        }

        [Fact]
        public async Task WorkflowUserAdditionValidation_Should_Pass_For_MailingListEscalationRole()
        {
            accountRepositoryMock.Setup(r => r.GetValidWorkflowRoles())
                .ReturnsAsync(new List<GetRolesRoleIdByUserIdStoredProcResponse>
                {
                    new() { name = "Mailing List (Escalation)", roleId = "5" }
                });

            // Act
            var result = await accountServicesMock.WorkflowUserAdditionValidation("1", "Mailing List (Escalation)", 1);

            // Assert
            Assert.True(result.isValid);
            Assert.Null(result.message);
        }

        [Fact]
        public async Task WorkflowUserAdditionValidation_Should_Fail_For_ProcessManager_With_MultipleUsers()
        {
            accountRepositoryMock.Setup(r => r.GetValidWorkflowRoles())
                .ReturnsAsync(new List<GetRolesRoleIdByUserIdStoredProcResponse>
                {
                    new() { name = "Process Manager", roleId = "1" }
                });

            // Act
            var result = await accountServicesMock.WorkflowUserAdditionValidation("1,2", "Process Manager", 1);

            // Assert
            Assert.False(result.isValid);
            Assert.Equal($"{ResponseConstants.CAN_ADD_ONLY_ONE_USER_TO_ROLE}: Process Manager", result.message);
        }

        [Fact]
        public async Task WorkflowUserAdditionValidation_Should_Fail_When_Users_Already_Have_Roles()
        {
            accountRepositoryMock.Setup(r => r.GetValidWorkflowRoles())
                .ReturnsAsync(new List<GetRolesRoleIdByUserIdStoredProcResponse>
                {
                    new() { name = "Manager", roleId = "1" }
                });

            accountRepositoryMock.Setup(r => r.GetWorkflowUsersByRoleAffiliatePlant(null, 1))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
                {
                    new() { employeeID = "1", role = "Manager", roleId = 1 }
                });

            // Act
            var result = await accountServicesMock.WorkflowUserAdditionValidation("1", "Manager", 1);

            // Assert
            Assert.False(result.isValid);
            
        }

        [Fact]
        public async Task WorkflowUserAdditionValidation_Should_Pass_When_All_Valid()
        {
            accountRepositoryMock.Setup(r => r.GetValidWorkflowRoles())
                .ReturnsAsync(new List<GetRolesRoleIdByUserIdStoredProcResponse>
                {
                    new() { name = "Manager", roleId = "2" },
                    new() { name = "Sustainability", roleId = "3" }
                });

            accountRepositoryMock.Setup(r => r.GetWorkflowUsersByRoleAffiliatePlant(null, 1))
                .ReturnsAsync(new List<GetWorkFlowUsersByRolePlantAffiliateStoredProcedureResponse>
                {
                    new() { employeeID = "1", role = "Diffrentrole", roleId = 1 }
                }); // No conflicts

            // Act
            var result = await accountServicesMock.WorkflowUserAdditionValidation("1", "Sustainability", 1);

            // Assert
            Assert.True(result.isValid);
            Assert.NotNull(result.message);
        }
        #endregion

        #region GetWorkflowRequestRole
        [Fact]
        public async Task GetWorkflowRequestRole_Should_Return_CorrectRole_When_ValidRoleProvided()
        {
            // Arrange
            var roleList = new List<GetWorkFlowUserRolesStoredProcedureResponse>
            {
                new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 1, role = "Admin", stageId = 10 },
                new GetWorkFlowUserRolesStoredProcedureResponse { roleId = 2, role = "Process Manager", stageId = 20 }
            };

            accountRepositoryMock
                .Setup(repo => repo.GetWorkflowUserRoles())
                .ReturnsAsync(roleList);

            var request = new AddWorkflowUserRequest
            {
                role = "process manager",
                userIDList = "123",
                affiliateId = 1,
                createdBy = "456"
            };

            // Act
            var result = await accountServicesMock.GetWorkflowRequestRole(request);

            // Assert
            Assert.NotNull(result);
        }
        #endregion

        #region ValidationsPostAddRoleToUsers
        [Fact]
        public async Task PostAddRoleToUsers_Should_Fail_When_Validation_IsInvalid()
        {
            // Arrange
            var request = new PostAddRoleToUsersRequest
            {
                userIDList = "1,2,3",
                role = "Admin",
                createdByUserID = 10
            };

            accountServiceMock.Setup(s => s.ValidationsPostAddRoleToUsers(request))
                .ReturnsAsync(new AddUserToRoleValidationResponse
                {
                    isValid = false,
                    message = "Validation failed"
                });

            // Act
            var result = await controller.PostAddRoleToUsers(request);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequest.Value);
            Assert.Equal(400, response.statuscode);
        }
        #endregion
    }
}
