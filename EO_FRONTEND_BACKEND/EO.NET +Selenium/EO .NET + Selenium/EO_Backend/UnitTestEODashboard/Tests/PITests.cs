using EODomain.Common;
using EODomain.Models.PI;
using EOWebMicroservice.Controllers.v1;
using Moq;
using Xunit;
using Microsoft.AspNetCore.Mvc;
using EOApplication.Contracts.Repositories;
using Microsoft.Extensions.Configuration;
using EOInfrastructure.Services;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace UnitTestEODashboard.Tests
{
    public class PITests
    {
        private readonly IConfigurationRoot configuration;
        private readonly IOptions<PISettings> piSettings;
        private readonly PIServices _mockPiServices;
        private readonly Mock<IPIRepository> _PirepositoryMock;
        private readonly PIController _controller;

        public PITests()
        {
            configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile($"appsettings.json")
                .Build();
            piSettings = Options.Create<PISettings>(new PISettings());
            _PirepositoryMock = new Mock<IPIRepository>();
            _mockPiServices = new PIServices(_PirepositoryMock.Object, piSettings, configuration);
            _controller = new PIController(_mockPiServices);

        }
        [Fact]
        public async Task GetPiTagValidated_ReturnsResponseObject_WhenDataExists()
        {
            // Arrange
            var request = new PiDataValidationRequest { piTagName = "Test" };


            var repoResponse = new GetValuesForStatusByCaseID()
            {
                Links = new Dictionary<string, string>
                {
                    { "Google", "https://www.google.com" },
                    { "GitHub", "https://www.github.com" }
                },
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID
                    {

                        Value= new GetInterpolatedItemResponse()
                        {
                           Annotated=true,
                           Good=true,
                           Value = new object(),
                           Questionable=true,

                        }
                    },


                },
            };
            _PirepositoryMock.Setup(a => a.GetValuesForStatusByCaseID(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(repoResponse);


            _PirepositoryMock.Setup(x => x.GetPIPointDataAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(JsonConvert.SerializeObject(repoResponse));


            // Act
            var result = await _controller.GetPiTagValidated(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

        }

        [Fact]
        public async Task GetPiTagValidated_ReturnsEmptyResponse_WhenDataIsNull()
        {
            // Arrange
            var request = new PiDataValidationRequest { piTagName = "Test" };


            var repoResponse = new GetValuesForStatusByCaseID()
            {
                Links = new Dictionary<string, string>
                {
                    { "Google", "https://www.google.com" },
                    { "GitHub", "https://www.github.com" }
                },
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID
                    {
                        Value= new GetInterpolatedItemResponse()
                        {
                           Annotated=true,
                           Good=true,
                           Value = new object(),
                           Questionable=true,

                        }
                    },


                },
            };
            _PirepositoryMock.Setup(a => a.GetValuesForStatusByCaseID(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(repoResponse);

            _PirepositoryMock.Setup(x => x.GetPIPointDataAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(JsonConvert.SerializeObject(repoResponse));


            // Act
            var result = await _controller.GetPiTagValidated(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);

        }

        [Fact]
        public async Task GetPiTagValidated_ReturnsExpectedResponses_ForVariousWebIDScenarios()
        {
            // Arrange
            var validTag = "ValidTag";
            var downTag = "DownTag";
            var notFoundTag = "NotFoundTag";
            var emptyTag = "EmptyTag";

            var validWebIDJson = "{\"WebId\":\"webid123\"}";
            var invalidWebIDJson = "{\"error\":\"Unable to connect to PI system\"}";
            var notFoundWebIDJson = "{\"error\":\"Not Found\"}";

            _PirepositoryMock.Setup(repo =>
                repo.GetPIPointDataAsync(It.Is<string>(s => s.Contains(validTag)), It.IsAny<string>()))
                .ReturnsAsync(validWebIDJson);

            _PirepositoryMock.Setup(repo =>
                repo.GetPIPointDataAsync(It.Is<string>(s => s.Contains(downTag)), It.IsAny<string>()))
                .ReturnsAsync(invalidWebIDJson);

            _PirepositoryMock.Setup(repo =>
                repo.GetPIPointDataAsync(It.Is<string>(s => s.Contains(notFoundTag)), It.IsAny<string>()))
                .ReturnsAsync(notFoundWebIDJson);

            var piData = new GetValuesForStatusByCaseID
            {
                Items = new List<ItemValuesForStatusByCaseID>
                {
                    new ItemValuesForStatusByCaseID
                    {
                        WebId = "webid123",
                        Name = "SomeName",
                        Path = "\\path\\to\\tag",
                        Value = new GetInterpolatedItemResponse
                        {
                            Value = "123.45",
                            Timestamp = DateTime.UtcNow,
                            UnitsAbbreviation = "psi",
                            Good = true,
                            Questionable = false,
                            Substituted = false,
                            Annotated = false
                        }
                    }
                }
            };

            _PirepositoryMock.Setup(repo =>
                repo.GetValuesForStatusByCaseID(It.Is<string>(s => s == "webid123"), It.IsAny<string>()))
                .ReturnsAsync(piData);

            // Act – Valid tag
            var resultValid = await _controller.GetPiTagValidated(new PiDataValidationRequest { piTagName = validTag });
            var okResultValid = Assert.IsType<OkObjectResult>(resultValid);
            Assert.IsType<Response<object>>(okResultValid.Value);

            // Act – Down tag
            var resultDown = await _controller.GetPiTagValidated(new PiDataValidationRequest { piTagName = downTag });
            var okResultDown = Assert.IsType<OkObjectResult>(resultDown);
            Assert.IsType<Response<object>>(okResultDown.Value);

            // Act – NotFound tag
            var resultNotFound = await _controller.GetPiTagValidated(new PiDataValidationRequest { piTagName = notFoundTag });
            var okResultNotFound = Assert.IsType<OkObjectResult>(resultNotFound);
            Assert.IsType<Response<object>>(okResultNotFound.Value);

            // Act – Null from GetValuesForStatusByCaseID
            _PirepositoryMock.Setup(repo =>
                repo.GetPIPointDataAsync(It.Is<string>(s => s.Contains(emptyTag)), It.IsAny<string>()))
                .ReturnsAsync(validWebIDJson);

            _PirepositoryMock.Setup(repo =>
                repo.GetValuesForStatusByCaseID(It.Is<string>(s => s == "webid123"), It.IsAny<string>()))
                .ReturnsAsync((GetValuesForStatusByCaseID)null!);

            var resultNull = await _controller.GetPiTagValidated(new PiDataValidationRequest { piTagName = emptyTag });
            var okResultNull = Assert.IsType<OkObjectResult>(resultNull);
            Assert.IsType<Response<object>>(okResultNull.Value);
        }
    }
}