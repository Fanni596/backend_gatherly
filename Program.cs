using GatherlyAPIv0._0._1.Helpers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

builder.Services.AddScoped<JWTgeneratorHelper>();
builder.Services.AddScoped<OTPHelper>();
builder.Services.AddHttpContextAccessor();
// Add to your services configuration
builder.Services.AddHttpClient();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
})
.AddCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Use Always if using HTTPS
    options.Cookie.Name = "jwt";
    options.LoginPath = "/api/Authentication/login/email"; // Redirect to login if not authenticated
    options.AccessDeniedPath = "/api/Authentication/accessdenied";
});

// CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder =>
        {
            builder.WithOrigins("http://localhost:5173", "http://localhost:5174", "https://4jhdk4gs-5173.inc1.devtunnels.ms") // Replace with your React Vite frontend URL
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .WithExposedHeaders("*")
                   .AllowCredentials(); // Allow credentials (cookies)
        });
});





builder.WebHost.UseWebRoot("wwwroot");

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 100MB
});

builder.Services.AddSingleton<SmsHelper>(provider =>
    new SmsHelper(
        "FOKFWC",          // Your API username from configuration
        "q1irru86tz53ei",  // Your API password from configuration
        "https://api.sms-gate.app/3rdparty/v1/message"
    ));
builder.Services.AddMemoryCache();

// Add services to the container.
builder.Services.AddSingleton<DatabaseHelper>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAllOrigins");

app.UseHttpsRedirection();

app.UseAuthentication(); // Ensure authentication middleware is added
app.UseAuthorization();
app.UseStaticFiles(); // Enable static file serving
app.MapControllers();

app.Run();