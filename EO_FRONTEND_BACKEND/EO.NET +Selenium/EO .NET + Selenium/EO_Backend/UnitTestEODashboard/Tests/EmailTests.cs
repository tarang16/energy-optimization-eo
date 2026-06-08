using Moq;
using Xunit;
using System.Dynamic;
using EODomain.Models.Email;
using EODomain.Models.Workflow;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using EOInfrastructure.Services;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;
using EOApplication.Contracts.Services;
using EOApplication.Contracts.Repositories;
using EOWebMicroservice.Controllers.v1;
using EODomain.Models.Account;
using Moq.Protected;
using Newtonsoft.Json;
using System.Net;
using System.Security.Claims;
using EODomain.Common;

namespace UnitTestEODashboard.Tests
{
    [ExcludeFromCodeCoverage]
    public class EmailTests
    {
        private readonly EmailServices emailService;
        private readonly Mock<IEmailRepository> emailRepositoryMock;
        private readonly EmailController controller;
        private readonly Mock<IOptions<EmailSettingsEntity>> emailSettings;
        private readonly Mock<IHttpClientFactory> httpClientFactoryMock;
        private readonly Mock<HttpClient> httpClientMock;
        private static readonly string[] roleParameters = new string[] { "role1" };

        public EmailTests()
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
            emailService = new EmailServices(emailRepositoryMock.Object, httpClientFactoryMock.Object, emailSettings.Object);
            controller = new EmailController(emailService);

        }


