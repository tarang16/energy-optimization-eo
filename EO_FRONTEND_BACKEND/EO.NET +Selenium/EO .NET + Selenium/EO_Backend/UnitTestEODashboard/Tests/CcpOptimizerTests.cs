using Moq;
using Xunit;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Collections.Generic;
using EOInfrastructure.Services;
using EOWebMicroservice.Controllers.v1;
using EODomain.Models.CCP;
using EODomain.Models.Account;
using EOWebMicroservice.Filter;
using Microsoft.AspNetCore.Mvc;
using EOApplication.Contracts.Repositories;
using EODomain.Common;
using EOApplication.Contracts.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using EODomain.Models.Favorites;
using System.Data;
using System.Dynamic;
using EODomain.Models.CcpOptimizer;
using EODomain.Models.Requests;
namespace UnitTestEODashboard.Tests
{
    public class CcpOptimizerTests
    {
        private readonly CcpOptimizerServices _ccpServicesMock;
        private readonly Mock<ICcpOptimizerRepository> _ccpRepositoryMock;
        
        private readonly Mock<IAccountServices> _accountServicesMock;
        private readonly Mock<IConfigServices> _configServicesMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly CcpOptimizerController _controller;

        public CcpOptimizerTests()
        {
            _ccpRepositoryMock = new Mock<ICcpOptimizerRepository>();
            
            _ccpServicesMock = new CcpOptimizerServices(_ccpRepositoryMock.Object);
            _accountServicesMock = new Mock<IAccountServices>();
            _configServicesMock = new Mock<IConfigServices>();
            _configurationMock = new Mock<IConfiguration>();

            _controller = new CcpOptimizerController(
                _ccpServicesMock,
                _configurationMock.Object,
                _accountServicesMock.Object,
                _configServicesMock.Object
            );
        }

        [Fact]
        public async Task GetOptimizerConstraints_ReturnsOk_WithEmptyData()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 100 };
            List<dynamic> x = new List<dynamic>();

            _ccpRepositoryMock.Setup(s => s.GetOptimizerConstraintsAsync(request.caseID))
                .ReturnsAsync(x);


