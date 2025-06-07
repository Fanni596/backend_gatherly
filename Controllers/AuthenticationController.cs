using Microsoft.AspNetCore.Mvc;
using GatherlyAPIv0._0._1.Models;
using GatherlyAPIv0._0._1.Helpers;
using MySql.Data.MySqlClient;
using Org.BouncyCastle.Crypto.Generators;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text.Json;
using MySqlX.XDevAPI.Common;



namespace GatherlyAPIv0._0._1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly DatabaseHelper _databaseHelper;
        private readonly IConfiguration _configuration;
        private readonly SmsHelper _smsHelper;
        JWTgeneratorHelper _jwtGeneratorHelper;
        OTPHelper _otpHelper;
        public AuthenticationController(
     DatabaseHelper databaseHelper,
     IConfiguration configuration,
     SmsHelper smsHelper,
     JWTgeneratorHelper jwtGeneratorHelper,
     OTPHelper otpHelper)
        {
            _databaseHelper = databaseHelper;
            _configuration = configuration;
            _smsHelper = smsHelper;
            _jwtGeneratorHelper = jwtGeneratorHelper;
            _otpHelper = otpHelper;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] userSignup user)
        {
            try
            {
                // Check if the email already exists
                string checkEmailQuery = "SELECT COUNT(*) FROM users WHERE Email = @Email;";
                var checkEmailParameters = new[] { new MySqlParameter("@Email", user.Email) };

                var emailCount = (long)(await _databaseHelper.ExecuteQueryAsync(checkEmailQuery, checkEmailParameters)).Rows[0][0];

                if (emailCount > 0)
                {
                    return BadRequest(new { message = "Email already exists. Please use a different email." });
                }

                // Check if the phone number already exists
                string checkPhoneQuery = "SELECT COUNT(*) FROM users WHERE Phone = @Phone;";
                var checkPhoneParameters = new[] { new MySqlParameter("@Phone", user.Phone) };

                var phoneCount = (long)(await _databaseHelper.ExecuteQueryAsync(checkPhoneQuery, checkPhoneParameters)).Rows[0][0];

                if (phoneCount > 0)
                {
                    return BadRequest(new { message = "Phone number already exists. Please use a different phone number." });
                }

                // Hash the password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

                // Insert user into the database
                string insertQuery = @"
            INSERT INTO users (FirstName, LastName, Email, Phone, PasswordHash, Role)
            VALUES (@FirstName, @LastName, @Email, @Phone, @PasswordHash, @Role)
        ";

                var insertParameters = new[]
                {
            new MySqlParameter("@FirstName", user.FirstName),
            new MySqlParameter("@LastName", user.LastName),
            new MySqlParameter("@Email", user.Email),
            new MySqlParameter("@Phone", user.Phone),
            new MySqlParameter("@PasswordHash", user.PasswordHash),
            new MySqlParameter("@Role", "organizer") // Default role
        };

                await _databaseHelper.ExecuteNonQueryAsync(insertQuery, insertParameters);

                return Ok(new { message = "User registered successfully!" });
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while processing your request.", user });
            }
        }
        [HttpPost("login/email")]
        public async Task<IActionResult> LoginWithEmail([FromBody] EmailLoginRequest request)
        {
            string query = "SELECT * FROM users WHERE Email = @Email;";
            var parameters = new[] { new MySqlParameter("@Email", request.Email) };

            var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

            if (result.Rows.Count == 0)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var user = new User
            {
                Id = Convert.ToInt32(result.Rows[0]["Id"]),
                FirstName = result.Rows[0]["FirstName"].ToString(),
                LastName = result.Rows[0]["LastName"].ToString(),
                Email = result.Rows[0]["Email"].ToString(),
                Phone = result.Rows[0]["Phone"].ToString(),
                PasswordHash = result.Rows[0]["PasswordHash"].ToString(),
                Role = result.Rows[0]["Role"].ToString(),
                DateCreated = Convert.ToDateTime(result.Rows[0]["DateCreated"]),
                IsActive = Convert.ToBoolean(result.Rows[0]["IsActive"]),
                Address = result.Rows[0]["Address"].ToString()
            };

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new { message = "Your account is inactive. Please contact support." });
            }

            // Generate JWT Token
            var token = _jwtGeneratorHelper.GenerateJwtToken(user);

            // Set the token in a cookie
            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true, // Prevent client-side script access
                SameSite = SameSiteMode.None, // Prevent CSRF attacks
                Secure = true, // Ensure cookie is only sent over HTTPS
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"])), // Set expiry
                //Path = "/", // Ensure the cookie is accessible across the entire site
            });

            return Ok(new { message = "Login successful!" });
        }

        [HttpPost("login/phone")]
        public async Task<IActionResult> LoginWithPhone([FromBody] PhoneLoginRequest request)
        {
            string query = "SELECT * FROM users WHERE Phone = @Phone;";
            var parameters = new[] { new MySqlParameter("@Phone", request.Phone) };

            var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

            if (result.Rows.Count == 0)
            {
                return Unauthorized(new { message = "Invalid phone number or password." });
            }

            var user = new User
            {
                Id = Convert.ToInt32(result.Rows[0]["Id"]),
                FirstName = result.Rows[0]["FirstName"].ToString(),
                LastName = result.Rows[0]["LastName"].ToString(),
                Email = result.Rows[0]["Email"].ToString(),
                Phone = result.Rows[0]["Phone"].ToString(),
                PasswordHash = result.Rows[0]["PasswordHash"].ToString(),
                Role = result.Rows[0]["Role"].ToString(),
                DateCreated = Convert.ToDateTime(result.Rows[0]["DateCreated"]),
                IsActive = Convert.ToBoolean(result.Rows[0]["IsActive"]),
                Address = result.Rows[0]["Address"].ToString()
            };

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid phone number or password." });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new { message = "Your account is inactive. Please contact support." });
            }

            // Generate JWT Token
            var token = _jwtGeneratorHelper.GenerateJwtToken(user);

            // Set the token in a cookie
            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true, // Prevent client-side script access
                SameSite = SameSiteMode.None, // Prevent CSRF attacks
                Secure = true, // Ensure cookie is only sent over HTTPS
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"])), // Set expiry
                //Path = "/", // Ensure the cookie is accessible across the entire site
            });

            return Ok(new { message = "Login successful!" });
        }

      

      


        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Delete the JWT cookie by setting an expired cookie
            Response.Cookies.Append("jwt", "", new CookieOptions
            {
                Expires = DateTime.UtcNow.AddDays(-1), // Expire the cookie
                HttpOnly = true,
                SameSite = SameSiteMode.None, // Ensure compatibility with cross-origin requests
                Secure = true, // Ensure this is true if using HTTPS
                Path = "/" // Ensure the cookie path matches
            });

            return Ok(new { message = "Logout successful!" });
        }


        [HttpGet("check-auth")]
        public async Task<IActionResult> CheckAuth()
        {
            // Retrieve the JWT token from the cookie
            var jwtToken = Request.Cookies["jwt"];
            
            if (string.IsNullOrEmpty(jwtToken))
            {
                return Unauthorized(new { message = "No authentication token found." });
            }

            // Validate the token
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

            try
            {
                // Validate the token and extract claims
                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                };

                var principal = tokenHandler.ValidateToken(jwtToken, tokenValidationParameters, out var validatedToken);

                // Extract user information from claims
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userEmail = principal.FindFirst(ClaimTypes.Email)?.Value;
                var userRole = principal.FindFirst(ClaimTypes.Role)?.Value;
                var firstName = principal.FindFirst("FirstName")?.Value;
                var lastName = principal.FindFirst("LastName")?.Value;
                var phone = principal.FindFirst("Phone")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Invalid authentication token." });
                }

                // Fetch user details from the database (optional)
                string query = "SELECT * FROM users WHERE Id = @Id;";
                var parameters = new[] { new MySqlParameter("@Id", userId) };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return Unauthorized(new { message = "User not found." });
                }

                var user = new User
                {
                    Id = Convert.ToInt32(result.Rows[0]["Id"]),
                    FirstName = result.Rows[0]["FirstName"].ToString(),
                    LastName = result.Rows[0]["LastName"].ToString(),
                    Email = result.Rows[0]["Email"].ToString(),
                    Phone = result.Rows[0]["Phone"].ToString(),
                    Role = result.Rows[0]["Role"].ToString(),
                    DateCreated = Convert.ToDateTime(result.Rows[0]["DateCreated"]),
                    IsActive = Convert.ToBoolean(result.Rows[0]["IsActive"]),
                    Address = result.Rows[0]["Address"].ToString()
                };

                // Return user information
                return Ok(new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Phone,
                    user.Role,
                    user.DateCreated,
                    user.IsActive,
                    user.Address
                });
            }
            catch (SecurityTokenException)
            {
                return Unauthorized(new { message = "Invalid or expired authentication token." });
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while processing your request." });
            }
        }
        
        [HttpPost("send-email-verification")]
        public async Task<IActionResult> SendEmailVerification([FromBody] EmailVerificationRequest request)
        {
            try
            {
                string code = _otpHelper.GenerateVerificationCode();
                OTPHelper.verificationCodes[request.Email] = (code, DateTime.UtcNow.AddMinutes(5));

                // Call your Email sending function here (email.js equivalent)
                await EmailHelper.SendEmailAsync(request.Email, "Your verification code", $"Your verification code is: {code}");

                return Ok(new { message = "Verification code sent to email." });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Failed to send verification code." });
            }
        }

        [HttpPost("send-phone-verification")]
        public async Task<IActionResult> SendPhoneVerification([FromBody] PhoneVerificationRequest request)
        {
            try
            {
                string code = _otpHelper.GenerateVerificationCode();
                OTPHelper.verificationCodes[request.Phone] = (code, DateTime.UtcNow.AddMinutes(5));

                bool smsSent = await _smsHelper.SendVerificationCodeAsync(request.Phone, code);

                if (!smsSent)
                {
                    return StatusCode(500, new { message = "Failed to send SMS." });
                }

                return Ok(new { message = "Verification code sent to phone." });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Failed to send verification code." });
            }
        }
        [HttpPost("verify-code")]
        public IActionResult VerifyCode([FromBody] VerificationCheckRequest request)
        {
            if (OTPHelper.verificationCodes.TryGetValue(request.Identifier, out var record))
            {
                if (DateTime.UtcNow > record.Expiry)
                {
                    OTPHelper.verificationCodes.TryRemove(request.Identifier, out _);
                    return BadRequest(new { message = "Verification code expired. Please request again." });
                }

                if (record.Code == request.Code)
                {
                    OTPHelper.verificationCodes.TryRemove(request.Identifier, out _);
                 
                    return Ok(new { message = "Verification successful." });


                }
                else
                {
                    return BadRequest(new { message = "Invalid verification code." });
                }
            }
            else
            {
                return BadRequest(new { message = "No verification code found. Please request again." });
            }
        }
        // Add these new endpoints to AuthenticationController.cs
        [HttpPost("reset-password-email")]
        public async Task<IActionResult> ResetPasswordWithEmail([FromBody] ResetPasswordRequest request)
        {
            try
            {
                // Verify the identifier exists
                string checkUserQuery = "SELECT * FROM users WHERE Email = @Email;";
                var checkUserParameters = new[] { new MySqlParameter("@Email", request.Identifier) };

                var result = await _databaseHelper.ExecuteQueryAsync(checkUserQuery, checkUserParameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "User with this email not found." });
                }

                // Check if new password is same as old password
                var user = new User
                {
                    PasswordHash = result.Rows[0]["PasswordHash"].ToString()
                };

                if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "New password cannot be the same as old password." });
                }

                // Update password
                string newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                string updateQuery = "UPDATE users SET PasswordHash = @PasswordHash WHERE Email = @Email;";
                var updateParameters = new[]
                {
            new MySqlParameter("@PasswordHash", newPasswordHash),
            new MySqlParameter("@Email", request.Identifier)
        };

                await _databaseHelper.ExecuteNonQueryAsync(updateQuery, updateParameters);

                return Ok(new { message = "Password reset successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while resetting password." });
            }
        }

        [HttpPost("reset-password-phone")]
        public async Task<IActionResult> ResetPasswordWithPhone([FromBody] ResetPasswordRequest request)
        {
            try
            {
                // Verify the identifier exists
                string checkUserQuery = "SELECT * FROM users WHERE Phone = @Phone;";
                var checkUserParameters = new[] { new MySqlParameter("@Phone", request.Identifier) };

                var result = await _databaseHelper.ExecuteQueryAsync(checkUserQuery, checkUserParameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "User with this phone number not found." });
                }

                // Check if new password is same as old password
                var user = new User
                {
                    PasswordHash = result.Rows[0]["PasswordHash"].ToString()
                };

                if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "New password cannot be the same as old password." });
                }

                // Update password
                string newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                string updateQuery = "UPDATE users SET PasswordHash = @PasswordHash WHERE Phone = @Phone;";
                var updateParameters = new[]
                {
            new MySqlParameter("@PasswordHash", newPasswordHash),
            new MySqlParameter("@Phone", request.Identifier)
        };

                await _databaseHelper.ExecuteNonQueryAsync(updateQuery, updateParameters);

                return Ok(new { message = "Password reset successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while resetting password." });
            }
        }

        [HttpPost("check-password")]
        public async Task<IActionResult> CheckPassword([FromBody] CheckPasswordRequest request)
        {
            try
            {
                string query = request.Identifier.Contains("@")
                    ? "SELECT PasswordHash FROM users WHERE Email = @Identifier;"
                    : "SELECT PasswordHash FROM users WHERE Phone = @Identifier;";

                var parameters = new[] { new MySqlParameter("@Identifier", request.Identifier) };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "User not found." });
                }

                var currentPasswordHash = result.Rows[0]["PasswordHash"].ToString();
                bool isSamePassword = BCrypt.Net.BCrypt.Verify(request.Password, currentPasswordHash);

                return Ok(new { isSamePassword });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while checking password." });
            }
        }

        // Add this new endpoint to AuthenticationController.cs
        [HttpPost("check-user-exists")]
        public async Task<IActionResult> CheckUserExists([FromBody] CheckUserExistsRequest request)
        {
            try
            {
                string query;
                MySqlParameter[] parameters;

                if (!string.IsNullOrEmpty(request.Email))
                {
                    query = "SELECT COUNT(*) FROM users WHERE Email = @Email;";
                    parameters = new[] { new MySqlParameter("@Email", request.Email) };
                }
                else if (!string.IsNullOrEmpty(request.Phone))
                {
                    query = "SELECT COUNT(*) FROM users WHERE Phone = @Phone;";
                    parameters = new[] { new MySqlParameter("@Phone", request.Phone) };
                }
                else
                {
                    return BadRequest(new { message = "Either email or phone must be provided" });
                }

                var count = (long)(await _databaseHelper.ExecuteQueryAsync(query, parameters)).Rows[0][0];
                return Ok(new { exists = count > 0 });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while checking user existence" });
            }
        }

    }
    // Add this DTO
    public class CheckUserExistsRequest
    {
        public string Email { get; set; }
        public string Phone { get; set; }
    }
    // Add these new DTOs to AuthenticationController.cs
    public class ResetPasswordRequest
    {
        public string Identifier { get; set; } // Email or Phone
        public string NewPassword { get; set; }
    }

    public class CheckPasswordRequest
    {
        public string Identifier { get; set; } // Email or Phone
        public string Password { get; set; }
    }


    // DTOs
    public class EmailVerificationRequest
    {
        public string Email { get; set; }
    }

    public class PhoneVerificationRequest
    {
        public string Phone { get; set; }
    }

    public class VerificationCheckRequest
    {
        public string Identifier { get; set; } // Email or Phone
        public string Code { get; set; }
    }

    // Request Models
    public class EmailLoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class PhoneLoginRequest
    {
        public string Phone { get; set; }
        public string Password { get; set; }
    }


}

