using Asp.Versioning;
using EODomain.Common;
using EODomain.Models.Account;
using EOInfrastructure.Utility;
using EOInfrastructure.Utility.Cron;
using EOUtility;
using EOWebMicroservice.Middleware;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(nameof(JwtSettings)));
var configuration = builder.Configuration;
string UserName = configuration.GetSection("PeEoOdsSettings").GetSection("PeSettings").GetSection("Username").Value!;
string PassWord = configuration.GetSection("PeEoOdsSettings").GetSection("PeSettings").GetSection("Password").Value!;
string BaseUrl = configuration.GetSection("PeEoOdsSettings").GetSection("PeSettings").GetSection("BaseURL").Value!;
builder.Services.AddHttpContextAccessor();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);
builder.Services.AddMemoryCache();
builder.Services.AddSignalR();


var clientCertificate =
                   new X509Certificate2(
                     Path.Combine(builder.Environment.ContentRootPath.ToLower(), "Utility", "1985449.cer"));

builder.Services
    .AddHttpClient("namedClient")
    // Lambda could be static if clientCertificate can be retrieved from static scope
    .ConfigurePrimaryHttpMessageHandler(_ =>
    {
        var handler = new HttpClientHandler();
        handler.ClientCertificates.Add(clientCertificate);
        return handler;
    });

builder.Services
    .AddHttpClient("namedClient2")
    // Lambda could be static if clientCertificate can be retrieved from static scope
    .ConfigurePrimaryHttpMessageHandler(_ =>
    {
        var handler = new HttpClientHandler();
        return handler;
    });

builder.Services
    .AddHttpClient("NTLMClient", client =>
    {
        client.BaseAddress = new Uri(BaseUrl);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    })
    .ConfigurePrimaryHttpMessageHandler(() =>
    {
        var handler = new HttpClientHandler
        {
            Credentials = new NetworkCredential(UserName, PassWord, "")
        };
        
        handler.ClientCertificates.Add(clientCertificate);
        return handler;
    });


//CORS
builder.Services.AddCors(options =>
{



    options.AddPolicy("CorsPolicy",
        builder => builder
            .WithOrigins(
                "http://localhost:3000",
                "https://localhost:5001",
                "https://dsappsqa.sabic.com",
                "https://edition-unpleased-confiding.ngrok-free.dev"    // public frontend tunnel
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            );
});

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = Convert.ToInt32(builder.Configuration.GetSection("ConfigSettings").GetSection("EOLimit").Value!),
                QueueLimit = 0,
                Window = TimeSpan.FromSeconds(Convert.ToInt32(builder.Configuration.GetSection("ConfigSettings").GetSection("TimeSpan").Value!))
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            await context.HttpContext.Response.WriteAsync(
                $"Too many requests. Please try again after {retryAfter.TotalSeconds} (s). ", cancellationToken: token);
        }
        else
        {
            await context.HttpContext.Response.WriteAsync(
                "Too many requests. Please try again later. ", cancellationToken: token);
        }
    };
});



builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    var securitySchema = new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };
    c.AddSecurityDefinition("Bearer", securitySchema);

    var securityRequirement = new OpenApiSecurityRequirement();
    securityRequirement.Add(securitySchema, new[] { "Bearer" });
    c.AddSecurityRequirement(securityRequirement);
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EO API",
        Version = "v1",
        Description = "Energy Optimization API"
    });
    c.SwaggerDoc("v2", new OpenApiInfo
    {
        Title = "EO API- V2",
        Version = "v2",
        Description = "Energy Optimization API"
    });
    var xfile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xpath = Path.Combine(AppContext.BaseDirectory, xfile);
    c.IncludeXmlComments(xpath);
});
builder.Services.AddSwaggerGen(o => o.SchemaFilter<SwaggerIgnoreFilter>());

builder.Services.AddAuthorization(options =>
{
    // LOCAL DEV BYPASS: allow every request through by default.
    // Individual policies are also relaxed in IdentityServicesRegistration.
    options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAssertion(_ => true)
        .Build();
    options.FallbackPolicy = options.DefaultPolicy;
});

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version")
    );
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});