            // Act
            var result = await _controller.GetOptimizerConstraints(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task GetOptimizerConstraints_ReturnsOk_WithData()
        {
            // Arrange
            int tagOptimum = 10;

            var request = new GetCaseIDRequest { caseID = 100 };
            List<dynamic> x = new List<dynamic> { tagOptimum };


            _ccpRepositoryMock.Setup(s => s.GetOptimizerConstraintsAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerConstraints(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
            Assert.Equal(x, response.data);


        }

        [Fact]
        public async Task GetOptimizerVariablesDataByCaseIdAsync_ReturnsOk_WithEmptyData()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 100 };
            List<dynamic> x = new List<dynamic>();

            _ccpRepositoryMock.Setup(s => s.GetOptimizerVariablesDataByCaseIdAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerVariablesDataByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task GetOptimizerVariablesDataByCaseIdAsync_ReturnsOk_WithData()
        {
            // Arrange

            int tagOptimum = 10;

            var request = new GetCaseIDRequest { caseID = 100 };
            List<dynamic> x = new List<dynamic> { tagOptimum };


            _ccpRepositoryMock.Setup(s => s.GetOptimizerVariablesDataByCaseIdAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerVariablesDataByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);




        }

        [Fact]
        public async Task GetOptimizerParameterByCaseIdAsync_ReturnsEmptyData()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 100 };
            List<dynamic> x = new List<dynamic>();

            _ccpRepositoryMock
                .Setup(s => s.GetOptimizerParameterByCaseIdAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerParameterByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task GetOptimizerParameterByCaseIdAsync_ReturnsData()
        {
            // Arrange
            int tagOptimum = 10;

            var request = new GetCaseIDRequest { caseID = 100 };
            List<dynamic> x = new List<dynamic> { tagOptimum };


            _ccpRepositoryMock
                .Setup(s => s.GetOptimizerParameterByCaseIdAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerParameterByCaseIdAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<object>>(okResult.Value);

        }

        [Fact]
        public async Task GetOptimizerDerivedEquations_ReturnsOk_WithData()
        {
            // Arrange

            var request = new GetCaseIDRequest { caseID = 1 };
            int tagOptimum = 10;
            List<dynamic> x = new List<dynamic> { tagOptimum };


            _ccpRepositoryMock.Setup(s => s.GetOptimizerDerivedEquationsAsync(request.caseID))
                .ReturnsAsync(x);


            // Act
            var result = await _controller.GetOptimizerDerivedEquations(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);


        }

        [Fact]
        public async Task GetOptimizerDerivedEquations_ReturnsOk_WithEmptyData()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 1 };
            List<dynamic> x = new List<dynamic>();

            _ccpRepositoryMock.Setup(x => x.GetOptimizerDerivedEquationsAsync(request.caseID)).ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerDerivedEquations(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);



        }

        [Fact]
        public async Task GetOptimizerObjectiveFunction_ReturnsOk_WithEmptyData()
        {
            // Arrange
            List<dynamic> x = new List<dynamic>();

            var request = new GetCaseIDRequest { caseID = 1 };
            _ccpRepositoryMock.Setup(s => s.GetOptimizerObjectiveFunctionAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerObjectiveFunction(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<Array>>(okResult.Value);
            Assert.Equal(ResponseConstants.EMPTYDATA, response.data);
        }

        [Fact]
        public async Task GetOptimizerObjectiveFunction_ReturnsOk_WithData()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 1 };
            int tagOptimum = 10;
            List<dynamic> x = new List<dynamic> { tagOptimum };

            _ccpRepositoryMock.Setup(s => s.GetOptimizerObjectiveFunctionAsync(request.caseID))
                .ReturnsAsync(x);

            // Act
            var result = await _controller.GetOptimizerObjectiveFunction(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(x, response.data);
        }

        [Fact]
        public async Task AddOptimizerObjective_ReturnsOk_WhenSuccessful()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "888888888"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            

            var request = new AddOptimizerObjectiveRequest { objectiveId = 1 };
            var mockResult = new Dictionary<string, string> { { "Success", "Objective added successfully" } };

            _ccpRepositoryMock.Setup(s => s.AddOptimizerObjectiveAsync(It.IsAny<AddOptimizerObjectiveRequest>()))
                .ReturnsAsync(mockResult);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act

            var result = await _controller.AddOptimizerObjective(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseObject = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(mockResult, responseObject.data);
        }

        [Fact]
        public async Task AddOptimizerObjective_ReturnsBadRequest_WhenServiceReturnsNull()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "888888888"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
           
            
            var request = new AddOptimizerObjectiveRequest
            {
                objectiveId = 1
            };
            _ccpRepositoryMock.Setup(s => s.AddOptimizerObjectiveAsync(It.IsAny<AddOptimizerObjectiveRequest>()))
                .ReturnsAsync((Dictionary<string, string>?)null!);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.AddOptimizerObjective(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(result);

        }

        [Fact]
        public async Task AddOptimizerDerivedEquation_ReturnsOk_WhenNoErrorOccurs()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
           
            
            var request = new AddOptimizerDerivedEquationRequest();
            var mockResult = new Dictionary<string, string> { { "Success", "Equation added successfully" } };

            _ccpRepositoryMock.Setup(s => s.AddOptimizerDerivedEquationAsync(It.IsAny<AddOptimizerDerivedEquationRequest>()))
                        .ReturnsAsync(mockResult);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.AddOptimizerDerivedEquation(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.NotNull(response.data);
        }

        [Fact]
        public async Task AddOptimizerDerivedEquation_ReturnsBadRequest_WhenErrorOccurs()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            
            
            var request = new AddOptimizerDerivedEquationRequest();
            var mockResult = new Dictionary<string, string> { { "Error", "Some error occurred" } };

            _ccpRepositoryMock.Setup(s => s.AddOptimizerDerivedEquationAsync(It.IsAny<AddOptimizerDerivedEquationRequest>()))
                        .ReturnsAsync(mockResult);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;
            // Act
            var result = await _controller.AddOptimizerDerivedEquation(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);

        }

        [Fact]
        public async Task AddOptimizerVariable_ReturnsOk_WhenSuccessful()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
           
           
            var request = new AddOptimizerVariableRequest();
            var mockResult = new Dictionary<string, string> { { "Success", "Variable added successfully" } };

            _ccpRepositoryMock.Setup(s => s.AddOptimizerVariableAsync(It.IsAny<AddOptimizerVariableRequest>()))
                .ReturnsAsync(mockResult);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;


            // Act
            var result = await _controller.AddOptimizerVariable(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var responseObject = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(mockResult, responseObject.data);
        }

        [Fact]
        public async Task AddOptimizerVariable_ReturnsBadRequest_WhenServiceReturnsNull()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            
            
            var request = new AddOptimizerVariableRequest();

            _ccpRepositoryMock.Setup(s => s.AddOptimizerVariableAsync(It.IsAny<AddOptimizerVariableRequest>()))
                .ReturnsAsync((Dictionary<string, string>?)null!);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.AddOptimizerVariable(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task AddOptimizerConstraint_ReturnsOk_WhenServiceReturnsValidResult()
        {
            // Arrange
            var request = new AddOptimizerConstraintRequest();
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
           
            var mockResult = new Dictionary<string, string> { { "Success", "Constraint added" } };

            _ccpRepositoryMock.Setup(s => s.AddOptimizerConstraintAsync(It.IsAny<AddOptimizerConstraintRequest>()))
                            .ReturnsAsync(mockResult);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.AddOptimizerConstraint(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);

        }

        [Fact]
        public async Task AddOptimizerConstraint_ReturnsBadRequest_WhenServiceReturnsNull()
        {
            // Arrange

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            
            var request = new AddOptimizerConstraintRequest
            {
                constraintId = 1
            };
            var mockResult = new Dictionary<string, string> { { "Error", "Invalid constraint" } };
            _ccpRepositoryMock.Setup(s => s.AddOptimizerConstraintAsync(It.IsAny<AddOptimizerConstraintRequest>()))
                            .ReturnsAsync(mockResult);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;


            // Act
            var result = await _controller.AddOptimizerConstraint(request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(result);
        }

        [Fact]
        public async Task UpdateOptimizerParameter_ReturnsOk_WhenServiceReturnsValidResult()
        {
            // Arrange
            var request = new AddOptimizerParameterRequest();
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
           
            var mockResult = new Dictionary<string, string> { { "Success", "Parameter updated" } };

            _ccpRepositoryMock.Setup(s => s.UpdateOptimizerParameterAsync(It.IsAny<AddOptimizerParameterRequest>()))
                            .ReturnsAsync(mockResult);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;


            // Act
            var result = await _controller.UpdateOptimizerParameter(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task UpdateOptimizerParameter_ReturnsBadRequest_WhenErrorInResult()
        {
            // Arrange
            var request = new AddOptimizerParameterRequest();
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
           
            var mockResult = new Dictionary<string, string> { { "Error", "Invalid parameter" } };

            _ccpRepositoryMock.Setup(s => s.UpdateOptimizerParameterAsync(It.IsAny<AddOptimizerParameterRequest>()))
                            .ReturnsAsync(mockResult);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;


            // Act
            var result = await _controller.UpdateOptimizerParameter(request);

            // Assert
             Assert.IsType<BadRequestObjectResult>(result);

        }

        [Fact]
        public async Task UpdateEquipmentAvailability_ReturnsOk_WhenServiceReturnsValidResult()
        {
            // Arrange
            var request = new UpdEquipAvaliabilityRequestData();
            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            
            _ccpRepositoryMock.Setup(s => s.UpdateEquipmentAvailabilityAsync(It.IsAny<UpdEquipAvaliabilityRequestData>()));

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext();

            httpContext.User = user;

            _controller.ControllerContext.HttpContext = httpContext;


            // Act
            var result = await _controller.UpdateEquipmentAvailability(request);

            // Assert
           Assert.IsType<OkObjectResult>(result);

        }

        [Fact]
        public async Task UpdateEquipmentAvailability_ReturnsOkWithResult_WhenServiceReturnsNonNull()
        {
            // Arrange
            var request = new UpdEquipAvaliabilityRequestData();
            var claims = new List<Claim> { new Claim("uid", "123") };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);

            var httpContext = new DefaultHttpContext
            {
                User = user
            };

            _controller.ControllerContext.HttpContext = httpContext;

            var expectedResult = "UpdateSuccessful";

            _ccpRepositoryMock
                .Setup(s => s.UpdateEquipmentAvailabilityAsync(It.IsAny<UpdEquipAvaliabilityRequestData>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.UpdateEquipmentAvailability(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }

        [Fact]
        public async Task UpdateOptimizationPriceInputReturnsOkResultWhenDataFound()
        {
            // Arrange
            var request = new UpdateOptimizationPriceInput { caseId = 100 };
            var expectedResult = "Update successful";

            _ccpRepositoryMock
                .Setup(s => s.UpdateOptimizationPriceInputAsync(request))
                .ReturnsAsync(expectedResult);

            var ccpOptimizerServices = new CcpOptimizerServices(_ccpRepositoryMock.Object);
            var controller = new CcpOptimizerController(ccpOptimizerServices, _configurationMock.Object, _accountServicesMock.Object, _configServicesMock.Object);

            // Act
            var result = await controller.UpdateOptimizationPriceInput(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal(expectedResult, response.data);
        }

        [Fact]
        public async Task UpdateOptimizationPriceInputReturnsOkResultWhenDataNotFound()
        {
            // Arrange
            var request = new UpdateOptimizationPriceInput { caseId = 100 };


            _ccpRepositoryMock
                .Setup(s => s.UpdateOptimizationPriceInputAsync(request))
                .ReturnsAsync("");

            var ccpOptimizerServices = new CcpOptimizerServices(_ccpRepositoryMock.Object);
            var controller = new CcpOptimizerController(ccpOptimizerServices, _configurationMock.Object, _accountServicesMock.Object, _configServicesMock.Object);

            // Act
            var result = await controller.UpdateOptimizationPriceInput(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<Array>>(okResult.Value);
        }

        [Fact]
        public async Task GetConfigEquipmentAvailability_ReturnsData_WhenDataExists()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 123 };
            var expectedData = new List<object> { new object() };
            _ccpRepositoryMock.Setup(service => service.GetConfigEquipmentAvailabilityAsync(It.IsAny<int>()))
                            .ReturnsAsync(expectedData);

            // Act
            var result = await _controller.GetConfigEquipmentAvailability(request) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.Equal(200, result.StatusCode);
            var response = result.Value as Response<object>;
            Assert.NotNull(response);


        }

        [Fact]
        public async Task GetConfigEquipmentAvailability_ReturnsEmptyResponse_WhenNoData()
        {
            // Arrange
            var request = new GetCaseIDRequest { caseID = 123 };
            _ccpRepositoryMock.Setup(service => service.GetConfigEquipmentAvailabilityAsync(It.IsAny<int>()))
                            .ReturnsAsync(new List<object>());

            // Act
            var result = await _controller.GetConfigEquipmentAvailability(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task PostDeleteOptimizerDerivedEquation_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new OptimizerDerivedEquationIdRequest
            {
                derivedEquationId = 123
            };
            _ccpRepositoryMock.Setup(service => service.PostDeleteOptimizerDerivedEquationAsync(request));


            // Act
            var result = await _controller.PostDeleteOptimizerDerivedEquation(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task PostDeleteOptimizerDerivedEquation_ReturnsOkWithResult_WhenResultIsNotNull()
        {
            // Arrange
            var request = new OptimizerDerivedEquationIdRequest { derivedEquationId = 123 };
            var expectedResult = "Success"; 

            _ccpRepositoryMock
                .Setup(repo => repo.PostDeleteOptimizerDerivedEquationAsync(request))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.PostDeleteOptimizerDerivedEquation(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);


        }

        [Fact]
        public async Task PostDeleteOptimizerVariable_ReturnsEmptyOk_WhenResultIsNull()
        {
            // Arrange
            var request = new OptimizerVariableIdRequest { variableId = 123 };
            _ccpRepositoryMock.Setup(s => s.PostDeleteOptimizerVariableAsync(It.IsAny<OptimizerVariableIdRequest>()));

            // Act
            var result = await _controller.PostDeleteOptimizerVariable(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task PostDeleteOptimizerVariable_ReturnsOkWithResult_WhenResultIsNotNull()
        {
            // Arrange
            var request = new OptimizerVariableIdRequest { variableId = 123 };
            var expectedResult = "Success";

            _ccpRepositoryMock
                .Setup(s => s.PostDeleteOptimizerVariableAsync(It.IsAny<OptimizerVariableIdRequest>()))
                .ReturnsAsync(expectedResult);
            
            // Act
            var result = await _controller.PostDeleteOptimizerVariable(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);

        }

        [Fact]
        public async Task PostDeleteOptimizerConstraint_ReturnsValidResponse_WhenResultIsNotNull()
        {
            // Arrange 
            var request = new OptimizerConstraintIdRequest()
            {
                constraintId = 123
            };
            
            _ccpRepositoryMock.Setup(x => x.PostDeleteOptimizerConstraintAsync(It.IsAny<OptimizerConstraintIdRequest>()))
                            .ReturnsAsync(It.IsAny<string>);

            // Act
            var result = await _controller.PostDeleteOptimizerConstraint(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
           Assert.IsType<Response<Array>>(okResult.Value);

        }

        [Fact]
        public async Task PostDeleteOptimizerConstraint_ReturnsOkResponse_WhenResultIsNotNull()
        {
            // Arrange
            var request = new OptimizerConstraintIdRequest { constraintId = 123 };

            _ccpRepositoryMock
                .Setup(x => x.PostDeleteOptimizerConstraintAsync(It.IsAny<OptimizerConstraintIdRequest>()))
                .ReturnsAsync("Success");

            // Act
            var result = await _controller.PostDeleteOptimizerConstraint(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<Response<object>>(okResult.Value);
            Assert.Equal("Success", response.data);
        }

        [Fact]
        public async Task PostDeleteOptimizerParameter_ReturnsEmptyResponse_WhenResultIsNull()
        {
            // Arrange
            var request = new OptimizerParameterIdRequest { modelTagId = 1 };
            _ccpRepositoryMock.Setup(x => x.PostDeleteOptimizerParameterAsync(It.IsAny<OptimizerParameterIdRequest>()))
                            .ReturnsAsync(It.IsAny<string>);

            // Act
            var result = await _controller.PostDeleteOptimizerParameter(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);
        }

        [Fact]
        public async Task PostDeleteOptimizerParameter_ReturnsResult_WhenNotNull()
        {
            // Arrange
            var request = new OptimizerParameterIdRequest { modelTagId = 123 };
            var expectedResult = "Success";

            _ccpRepositoryMock
                .Setup(x => x.PostDeleteOptimizerParameterAsync(It.IsAny<OptimizerParameterIdRequest>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.PostDeleteOptimizerParameter(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOptimizerConstraintCategory_ReturnsEmptyResponse_WhenDataIsEmpty()
        {
            // Arrange
            _ccpRepositoryMock.Setup(x => x.GetOptimizerConstraintCategoryAsync())
                            .ReturnsAsync(new List<object>());

            // Act
            var result = await _controller.GetOptimizerConstraintCategory();

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetOptimizerConstraintCategory_ReturnsData_WhenNotEmpty()
        {
            // Arrange
            var expectedResult = new List<object>
            {
                new { Id = 1, Name = "Category 1" },
                new { Id = 2, Name = "Category 2" }
            };
            _ccpRepositoryMock.Setup(x => x.GetOptimizerConstraintCategoryAsync())
                            .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetOptimizerConstraintCategory();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task GetSeuDetails_ReturnsEmptyResponse_WhenDataIsEmpty()
        {
            // Arrange
            var request = new CaseIdSeuInputRequest { caseID = 1 };
            _ccpRepositoryMock.Setup(x => x.GetSeuDetailsDataAsync(request.caseID))
                              .ReturnsAsync(null);

            // Act
            var result = await _controller.GetSeuDetailsData(request);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetSeuDetails_ReturnsData_WhenNotEmpty()
        {
            var request = new CaseIdSeuInputRequest { caseID = 1 };
            var expectedResult = new List<object> { new object() };
            _ccpRepositoryMock.Setup(x => x.GetSeuDetailsDataAsync(request.caseID))
                            .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetSeuDetailsData(request) as OkObjectResult;

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task GetSubModel_ReturnsEmptyResponse_WhenDataIsEmpty()
        {
            // Arrange
            var request = new CaseIdSeuInputRequest { caseID = 1 };
            _ccpRepositoryMock.Setup(x => x.GetSubModelDataAsync(request.caseID))
                              .ReturnsAsync(null);

            // Act
            var result = await _controller.GetSubModelDataAsync(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetSubModel_ReturnsData_WhenNotEmpty()
        {
            var request = new CaseIdSeuInputRequest { caseID = 1 };
            var expectedResult = new List<object> { new object() };
            _ccpRepositoryMock.Setup(x => x.GetSubModelDataAsync(request.caseID))
                            .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetSubModelDataAsync(request) as OkObjectResult;

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.IsType<Response<object>>(okResult.Value);
        }

        [Fact]
        public async Task UpdateSeuDetails_ReturnsEmptyResponse_WhenResultIsNull()
        {
            // Arrange
            var request = new UpdateSeuDetailsRequest { 
                caseID = 1,
                seuID=1,
                actualDutyExpression="Test1",
                baselineDutyExpression= "Test2",
                seuCategory= "Test3",
                seuDisplayName= "Test4",
                seuName= "Test5",
                targetDutyExpression= "Test6"
            };
            _ccpRepositoryMock.Setup(x => x.UpdateSeuDetailsDataAsync(request))
                            .ReturnsAsync(It.IsAny<string>);

            // Act
            var result = await _controller.UpdateSeuDetailsDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);
        }

        [Fact]
        public async Task UpdateSeuDetails_ReturnsResult_WhenNotNull()
        {
            // Arrange
            var request = new UpdateSeuDetailsRequest
            {
                caseID = 1,
                seuID = 1,
                actualDutyExpression = "Test1",
                baselineDutyExpression = "Test2",
                seuCategory = "Test3",
                seuDisplayName = "Test4",
                seuName = "Test5",
                targetDutyExpression = "Test6"
            };

            var expectedResult = new List<ExpandoObject>(); 

            _ccpRepositoryMock
                .Setup(x => x.UpdateSeuDetailsDataAsync(request))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.UpdateSeuDetailsDataAsync(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task UpdateSubModel_ReturnsEmptyResponse_WhenResultIsNull()
        {
            // Arrange
            var request = new UpdateSubModelRequest
            {
                caseID = 1,
                subModelID = 1,
                subModelName = "Test1",
                subModelType = "Test2",
                order = 1,
                responseOutput = true,
                subModelExpression = "Test3",
            };
            _ccpRepositoryMock.Setup(x => x.UpdateSubModelDataAsync(request))
                            .ReturnsAsync(It.IsAny<string>);

            // Act
            var result = await _controller.UpdateSubModelDataAsync(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
             Assert.IsType<Response<Array>>(okResult.Value);
        }

        [Fact]
        public async Task UpdateSubModel_ReturnsResult_WhenNotNull()
        {
            // Arrange
            var request = new UpdateSubModelRequest
            {
                caseID = 1,
                subModelID = 1,
                subModelName = "Test1",
                subModelType = "Test2",
                order = 1,
                responseOutput = true,
                subModelExpression = "Test3",
            };
            var expectedResult = new List<ExpandoObject>();

            _ccpRepositoryMock
            .Setup(x => x.UpdateSubModelDataAsync(It.IsAny<UpdateSubModelRequest>()))
            .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.UpdateSubModelDataAsync(request);

            // Assert
             Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task AddOptimizerConstraint_ReturnsBadRequest_WhenServiceReturnsNullResult()
        {
            // Arrange
            var request = new AddOptimizerConstraintRequest
            {
                constraintId = 1,
                modelId = 101,
                constraintCategoryId = 5,
                system = "SYS",
                expression = "x + y"
            };

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);
            var user = new ClaimsPrincipal(claimsIdentityMock.Object);

            var httpContext = new DefaultHttpContext
            {
                User = user
            };

            _ccpRepositoryMock
                .Setup(r => r.AddOptimizerConstraintAsync(It.IsAny<AddOptimizerConstraintRequest>()))
                .ReturnsAsync((Dictionary<string, string>?)null!);

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.AddOptimizerConstraint(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
             Assert.IsType<Response<Array>>(badRequestResult.Value);
        }

        [Fact]
        public async Task UpdateOptimizerParameter_ReturnsBadRequest_WhenServiceReturnsNull()
        {
            // Arrange
            var request = new AddOptimizerParameterRequest
            {
                modelTagId = 123,
                flagParameter = true
            };

            var claims = new List<Claim>
            {
                new Claim("uid", "123"),
            };

            var claimsIdentityMock = new Mock<ClaimsIdentity>();
            claimsIdentityMock.Setup(x => x.Claims).Returns(claims);

            var user = new ClaimsPrincipal(claimsIdentityMock.Object);
            var httpContext = new DefaultHttpContext
            {
                User = user
            };

            _ccpRepositoryMock
                .Setup(r => r.UpdateOptimizerParameterAsync(It.IsAny<AddOptimizerParameterRequest>()))
                .ReturnsAsync((Dictionary<string, string>?)null!);

            _controller.ControllerContext.HttpContext = httpContext;

            // Act
            var result = await _controller.UpdateOptimizerParameter(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
             Assert.IsType<Response<Array>>(badRequestResult.Value);
        }
    }
}