        [Fact]
        public void GetContributorOutputReturnsBadResults()
        {
            // Arrange
            var result1 = new SendEmailNotificationInput()
            {
                EmailSubject = "Test",
                CcEmail = "Test",
                EmailBody = "Test",
                FromEmail = "Test",
                ToEmail = "Test",
                ProjectCode = "Test"
            };


            emailRepositoryMock.Setup(r => r.GetEmailRepository(It.IsAny<string>())).ReturnsAsync(result1);

            // Act
            var result = controller.SendEmail();

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void GetContributorOutputReturnsBadResultNotNull()
        {
            // Arrange
            var result1 = new SendEmailNotificationInput()
            {
                EmailSubject = "Test",
                CcEmail = "Test",
                EmailBody = "Test",
                FromEmail = "Test",
                ToEmail = "Test",
                ProjectCode = "Test"
            };


            emailRepositoryMock.Setup(r => r.GetEmailRepository(It.IsAny<string>())).ReturnsAsync(result1);

            // Act
            var result = controller.SendEmail();

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetEmailByIDNull()
        {
            // Arrange
            var result1 = new SendEmailNotificationInput()
            {
                EmailSubject = "Test",
                CcEmail = "Test",
                EmailBody = "Test",
                FromEmail = "Test",
                ToEmail = "Test",
                ProjectCode = "Test"
            };

            emailRepositoryMock.Setup(r => r.GetEmailRepository(It.IsAny<string>())).ReturnsAsync(result1);

            // Act
            var result = controller.GetEmailByID(new GetEmailByIDRequest());

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void AddEmailList()
        {
            // Arrange

            UpdateEmailListRequest request = new UpdateEmailListRequest();
            UpdateEmailListResponse response = new UpdateEmailListResponse()
            {
                Result = "asd"
            };



            emailRepositoryMock.Setup(r => r.AddEmailListAsync(request)).ReturnsAsync(response);

            // Act
            var result = controller.AddEmailList(request);

            // Assert
            Assert.NotNull(result);
        }





        [Fact]
        public void GetEmailByID()
        {
            // Arrange

            GetEmailByIDRequest request = new GetEmailByIDRequest();
            SendEmailNotificationInput response = new SendEmailNotificationInput()
            {
            };


            emailRepositoryMock.Setup(r => r.GetEmailRepositoryAsync(request)).ReturnsAsync(response);


            // Act
            var result = controller.GetEmailByID(request);

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetEmailByIDNUllResponse()
        {
            // Arrange

            GetEmailByIDRequest request = new GetEmailByIDRequest();

            List<SendEmailNotificationInput> response = new List<SendEmailNotificationInput>();
            response.Add(new SendEmailNotificationInput());

            emailRepositoryMock.Setup(r => r.GetEmailRepositoryAsync(request)).ReturnsAsync(response[0]);

            // Act
            var result = controller.GetEmailByID(request);

            // Assert
            Assert.NotNull(result);
        }





        [Fact]
        public void GetAllEmailAsync()
        {
            // Arrange

            List<SendEmailNotificationInput> response = new List<SendEmailNotificationInput>();
            response.Add(new SendEmailNotificationInput());


            emailRepositoryMock.Setup(r => r.GetAllEmailRepositoryAsync()).ReturnsAsync(response);


            // Act
            var result = controller.GetAllEmailAsync();

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public void GetAllEmailAsyncUllResponse()
        {
            // Arrange

            List<SendEmailNotificationInput> response = new List<SendEmailNotificationInput>();

            emailRepositoryMock.Setup(r => r.GetAllEmailRepositoryAsync()).ReturnsAsync(response);

            // Act
            var result = controller.GetAllEmailAsync();

            // Assert
            Assert.NotNull(result);
        }


        [Fact]
        public void SendEmailOkResultWhenSuccessful()
        {
            // Arrange
            int userID = 123;
            SendEmailNotificationInput request = new SendEmailNotificationInput()
            {
                Id = 1,
                EmailSubject = "test",
                EmailBody = "test",
                ProjectCode = "001",
                CreatedBy = userID,
                UpdatedBy = userID,
                LastTriggeredTime = DateTime.Now.AddMinutes(-721),
                MinuteFrequency = 480
            };
            UpdateEmailListResponse response = new UpdateEmailListResponse()
            {
                Result = "asd"
            };
            dynamic dynamicObject = new ExpandoObject();
            var lstdynamicObject = new List<ExpandoObject>();
            // Add properties to the dynamic object
            dynamicObject.Name = "John";
            dynamicObject.Age = 30;
            dynamicObject.IsStudent = true;
            lstdynamicObject.Add(dynamicObject);

            var emailResponse = new EmailSentResponse
            {
                SendEmailNotificationOutput = new SendEmailNotificationOutput
                {
                    Status = "200",
                    StatusMessage = "email sent"
                }
            };

            emailRepositoryMock.Setup(r => r.AddEmailAsync(request, "")).ReturnsAsync(response);
            emailRepositoryMock.Setup(r => r.GetEmailRepository(It.IsAny<string>())).ReturnsAsync(request);
            emailRepositoryMock.Setup(r => r.GetFailureDataReport(It.IsAny<string>())).ReturnsAsync(lstdynamicObject);
            emailRepositoryMock.Setup(r => r.GetSlownessDataReport("")).ReturnsAsync(lstdynamicObject);

            // Act
            var result = controller.SendEmail();

            // Assert
            Assert.NotNull(result);
        }

        [Fact]
        public async Task SendEmailReturnsOkWhenEmailSent()
        {
            // Arrange

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = "/admin/activity";


            var mockEmailRepository = new Mock<IEmailRepository>();

            var mockInput = new SendEmailNotificationInput
            {
                EmailSubject = "Test Subject",
                EmailBody = "Test Body",
                FromEmail = "from@test.com",
                ToEmail = "to@test.com",
                CcEmail = "cc@test.com",
                LastTriggeredTime = System.DateTime.Now.AddMinutes(-30),
                MinuteFrequency = 15
            };
            mockEmailRepository.Setup(r => r.GetEmailRepository(It.IsAny<string>())).ReturnsAsync(mockInput);

            mockEmailRepository.Setup(r => r.AddEmailAsync(It.IsAny<SendEmailNotificationInput>(), It.IsAny<string>()))
                .ReturnsAsync(new UpdateEmailListResponse { Result = "Success" });

            var mockReport = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object> { { "Col1", "Val1" }, { "Col2", "Val2" } }
            };
            mockEmailRepository.Setup(r => r.GetSlownessDataReport(It.IsAny<string>())).ReturnsAsync(mockReport);
            mockEmailRepository.Setup(r => r.GetFailureDataReport(It.IsAny<string>())).ReturnsAsync(mockReport);

            var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            handlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = System.Net.HttpStatusCode.OK,
                    Content = new StringContent(JsonConvert.SerializeObject(new EmailSentResponse
                    {
                        SendEmailNotificationOutput = new SendEmailNotificationOutput
                        {
                            Status = "200",
                            StatusMessage = "success"
                        }
                    })),
                });

            var httpClient = new HttpClient(handlerMock.Object);

            var httpClientFactoryMock = new Mock<IHttpClientFactory>();
            httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var emailSettingsEntity = new EmailSettingsEntity
            {
                UserName = "UserName",
                Link = "https://example.com/sendEmailNotification",
                BaseURL = "https://example.com",
                ProjectCode = "001"
            };
            var emailSettingsMock = new Mock<IOptions<EmailSettingsEntity>>();
            emailSettingsMock.Setup(es => es.Value).Returns(emailSettingsEntity);

            var emailService = new EmailServices(
                mockEmailRepository.Object,
                httpClientFactoryMock.Object,
                emailSettingsMock.Object);


            var controller = new EmailController(emailService);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = await controller.SendEmail();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void SendEmailReturnsBadRequestWhenEmailNotSent()
        {
            // Arrange
            var mockEmailServices = new Mock<IEmailServices>();
            var controller = new EmailController(mockEmailServices.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = new PathString("//test.com");
            controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = controller.SendEmail();

            // Assert
            Assert.IsType<OkObjectResult>(result.Result);
        }

        

        #region SendAdminActivityEmail
        [Fact]
        public async Task SendAdminActivityEmailWhenResultFound()
        {
            // Arrange
            var emailRepositoryMock = new Mock<IEmailRepository>();

            var user = new User
            {
                wmUserDetailId = 1,
                employeeId = "1",
                employeeName = "Test3",
                firstName = "Test4",
                lastName = "Test5",
                domainLoginId = "1",
                affiliateCode = "1001",
                affiliateName = "Test6",
                email = "test@gmail.com",
                country = "India",
                region = "Asia",
                isActive = true,
                createdDate = DateTime.UtcNow
            };

            var userClaimList = new List<GetUserIDByUserClaimID>
            {
                new GetUserIDByUserClaimID
                {
                    userID = 1,
                    claimType = "Test7",
                    affiliate = "Test8",
                    plant = "Test9"
                }
            };

            // Mocks
            emailRepositoryMock.Setup(x => x.GetEnvironmentName()).Returns("Test email");
            emailRepositoryMock.Setup(r => r.GetEmployeeIDByUserClaimID(It.IsAny<string>())).ReturnsAsync(userClaimList);
            emailRepositoryMock.Setup(r => r.GetUserByEmployeeID(It.IsAny<int>())).ReturnsAsync(user);

            var emailSettings = Options.Create(new EmailSettingsEntity
            {
                BaseURL = "http://test",
                Link = "/sendEmailNotification",
                UserName = "test1"
            });

            var httpMessageHandlerMock = new Mock<HttpMessageHandler>();
            httpMessageHandlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(JsonConvert.SerializeObject(new EmailSentResponse
                    {
                        SendEmailNotificationOutput = new SendEmailNotificationOutput
                        {
                            Status = "200",
                            StatusMessage = "email sent"
                        }
                    }))
                });

            var httpClient = new HttpClient(httpMessageHandlerMock.Object)
            {
                BaseAddress = new Uri("http://test")
            };

            var httpClientFactoryMock = new Mock<IHttpClientFactory>();
            httpClientFactoryMock.Setup(factory => factory.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var emailService = new EmailServices(emailRepositoryMock.Object, httpClientFactoryMock.Object, emailSettings);
            var controller = new EmailController(emailService);

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = "/admin/activity";

            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("createdBy", "1"),
                new Claim("targetedUser", "1"),
                new Claim("type", "info"),
                new Claim("taskPerformed", "Updated"),
                new Claim("isClaim", "false")
            }));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = await controller.SendAdminActivityEmail();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task SendAdminActivityEmail_WhenServiceReturnsNull_ReturnsBadRequest()
        {
            // Arrange
            var emailServiceMock = new Mock<IEmailServices>();

            emailServiceMock
                .Setup(s => s.SendAdminActivityEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string[]>(),
                    It.IsAny<bool>()))
                .ReturnsAsync((EmailSentResponse?)null!);

            var controller = new EmailController(emailServiceMock.Object);

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Path = "/admin/activity";

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            // Act
            var result = await controller.SendAdminActivityEmail();

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
        }
        #endregion

