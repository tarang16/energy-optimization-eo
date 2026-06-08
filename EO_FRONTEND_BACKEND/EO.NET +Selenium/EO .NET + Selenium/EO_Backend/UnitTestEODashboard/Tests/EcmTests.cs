using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using EODomain.Models.ECM;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using EOWebMicroservice.Controllers.v1;
using EOApplication.Contracts.Services;
using EOApplication.Contracts.Repositories;
using Microsoft.Extensions.Configuration;
using EODomain.Models.Requests;
using Microsoft.AspNetCore.Http;
using System.Diagnostics.CodeAnalysis;
using EODomain.Common;
using EOInfrastructure.Services;
using System.Security.Claims;
using System.Net;
using Newtonsoft.Json;
using System.Text;
using Moq.Protected;

namespace UnitTestEODashboard.Tests
{
    public class EcmTests
    {
        private readonly EcmServices _ecmServicesMock;
        private readonly Mock<IEcmRepository> _ecmRepositoryMock;
        private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<EcmSettings> _ecmSettingsMock;
        private readonly Mock<HttpClient> _httpClientMock;
        private readonly EcmController _controller;
        private readonly Mock<IEcmServices> _mockEcmServices;


        public EcmTests()
        {
            _ecmRepositoryMock = new Mock<IEcmRepository>();
            _configurationMock = new Mock<IConfiguration>();
            _httpClientFactoryMock = new Mock<IHttpClientFactory>();
            _ecmServicesMock = new EcmServices(_httpClientFactoryMock.Object, _ecmRepositoryMock.Object, _configurationMock.Object);
            _httpClientMock = new Mock<HttpClient>();
            _ecmSettingsMock = new Mock<EcmSettings>();
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfUsername").Value);
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfPassword").Value);
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfApiBaseURL").Value).Returns("https://ecm.sabic.com/ecm/llisapi.dll/api/v1");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfApi").Value);
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfFolderId").Value);
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("Page").Value);
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("Limit").Value);