var cronSettings = builder.Configuration.GetSection("CronSettings");
string cronExpression = $"{cronSettings["Minute"]} {cronSettings["Hour"]} {cronSettings["Date"]} {cronSettings["Month"]} {cronSettings["Day"]}";
// LOCAL DEV BYPASS: the cron expression in appsettings.json is "* * * * *" so this
// BackgroundService fires every minute. On the first tick it instantiates
// EmailServices, whose ctor does `new Uri(EmailSettingsEntity.BaseURL)` against a
// blank BaseURL and throws UriFormatException. Because HostOptions defaults
// BackgroundServiceExceptionBehavior to StopHost, that one unhandled exception
// terminates the whole Kestrel process ~60 s after start-up. Re-enable once the
// email service config + SABIC SMTP endpoint are wired up.
// builder.Services.AddCronJob<CronJob>(cronExpression);

builder.Services.Configure<ValidationOptions>(
builder.Configuration.GetSection("Validation"));

var app = builder.Build();

var validationOptions = app.Services.GetRequiredService<IOptions<ValidationOptions>>().Value;
ValidationSettings.maxTextLength = validationOptions.maxTextLength;

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Add security headers
    app.Use(async (context, next) =>
    {
        if (!context.Response.HasStarted)
        {
            // Access-Control-Allow-Origin is now handled by UseCors("CorsPolicy") below.
            // Keeping it hardcoded here conflicts when the request origin is the ngrok tunnel.
            context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000");
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Append("X-FRAME-OPTIONS", "SAMEORIGIN");
            context.Response.Headers.Append("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
            context.Response.Headers.Append("Pragma", "no-cache");
           

            await next();
        }
    });
}
else
{
    // Add security headers
    app.Use(async (context, next) =>
    {
        if (!context.Response.HasStarted)
        {
#pragma warning disable S7039 // Content Security Policies should be restrictive
            context.Response.Headers.Append("Content-Security-Policy", "default-src 'none';script-src 'self' 'unsafe-inline';connect-src 'self';img-src 'self';style-src 'self';");
#pragma warning restore S7039 // Content Security Policies should be restrictive
            context.Response.Headers.Append("Access-Control-Allow-Origin", "sameorigin");
            context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000");
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
            context.Response.Headers.Append("X-FRAME-OPTIONS", "sameorigin");
            context.Response.Headers.Append("Cache-Control", "no-store, no-cache, max-age=0, must-revalidate");
            context.Response.Headers.Append("Pragma", "no-cache");

            await next();
        }
    });

}
app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "Utility")),
        RequestPath = "/Utility"
    });
app.UseSwagger();

app.UseSwaggerUI(options =>
{
    // Define the endpoints for each version
    options.SwaggerEndpoint("v1/swagger.json", "EO API v1");
    options.SwaggerEndpoint("v2/swagger.json", "EO API v2");
});
app.UseRouting();
app.UseRateLimiter();
app.UseRouting();
// app.UseHttpsRedirection();  // disabled for ngrok tunnel (tunnel terminates TLS; HttpsRedirection would loop-redirect)
app.UseCors("CorsPolicy");
app.UseGlobalExceptionMiddleware();
app.UseCustomHttpContextMiddleware();
app.UseAuthentication();
app.UseAuthorization();
// LOCAL DEV BYPASS: the two middlewares below enforce SABIC AD + DB-backed
// session checks and will 401 every request on a workstation that isn't on
// the corp domain. Re-enable them before shipping.
// app.UseNegotiateAuthMiddleware();
// app.UseBearerAuthMiddleware();
// LOCAL DEV BYPASS: PerformanceLogMiddleware writes every request into the
// usp_add_performance_log stored proc and passes a "NA" user id when the caller
// isn't authenticated (e.g. /WinAuth/authenticate on the very first hit). That
// trips a SqlException which then trips GlobalExceptionMiddleware. Re-enable
// once you're ready to wire up real audit logging.
// app.UsePerformanceLogMiddleware();
app.MapControllers();

await app.RunAsync();