        [Fact]
        public async Task NotifyAdminsIfEnabled_WithClaimType_SendsClaimChangeEmail()
        {
            // Arrange
            var modifiedBy = new User { employeeName = "Admin", email = "admin@example.com" };

            emailRepositoryMock.Setup(r => r.GetGlobalSetting("vcclaims"))
                .ReturnsAsync(new GetGlobalSetting { parameter = "Yes" });

            emailRepositoryMock.Setup(r => r.GetUsersByRoleAsync("admin"))
                .ReturnsAsync(new List<GetUsersByRoleStoredProcedureResponse>
                {
                    new GetUsersByRoleStoredProcedureResponse { employeeName = "Admin User", email = "admin@example.com" }
                });

            emailRepositoryMock.Setup(r => r.GetUserDetailsAsync("1"))
                .ReturnsAsync(new List<GetUsersByRoleStoredProcedureResponse>
                {
                    new GetUsersByRoleStoredProcedureResponse { employeeName = "Test User", email = "test@example.com" }
                });

            emailRepositoryMock.Setup(r => r.GetEmailHtmlBodyForUserAccessChangeEmail(It.IsAny<string>()))
                .ReturnsAsync(new List<GetEmailHtmlBodyForUserAccessChangeEmailData>
                {
                    new GetEmailHtmlBodyForUserAccessChangeEmailData { section = "header", html = "<div>HEADER</div>" },
                    new GetEmailHtmlBodyForUserAccessChangeEmailData { section = "dynamicdata", html = "<div>@feature @actionType @affilite @user @modifiedBy @timeStamp</div>" },
                    new GetEmailHtmlBodyForUserAccessChangeEmailData { section = "footer", html = "<div>FOOTER</div>" },
                });

            var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK));

            var httpClient = new HttpClient(handlerMock.Object)
            {
                BaseAddress = new Uri("https://ss-jsd-wmdevdt:5106")
            };

            var httpClientField = typeof(EmailServices).GetField("_httpClient", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (httpClientField == null)
            {
                throw new Exception("Private field '_httpClient' not found in EmailServices");
            }
            httpClientField.SetValue(emailService, httpClient);

            var method = typeof(EmailServices).GetMethod("NotifyAdminsIfEnabled", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.NotNull(method);

            var task = method.Invoke(emailService, new object[]
            {
                "vc",
                "Added",
                new List<string> { "1" },
                Array.Empty<string>(),
                "Subject",
                "from@example.com",
                true,
                modifiedBy
            }) as Task;

            Assert.NotNull(task);
            await task!;

            handlerMock.Protected().Verify(
                "SendAsync",
                Times.Once(),
                ItExpr.Is<HttpRequestMessage>(req => req.Method == HttpMethod.Post),
                ItExpr.IsAny<CancellationToken>());
        }

        [Fact]
        public async Task NotifyAdminsIfEnabled_WithRoleType_SendsRoleChangeEmail()
        {
            // Arrange
            var modifiedBy = new User { employeeName = "Admin", email = "admin@example.com" };

            emailRepositoryMock.Setup(r => r.GetGlobalSetting("vcrole"))
                .ReturnsAsync(new GetGlobalSetting { parameter = "Yes" });

            emailRepositoryMock.Setup(r => r.GetUsersByRoleAsync("admin"))
                .ReturnsAsync(new List<GetUsersByRoleStoredProcedureResponse>
                {
                    new GetUsersByRoleStoredProcedureResponse { employeeName = "Admin User", email = "admin@example.com" }
                });

            emailRepositoryMock.Setup(r => r.GetUserDetailsAsync("1"))
                .ReturnsAsync(new List<GetUsersByRoleStoredProcedureResponse>
                {
                    new GetUsersByRoleStoredProcedureResponse { employeeName = "Test User", email = "test@example.com" }
                });

            emailRepositoryMock.Setup(r => r.GetEmailHtmlBodyForUserAccessChangeEmail(It.IsAny<string>()))
                .ReturnsAsync(new List<GetEmailHtmlBodyForUserAccessChangeEmailData>
                {
                    new GetEmailHtmlBodyForUserAccessChangeEmailData { section = "header", html = "<div>ROLE HEADER</div>" },
                    new GetEmailHtmlBodyForUserAccessChangeEmailData { section = "dynamicdata", html = "<div>@role @actionType @user @modifiedBy @timeStamp</div>" },
                    new GetEmailHtmlBodyForUserAccessChangeEmailData { section = "footer", html = "<div>ROLE FOOTER</div>" },
                });

            var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK));

            var httpClient = new HttpClient(handlerMock.Object)
            {
                BaseAddress = new Uri("https://ss-jsd-wmdevdt:5106")
            };

            var httpClientField = typeof(EmailServices).GetField("_httpClient",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (httpClientField == null)
                throw new Exception("Private field '_httpClient' not found in EmailServices");
            httpClientField.SetValue(emailService, httpClient);

            var method = typeof(EmailServices).GetMethod("NotifyAdminsIfEnabled",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.NotNull(method);

            var task = method.Invoke(emailService, new object[]
            {
                "vc",
                "Updated",
                new List<string> { "1" },
                roleParameters,
                "Role Subject",
                "from@example.com",
                false,
                modifiedBy
            }) as Task;

            Assert.NotNull(task);
            await task!;

            handlerMock.Protected().Verify(
                "SendAsync",
                Times.Once(),
                ItExpr.Is<HttpRequestMessage>(req => req.Method == HttpMethod.Post),
                ItExpr.IsAny<CancellationToken>());
        }

    }
}
