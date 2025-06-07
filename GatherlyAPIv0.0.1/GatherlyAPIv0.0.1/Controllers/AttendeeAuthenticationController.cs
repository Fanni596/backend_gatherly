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
    public class AttendeeAuthenticationController : ControllerBase
    {
        private readonly DatabaseHelper _databaseHelper;
        private readonly IConfiguration _configuration;
        private readonly SmsHelper _smsHelper;
        JWTgeneratorHelper _jwtGeneratorHelper;
        OTPHelper _otpHelper;
        public AttendeeAuthenticationController(
     DatabaseHelper databaseHelper,
     IConfiguration configuration,
     SmsHelper smsHelper,
     JWTgeneratorHelper jWTgeneratorHelper,
     OTPHelper otpHelper)
        {
            _databaseHelper = databaseHelper;
            _configuration = configuration;
            _smsHelper = smsHelper;
            _jwtGeneratorHelper = jWTgeneratorHelper;
            _otpHelper = otpHelper;
        }
        [HttpPost("logout")]
        public IActionResult AttendeeLogout()
        {
            // Clear the attendee JWT cookie
            Response.Cookies.Append(
                "attendee_jwt",
                "",
                new CookieOptions
                {
                    Expires = DateTime.UtcNow.AddDays(-1),
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None
                }
            );

            return Ok(new { message = "Attendee logged out successfully" });
        }

        [HttpGet("event-access/{eventId}")]
        public async Task<IActionResult> CheckEventAccess(int eventId)
        {
            try
            {
                // Get attendee identifier from JWT
                var jwtToken = Request.Cookies["attendee_jwt"];
                if (string.IsNullOrEmpty(jwtToken))
                {
                    return Unauthorized(new { message = "Attendee not authenticated" });
                }

                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtSettings = _configuration.GetSection("Jwt");
                var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

                var principal = tokenHandler.ValidateToken(jwtToken, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                }, out _);

                var attendeeIdentifier = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(attendeeIdentifier))
                {
                    return Unauthorized(new { message = "Invalid attendee token" });
                }

                // Check if attendee has access to the event
                // This could be through:
                // 1. Being in an attendee list attached to the event
                // 2. Having a valid ticket
                // 3. Event being public

                // Example implementation checking attendee lists:
                string query = @"
                    SELECT COUNT(*) 
                    FROM event_attendee_lists eal
                    JOIN attendees a ON eal.list_id = a.ListId
                    WHERE eal.event_id = @EventId 
                    AND (a.Email = @Identifier OR a.Phone = @Identifier)";

                var parameters = new[]
                {
                    new MySqlParameter("@EventId", eventId),
                    new MySqlParameter("@Identifier", attendeeIdentifier)
                };

                var count = (long)(await _databaseHelper.ExecuteScalarAsync(query, parameters));

                if (count > 0)
                {
                    return Ok(new { hasAccess = true });
                }

                // Additional check if event is public
                query = "SELECT visibility FROM events WHERE id = @EventId";
                var visibility = (string)(await _databaseHelper.ExecuteScalarAsync(query,
                    new[] { new MySqlParameter("@EventId", eventId) }));

                if (visibility == "public")
                {
                    return Ok(new { hasAccess = true });
                }

                return Ok(new { hasAccess = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking event access", error = ex.Message });
            }
        }

        [HttpGet("check-auth")]
            public async Task<IActionResult> CheckAttendeeAuth()
            {
                // Retrieve the JWT token from the cookie
                var jwtToken = Request.Cookies["attendee_jwt"];

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

                    // Extract attendee information from claims
                    var attendeeIdentifier = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var attendeeRole = principal.FindFirst(ClaimTypes.Role)?.Value;

                    if (string.IsNullOrEmpty(attendeeIdentifier))
                    {
                        return Unauthorized(new { message = "Invalid authentication token." });
                    }

                    // For attendees, we can either:
                    // 1. Look up in attendees table if we want full details
                    // 2. Just return basic info from the token (simpler approach shown here)

                    return Ok(new
                    {
                        Identifier = attendeeIdentifier,
                        Role = attendeeRole ?? "Attendee",
                        IsAuthenticated = true
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

        [HttpPost("attendee-verify-code")]
        public async Task<IActionResult> VerifyAttendeeOtp([FromBody] AttendeeOtpVerificationRequest request)
        {
            try
            {
                // 1. Check if verification code exists for this identifier
                if (!OTPHelper.verificationCodes.TryGetValue(request.Identifier, out var record))
                {
                    return BadRequest(new { message = "No verification code found for this identifier. Please request a new code." });
                }

                // 2. Check if code has expired
                if (DateTime.UtcNow > record.Expiry)
                {
                    OTPHelper.verificationCodes.TryRemove(request.Identifier, out _);
                    return BadRequest(new { message = "Verification code expired. Please request a new code." });
                }

                // 3. Verify the code matches
                if (record.Code != request.OtpCode)
                {
                    return BadRequest(new { message = "Invalid verification code. Please try again." });
                }

                // 4. Code is valid - proceed with authentication

                // Remove the used code from storage
                OTPHelper.verificationCodes.TryRemove(request.Identifier, out _);

                // Generate JWT token
                var token = _jwtGeneratorHelper.GenerateJwtTokenAttendee(request.Identifier);

                // Set secure HTTP-only cookie with the JWT
                Response.Cookies.Append(
                    "attendee_jwt",
                    token,
                    new CookieOptions
                    {
                        HttpOnly = true,       // Prevent XSS attacks
                        Secure = true,         // Only send over HTTPS
                        SameSite = SameSiteMode.None,  // Allow cross-site requests
                        Expires = DateTime.UtcNow.AddMinutes(
                            Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"])
                        )
                    }
                );

                // Return success response
                return Ok(new
                {
                    message = "Attendee authenticated successfully",
                    identifier = request.Identifier,
                    role = "Attendee"
                });
            }
            catch (Exception ex)
            {
                // Log the exception here (implementation not shown)
                return StatusCode(500, new
                {
                    message = "An error occurred while verifying your code",
                    error = ex.Message
                });
            }
        }






        // In AttendeeAuthenticationController.cs

        [HttpGet("verify-invitation/{eventId}/{attendeeIdentifier}")]
        public async Task<IActionResult> VerifyInvitationLink(int eventId, string attendeeIdentifier)
        {
            try
            {
                // 1. Check if event exists
                string query = "SELECT id FROM events WHERE id = @EventId";
                var eventExists = await _databaseHelper.ExecuteScalarAsync(query,
                    new MySqlParameter("@EventId", eventId));

                if (eventExists == null)
                {
                    return NotFound(new { message = "Event not found" });
                }

                // 2. Check if attendee is in any list attached to this event
                query = @"
            SELECT COUNT(*) 
            FROM event_attendee_lists eal
            JOIN attendees a ON eal.list_id = a.ListId
            WHERE eal.event_id = @EventId 
            AND (a.Email = @Identifier OR a.Phone = @Identifier)";

                var parameters = new[]
                {
            new MySqlParameter("@EventId", eventId),
            new MySqlParameter("@Identifier", attendeeIdentifier)
        };

                var count = (long)(await _databaseHelper.ExecuteScalarAsync(query, parameters));

                if (count == 0)
                {
                    return Unauthorized(new { message = "Attendee not invited to this event" });
                }

                // 3. Get attendee details
                query = @"
            SELECT a.Id, a.FirstName, a.LastName, a.Email, a.Phone
            FROM attendees a
            JOIN event_attendee_lists eal ON a.ListId = eal.list_id
            WHERE eal.event_id = @EventId
            AND (a.Email = @Identifier OR a.Phone = @Identifier)
            LIMIT 1";

                var attendeeData = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (attendeeData.Rows.Count == 0)
                {
                    return NotFound(new { message = "Attendee not found" });
                }

                var attendee = attendeeData.Rows[0];

                return Ok(new
                {
                    attendeeId = attendee["Id"],
                    firstName = attendee["FirstName"],
                    lastName = attendee["LastName"],
                    email = attendee["Email"],
                    phone = attendee["Phone"],
                    verificationMethods = new[] { "otp", "biometric" } // Available verification methods
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error verifying invitation", error = ex.Message });
            }
        }

        [HttpPost("verify-biometric/{eventId}/{attendeeId}")]
        public async Task<IActionResult> VerifyBiometric(int eventId, int attendeeId)
        {
            try
            {
                // In a real implementation, you would:
                // 1. Verify the biometric data sent from the client
                // 2. Check if the biometric matches the stored data for this attendee
                // For this example, we'll assume verification is successful

                // Update attendee status in event_attendees table
                string query = @"
            INSERT INTO event_attendees (attendee_id, event_id, list_id, is_confirmed, date_updated)
            VALUES (@AttendeeId, @EventId, 
                   (SELECT ListId FROM attendees WHERE Id = @AttendeeId), 
                   1, NOW())
            ON DUPLICATE KEY UPDATE 
                is_confirmed = 1,
                date_updated = NOW()";

                var parameters = new[]
                {
            new MySqlParameter("@AttendeeId", attendeeId),
            new MySqlParameter("@EventId", eventId)
        };

                await _databaseHelper.ExecuteNonQueryAsync(query, parameters);

                return Ok(new
                {
                    success = true,
                    message = "Biometric verification successful",
                    attendeeId,
                    eventId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error during biometric verification", error = ex.Message });
            }
        }


        [HttpGet("verification-status/{eventId}/{attendeeId}")]
        public async Task<IActionResult> GetVerificationStatus(int eventId, int attendeeId)
        {
            try
            {
                string query = @"
            SELECT is_confirmed, is_invited, is_paid
            FROM event_attendees
            WHERE event_id = @EventId AND attendee_id = @AttendeeId";

                var parameters = new[]
                {
            new MySqlParameter("@EventId", eventId),
            new MySqlParameter("@AttendeeId", attendeeId)
        };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return Ok(new { isVerified = false, status = "not_registered" });
                }

                var row = result.Rows[0];
                bool isConfirmed = Convert.ToBoolean(row["is_confirmed"]);

                return Ok(new
                {
                    isVerified = isConfirmed,
                    status = isConfirmed ? "confirmed" : "pending"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking verification status", error = ex.Message });
            }
        }

        [HttpPost("{eventId}/attendees/{attendeeId}/confirm")]

        public async Task<IActionResult> MarkAsConfirmed(int eventId, int attendeeId)
        {
            try
            {
               

                string query = @"
            UPDATE event_attendees 
            SET is_confirmed = 1 
            WHERE event_id = @EventId AND attendee_id = @AttendeeId";

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(query,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@AttendeeId", attendeeId)
                    });

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "Attendee not found for this event" });
                }

                return Ok(new { message = "Attendee marked as confirmed" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating attendee status", error = ex.Message });
            }
        }
        [HttpPost("verify-facial/{eventId}/{attendeeId}")]
        public async Task<IActionResult> VerifyFacialData(int eventId, int attendeeId, [FromBody] FacialVerificationRequest request)
        {
            try
            {
                // 1. Verify the attendee belongs to the event
                string query = @"SELECT COUNT(*) FROM event_attendees 
                        WHERE event_id = @EventId AND attendee_id = @AttendeeId";

                var parameters = new[]
                {
            new MySqlParameter("@EventId", eventId),
            new MySqlParameter("@AttendeeId", attendeeId)
        };

                var count = (long)(await _databaseHelper.ExecuteScalarAsync(query, parameters));

                if (count == 0)
                {
                    return BadRequest(new { message = "Attendee not found for this event" });
                }

                // 2. Store facial data
                query = @"INSERT INTO attendee_facial_data (event_id, attendee_id, facial_data)
                 VALUES (@EventId, @AttendeeId, @FacialData)
                 ON DUPLICATE KEY UPDATE facial_data = @FacialData";

                var facialDataParam = new MySqlParameter("@FacialData", JsonSerializer.Serialize(request.FacialData));

                await _databaseHelper.ExecuteNonQueryAsync(query,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@AttendeeId", attendeeId),
                facialDataParam
                    });

                // 3. Mark attendee as confirmed
                query = @"UPDATE event_attendees SET is_confirmed = 1 
                 WHERE event_id = @EventId AND attendee_id = @AttendeeId";

                await _databaseHelper.ExecuteNonQueryAsync(query, parameters);

                return Ok(new { message = "Facial data stored and verification complete" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error verifying facial data", error = ex.Message });
            }
        }


    }
        public class FacialVerificationRequest
        {
            public object FacialData { get; set; } // This will store the facial recognition data
        }

    public class AttendeeOtpVerificationRequest
    {
        public string Identifier { get; set; } // Email or phone number
        public string OtpCode { get; set; }
    }
}
