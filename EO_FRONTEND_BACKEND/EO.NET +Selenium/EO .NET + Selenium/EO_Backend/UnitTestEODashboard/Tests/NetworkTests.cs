using System.Threading.Tasks;
using Xunit;
using Moq;
using EOWebMicroservice.Controllers.v1;
using EOApplication.Contracts.Services;
using EODomain.Models.Requests;
using Microsoft.AspNetCore.Mvc;
using EODomain.Common;
using EODomain.Models.Network;
using EOInfrastructure.Services;
using EOApplication.Contracts.Repositories;

namespace UnitTestEODashboard.Tests
{
    public class NetworkTests
    {
        private readonly NetworkServices _mockNetworkServices;
        private readonly Mock<IConfigServices> _mockConfigServices;
        private readonly NetworkController _controller;
        private readonly Mock<INetworkRepository> _mockNetworkRepository;

        public NetworkTests()
        {
            _mockNetworkRepository = new Mock<INetworkRepository>();
            _mockNetworkServices = new NetworkServices(_mockNetworkRepository.Object);
            _mockConfigServices = new Mock<IConfigServices>();
            _controller = new NetworkController(_mockNetworkServices, _mockConfigServices.Object);
        }

        [Fact]
        public async Task GetEnpiDailyTrend_ShouldReturnOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new GetMstNetworkPagesRequest { /* Populate properties */ };
            var expectedResult = new object(); // Mocked response
            _mockNetworkRepository.Setup(s => s.GetMstNetworkPagesAsync(request))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetEnpiDailyTrend(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }

        [Fact]
        public async Task GetEnpiDailyTrend_ShouldReturnEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new GetMstNetworkPagesRequest { /* Populate properties */ };
            _mockNetworkRepository.Setup(s => s.GetMstNetworkPagesAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetEnpiDailyTrend(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
        }

        [Fact]
        public async Task PostMstNetworkPages_ShouldReturnOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new PostMstNetworkPagesRequest { /* Populate properties */ };
            var expectedResult = new object(); // Mocked response
            _mockNetworkRepository.Setup(s => s.PostMstNetworkPagesAsync(request))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.PostMstNetworkPages(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }

        [Fact]
        public async Task PostMstNetworkPages_ShouldReturnEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new PostMstNetworkPagesRequest { /* Populate properties */ };
            _mockNetworkRepository.Setup(s => s.PostMstNetworkPagesAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.PostMstNetworkPages(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
        }
        [Fact]
        public async Task GetTrnNetworkPages_ShouldReturnOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new GetTrnNetworkPagesRequest { /* Populate properties */ };
            var expectedResult = new object(); // Mocked response
            _mockNetworkRepository.Setup(s => s.GetTrnNetworkPagesAsync(request))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetTrnNetworkPages(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }
        [Fact]
        public async Task GetTrnNetworkPages_ShouldReturnEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new GetTrnNetworkPagesRequest { /* Populate properties */ };
            _mockNetworkRepository.Setup(s => s.GetTrnNetworkPagesAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetTrnNetworkPages(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

        }
        [Fact]
        public async Task PostTrnNetworkPages_ShouldReturnOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new PostTrnNetworkPagesRequest { /* Populate properties */ };
            var expectedResult = new object(); // Mocked response
            _mockNetworkRepository.Setup(s => s.PostTrnNetworkPagesAsync(request))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.PostTrnNetworkPages(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }
        [Fact]
        public async Task PostTrnNetworkPages_ShouldReturnEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new PostTrnNetworkPagesRequest { /* Populate properties */ };
            _mockNetworkRepository.Setup(s => s.PostTrnNetworkPagesAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.PostTrnNetworkPages(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

        }
        [Fact]
        public async Task GetAllTagsByCaseID_ShouldReturnOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 1 };
            var expectedResult = new object(); // Mocked response
            _mockNetworkRepository.Setup(s => s.GetAllTagsByCaseIDAsync(request))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAllTagsByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }
        [Fact]
        public async Task GetAllTagsByCaseID_ShouldReturnEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new CaseIdInputRequest { caseID = 1 };
            _mockNetworkRepository.Setup(s => s.GetAllTagsByCaseIDAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetAllTagsByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

        }

        [Fact]
        public async Task GetAllTagDataByCaseID_ShouldReturnOk_WhenResultIsNotNull()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1 };
            var expectedResult = new object();
            _mockNetworkRepository.Setup(s => s.GetAllTagDataByCaseIDAsync(request))
                                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAllTagDataByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }
        [Fact]
        public async Task GetAllTagDataByCaseID_ShouldReturnEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new CaseIdDateTimeRequest { caseID = 1 };
            _mockNetworkRepository.Setup(s => s.GetAllTagDataByCaseIDAsync(request))
                                .ReturnsAsync(null);

            // Act
            var result = await _controller.GetAllTagDataByCaseID(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

        }

    }
}