            _controller = new EcmController(_ecmServicesMock);
            _mockEcmServices = new Mock<IEcmServices>();
        }

        [Fact]
        public async Task GetEcmAuthTokenAsync_ShouldReturnOk_WhenTokenIsGenerated()
        {
            // Arrange
            var expectedToken = new GetEcmAuthTokenResponse { ticket = "authToken123" };

            // Mock configuration values
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfUsername").Value)
                              .Returns("testuser");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfPassword").Value)
                              .Returns("testpass");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfApiBaseURL").Value)
                              .Returns("https://fake.ecm.com/");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfApi").Value)
                              .Returns("login");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfFolderId").Value)
                              .Returns("folder123");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("Page").Value)
                              .Returns("1");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("Limit").Value)
                              .Returns("10");

            var httpMessageHandlerMock = new Mock<HttpMessageHandler>();
            httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(JsonConvert.SerializeObject(expectedToken), Encoding.UTF8, "application/json")
                });

            var httpClient = new HttpClient(httpMessageHandlerMock.Object)
            {
                BaseAddress = new Uri("https://fake.ecm.com/")
            };

            _httpClientFactoryMock.Setup(f => f.CreateClient("namedClient2")).Returns(httpClient);

            var realService = new EcmServices(_httpClientFactoryMock.Object, _ecmRepositoryMock.Object, _configurationMock.Object);
            var controller = new EcmController(realService);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            }));
            var httpContext = new DefaultHttpContext { User = user };
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await controller.GetEcmAuthTokenAsync();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            var actualToken = Assert.IsType<GetEcmAuthTokenResponse>(response.data);
            Assert.Equal(expectedToken.ticket, actualToken.ticket);
        }

        [Fact]
        public async Task GetEcmAuthTokenAsync_ShouldReturnBadRequest_WhenTokenGenerationFails()
        {
            // Arrange
            var expectedResult = new object();
            _httpClientFactoryMock.SetupAllProperties();
            _httpClientFactoryMock.Setup(factory => factory.CreateClient(It.IsAny<string>())).Returns(_httpClientMock.Object);
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfFolderId").Value);
           
            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();
            httpContext.User = user;
            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.GetEcmAuthTokenAsync();
            

            // Assert
            Assert.NotNull(result);
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(400, response.statuscode);
            Assert.Equal("failed to get ecm auth token!", response.errormsg);

        }

        [Fact]
        public async Task GetEcmFilesByNodeIdReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new NodeIdRequest
            {
                nodeId = 12345566
            };

            var expectedResult = new List<EcmFileInfo>
            {
                new EcmFileInfo
                {
                    Id = "1",
                    file_name = "Invoice_April2025.pdf",
                    file_type = "pdf",
                    file_size = "256 KB"
                },
                new EcmFileInfo
                {
                    Id = "2",
                    file_name = "EmployeeData.xlsx",
                    file_type = "xlsx",
                    file_size = "512 KB"
                },
                new EcmFileInfo
                {
                    Id = "3",
                    file_name = "Presentation.pptx",
                    file_type = "pptx",
                    file_size = "1.2 MB"
                }
            };
            var ecmServicesMock = new Mock<IEcmServices>();
            ecmServicesMock.Setup(x => x.GetEcmFilesByNodeIdAsyc(It.IsAny<string>())).ReturnsAsync(new Response<List<EcmFileInfo>>(expectedResult));
            EcmController controller = new EcmController(ecmServicesMock.Object);

            // Act
            var result = await controller.GetEcmFilesByNodeIdAsync(request);

            // Assert
            var okResult = result as OkObjectResult;
            Assert.NotNull(okResult);

        }

        [Fact]
        public async Task GetEcmFilesByNodeIdReturnsBadRequestWhenDataNotFound()
        {
            // Arrange
            var request = new NodeIdRequest
            {
                nodeId = 12345566
            };

            var ecmServicesMock = new Mock<IEcmServices>();
            ecmServicesMock.Setup(x => x.GetEcmFilesByNodeIdAsyc(It.IsAny<string>())).ReturnsAsync(new Response<List<EcmFileInfo>>());
            EcmController controller = new EcmController(ecmServicesMock.Object);

            // Act
            var result = await controller.GetEcmFilesByNodeIdAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);
            Assert.Equal(400, response.statuscode);
            Assert.Equal("NA", response.errormsg);

        }

        [Fact]
        public async Task GetEcmFilesByNodeId_ReturnsErrorResponse_WhenTokenFails()
        {
            // Arrange
            var nodeId = 12345678;
            var request = new NodeIdRequest { nodeId = nodeId };

            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfUsername").Value)
                              .Returns("user");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfPassword").Value)
                              .Returns("pass");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfApiBaseURL").Value)
                              .Returns("https://fake.ecm.com/");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfApi").Value)
                              .Returns("tokenapi");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("RfFolderId").Value)
                              .Returns("folder");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("Page").Value)
                              .Returns("1");
            _configurationMock.Setup(x => x.GetSection("EcmSettings").GetSection("RefDoc").GetSection("Limit").Value)
                              .Returns("20");

            var httpMessageHandlerMock = new Mock<HttpMessageHandler>();
            httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError,
                    Content = new StringContent("")
                });

            var httpClient = new HttpClient(httpMessageHandlerMock.Object)
            {
                BaseAddress = new Uri("https://fake.ecm.com/")
            };

            _httpClientFactoryMock.Setup(f => f.CreateClient("namedClient2")).Returns(httpClient);

            var ecmServices = new EcmServices(_httpClientFactoryMock.Object, _ecmRepositoryMock.Object, _configurationMock.Object);
            var controller = new EcmController(ecmServices);

            // Act
            var result = await controller.GetEcmFilesByNodeIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal("Server failed to communicate with ECM", response.errormsg);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task GetEcmNodeIdByCaseIdReturnsOkWhenDataFound()
        {
            // Arrange
            var request = new EcmCaseIdInputRequest
            {
                caseID = 12
            };
            _ecmRepositoryMock.Setup(r => r.GetEcmNodeIdByCaseId(request.caseID))
                              .ReturnsAsync(123);

            // Act
            var result = await _controller.GetEcmNodeIdByCaseId(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetEcmNodeIdByCaseIdReturnsBadRequestWhenNoDataFound()
        {
            // Arrange
            var request = new EcmCaseIdInputRequest
            {
                caseID = 12
            };

            // Act
            var result = await _controller.GetEcmNodeIdByCaseId(request);

            // Assert
            var emptyResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(emptyResult.Value);
            Assert.Equal("No nodeID found for the system", response.errormsg);
            Assert.Equal(204, response.statuscode);
        }

        [Fact]

        public async Task DownloadFromEcmAsync_ReturnsSuccess_WhenFileIsDownloaded()
        {
            // Arrange
            var request = new DownloadFromEcmRequest
            {
                server = "refdoc",
                fileId = "123"
            };


            var ecmSettings = new EcmSettings
            {
                Username = "user",
                ApiBaseURL = "https://fake-api.com",
                Api = "/api/auth",
                FolderId = "456"
            };

            var attachmentInfo = new GeEcmUploadInfoResponse
            {
                AttachmentName = "TestFile.txt"
            };

            var fileBytes = Encoding.UTF8.GetBytes("Sample file content");

            var httpResponseMessage = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(fileBytes)
            };
            httpResponseMessage.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
            {
                FileName = "DefaultFile.txt"
            };

            // 1. Mock ECM token response
            var tokenResponse = new GetEcmAuthTokenResponse { ticket = "fake-ticket" };
            var tokenHttpResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonConvert.SerializeObject(tokenResponse), Encoding.UTF8, "application/json")
            };
            var tokenHandler = new MockHttpMessageHandler(tokenHttpResponse);
            var tokenHttpClient = new HttpClient(tokenHandler) { BaseAddress = new Uri("https://fake-api.com") };

            // 2. Mock file download response
            var fileDownloadResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(fileBytes)
            };
            fileDownloadResponse.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
            {
                FileName = "DefaultFile.txt"
            };
            fileDownloadResponse.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

            var downloadHandler = new MockHttpMessageHandler(fileDownloadResponse);
            var downloadHttpClient = new HttpClient(downloadHandler) { BaseAddress = new Uri("https://fake-api.com") };

            // 3. Setup IHttpClientFactory to return tokenClient first, then downloadClient
            _httpClientFactoryMock.SetupSequence(f => f.CreateClient("namedClient2"))
                .Returns(tokenHttpClient)  // First call (token)
                .Returns(downloadHttpClient); // Second call (download)

            // For token
            // For upload

            // Mock GetGeneralEcmSettings (or replace with GetWorkflowEcmSettings based on test case)
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfUsername").Value).Returns("user");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfPassword").Value).Returns("pass");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfApiBaseURL").Value).Returns("https://fake-api.com");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfApi").Value).Returns("/api/auth");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfFolderId").Value).Returns("456");

            // Mock Token and Upload Info
            _ecmRepositoryMock.Setup(r => r.GeEcmUploadInfo(It.IsAny<int>())).ReturnsAsync(attachmentInfo);

            // Replace actual call with mock token fetch
            _ecmServicesMock.GetType().GetMethod("GetEcmTokenRequestAsyc", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.Invoke(_ecmServicesMock, new object[] { ecmSettings });

            // Act
            var result = await _controller.DownloadFromEcmAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(okResult.Value);

            Assert.Equal(200, response.statuscode);
        }


        [Fact]

        
        public async Task DownloadFromEcmAsync_ReturnsBadRequest_WhenFileDownloadResponseIsInvalid()
        {
            // Arrange
            var request = new DownloadFromEcmRequest
            {
                server = "refdoc",
                fileId = "123"
            };

            var errorMessage = "Bad request Invalid file";

            var ecmSettings = new EcmSettings
            {
                Username = "user",
                ApiBaseURL = "https://fake-api.com",
                Api = "/api/auth",
                FolderId = "456"
            };

            var attachmentInfo = new GeEcmUploadInfoResponse
            {
                AttachmentName = "TestFile.txt"
            };

            var tokenResponse = new GetEcmAuthTokenResponse { ticket = "fake-ticket" };

            var tokenHttpResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonConvert.SerializeObject(tokenResponse), Encoding.UTF8, "application/json")
            };

            var tokenHandler = new MockHttpMessageHandler(tokenHttpResponse);
            var tokenHttpClient = new HttpClient(tokenHandler)
            {
                BaseAddress = new Uri("https://fake-api.com")
            };

            var errorHttpResponse = new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(JsonConvert.SerializeObject(errorMessage), Encoding.UTF8, "application/json")
            };

            var errorHandler = new MockHttpMessageHandler(errorHttpResponse);
            var errorHttpClient = new HttpClient(errorHandler)
            {
                BaseAddress = new Uri("https://fake-api.com")
            };

            _httpClientFactoryMock.SetupSequence(f => f.CreateClient("namedClient2"))
                .Returns(tokenHttpClient)    // Token client
                .Returns(errorHttpClient);   // File download client

            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfUsername").Value).Returns("user");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfPassword").Value).Returns("pass");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfApiBaseURL").Value).Returns("https://fake-api.com");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfApi").Value).Returns("/api/auth");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfFolderId").Value).Returns("456");

            _ecmRepositoryMock.Setup(r => r.GeEcmUploadInfo(It.IsAny<int>()))
                .ReturnsAsync(attachmentInfo);

            // Act
            var result = await _controller.DownloadFromEcmAsync(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(badRequestResult.Value);

            Assert.Equal(400, response.statuscode);
           
        }




        [Fact]

        public async Task UploadToEcmAsync_ReturnsSuccess_WhenFileIsUploaded()
        {
            // Arrange
            //var userId = 123;
            var originalFileName = "example.txt";
            var attachmentInfo = new GeEcmUploadInfoResponse

            {

                AttachmentName = "TestFile.txt"

            };
            // Mock IFormFile
            var fileMock = new Mock<IFormFile>();
            var fileContent = "This is a test file";
            var fileBytes = Encoding.UTF8.GetBytes(fileContent);
            var stream = new MemoryStream(fileBytes);

            fileMock.Setup(f => f.FileName).Returns(originalFileName);
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                    .Returns<Stream, CancellationToken>((targetStream, _) =>
                    {
                        stream.CopyTo(targetStream);
                        return Task.CompletedTask;
                    });

            // ECM Settings
            var ecmSettings = new EcmSettings
            {
                Username = "user",
                Api = "/auth",
                ApiBaseURL = "https://fake-api.com",
                FolderId = "999"
            };

            var claims = new List<Claim> { new Claim("uid", "123") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };
            // Mock token request response
            var tokenResponse = new GetEcmAuthTokenResponse { ticket = "fake-ticket" };
           
           
              var tokenHttpResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonConvert.SerializeObject(tokenResponse), Encoding.UTF8, "application/json")
            };
            var tokenHandler1 = new MockHttpMessageHandler(tokenHttpResponse);
            var tokenHttpClient = new HttpClient(tokenHandler1) { BaseAddress = new Uri("https://fake-api.com") };
            var uploadresponse = new UploadToEcmResponse { Id = "1234" ,Message="file upload on ecm successfully"};


            var UploadFile = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonConvert.SerializeObject(uploadresponse), Encoding.UTF8, "application/json")
            };
            // 2. Mock file download response
            //var fileBytes = Encoding.UTF8.GetBytes("Sample file content");
          var uploadHanler = new MockHttpMessageHandler(UploadFile);
            var uploadHttpClient = new HttpClient(uploadHanler) { BaseAddress = new Uri("https://fake-api.com") };

           
            _httpClientFactoryMock.SetupSequence(f => f.CreateClient("namedClient2"))
                .Returns(tokenHttpClient)  // First call (token)
                .Returns(uploadHttpClient); // Second call (download)

            
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfUsername").Value).Returns("user");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfPassword").Value).Returns("pass");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfApiBaseURL").Value).Returns("https://fake-api.com");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfApi").Value).Returns("/api/auth");
            _configurationMock.Setup(c => c.GetSection("EcmSettings:RefDoc:RfFolderId").Value).Returns("456");

            // Mock Token and Upload Info
            _ecmRepositoryMock.Setup(r => r.GeEcmUploadInfo(It.IsAny<int>())).ReturnsAsync(attachmentInfo);

            // Replace actual call with mock token fetch
            _ecmServicesMock.GetType().GetMethod("GetEcmTokenRequestAsyc", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.Invoke(_ecmServicesMock, new object[] { ecmSettings });
            SetupConfigurationForEcmSettings(ecmSettings);
            // Act
            var result = await _controller.UploadToEcmAsync(fileMock.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            var response = Assert.IsType<Response<object>>(okResult.Value);

            Assert.Equal(200, response.statuscode);
        }

        [Fact]
        public async Task UploadToEcmAsync_ShouldReturnBadResult_WhenEcmUploadFails()
        {
            // Arrange
            //var userId = 123;
            var originalFileName = "example.txt";
            var errorResponseMessage = "Bad Request - Invalid content";

            // Mock IFormFile
            var fileMock = new Mock<IFormFile>();
            var fileContent = "This is a test file";
            var fileBytes = Encoding.UTF8.GetBytes(fileContent);
            var stream = new MemoryStream(fileBytes);

            fileMock.Setup(f => f.FileName).Returns(originalFileName);
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                    .Returns<Stream, CancellationToken>((targetStream, _) =>
                    {
                        stream.CopyTo(targetStream);
                        return Task.CompletedTask;
                    });

            // ECM Settings
            var ecmSettings = new EcmSettings
            {
                Username = "user",                
                Api = "/auth",
                ApiBaseURL = "https://fake-api.com",
                FolderId = "999"
            };
            var claims = new List<Claim> { new Claim("uid", "123") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var user = new ClaimsPrincipal(identity);
            var httpContext = new Mock<HttpContext>();
            httpContext.Setup(c => c.User).Returns(user);
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext.Object };

            // Mock token request response
            var tokenResponse = new GetEcmAuthTokenResponse { ticket = "fake-ticket" };

            var tokenHttpResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonConvert.SerializeObject(tokenResponse), Encoding.UTF8, "application/json")
            };
            var tokenHandler1 = new MockHttpMessageHandler(tokenHttpResponse);
            var tokenHttpClient = new HttpClient(tokenHandler1) { BaseAddress = new Uri("https://fake-api.com") };
            

            var error = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonConvert.SerializeObject(errorResponseMessage), Encoding.UTF8, "application/json")
            };
            // 2. Mock file download response
            //var fileBytes = Encoding.UTF8.GetBytes("Sample file content");
            var errorHanler = new MockHttpMessageHandler(error);
            var errorClient = new HttpClient(errorHanler) { BaseAddress = new Uri("https://fake-api.com") };

            _httpClientFactoryMock.SetupSequence(f => f.CreateClient("namedClient2"))
                                  .Returns(tokenHttpClient)   // For token
                                  .Returns(errorClient);  // For upload

            // Setup ECM Repository (should NOT be called in failure case)
            _ecmRepositoryMock.Setup(x => x.AddEcmUploadInfo(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int>()))
                              .Throws(new Exception("Should not be called"));

            // Setup Configuration
            SetupConfigurationForEcmSettings(ecmSettings);

            // Act
            var result = await _controller.UploadToEcmAsync(fileMock.Object);

            // Assert
            var okResult = Assert.IsType<BadRequestObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(400,response.statuscode);
        }



      
        private void SetupConfigurationForEcmSettings(EcmSettings settings)
        {
            var wfSection = new Mock<IConfigurationSection>();
            wfSection.Setup(x => x.GetSection("WfUsername").Value).Returns(settings.Username);
            wfSection.Setup(x => x.GetSection("WfPassword").Value).Returns(settings.Password);
            wfSection.Setup(x => x.GetSection("WfApi").Value).Returns(settings.Api);
            wfSection.Setup(x => x.GetSection("WfApiBaseURL").Value).Returns(settings.ApiBaseURL);
            wfSection.Setup(x => x.GetSection("WfFolderId").Value).Returns(settings.FolderId);

            var ecmSettingsSection = new Mock<IConfigurationSection>();
            ecmSettingsSection.Setup(x => x.GetSection("Workflow")).Returns(wfSection.Object);

            _configurationMock.Setup(x => x.GetSection("EcmSettings")).Returns(ecmSettingsSection.Object);
        }
        public class MockHttpMessageHandlerOne : HttpMessageHandler

        {

            private readonly string _response;

            private readonly HttpStatusCode _statusCode;

            public MockHttpMessageHandlerOne(string response, HttpStatusCode statusCode)

            {

                _response = response;

                _statusCode = statusCode;

            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)

            {

                return Task.FromResult(new HttpResponseMessage

                {

                    StatusCode = _statusCode,

                    Content = new StringContent(_response)

                });

            }

        }

        public class MockHttpMessageHandler : HttpMessageHandler
        {
            private readonly HttpResponseMessage _mockResponse;

            public MockHttpMessageHandler(HttpResponseMessage response)
            {
                _mockResponse = response;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(_mockResponse);
            }
        }
    
}
    }