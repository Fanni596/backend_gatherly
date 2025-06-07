using Microsoft.AspNetCore.Mvc;
using GatherlyAPIv0._0._1.Helpers;
using MySql.Data.MySqlClient;
using System.Data;
using System.Threading.Tasks;
using GatherlyAPIv0._0._1.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GatherlyAPIv0._0._1.Models.AttendeesList;

namespace GatherlyAPIv0._0._1.Controllers.Organizer
{
    [Route("api/organizer/[controller]")]
    [ApiController]
    public class AttendeesController : ControllerBase
    {
        private readonly DatabaseHelper _databaseHelper;
        private readonly IConfiguration _configuration;

        public AttendeesController(DatabaseHelper databaseHelper, IConfiguration configuration)
        {
            _databaseHelper = databaseHelper;
            _configuration = configuration;
        }
        private async Task<List<int>> GetEventsAttachedToList(int listId)
        {
            string query = "SELECT event_id FROM event_attendee_lists WHERE list_id = @ListId";
            var parameters = new[] { new MySqlParameter("@ListId", listId) };

            var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);
            var eventIds = new List<int>();

            foreach (DataRow row in result.Rows)
            {
                eventIds.Add(Convert.ToInt32(row["event_id"]));
            }

            return eventIds;
        }
        // Helper method to convert DataTable to List of Dictionaries
        private List<Dictionary<string, object>> ConvertDataTableToList(DataTable table)
        {
            return table.AsEnumerable().Select(row => table.Columns.Cast<DataColumn>()
                .ToDictionary(col => col.ColumnName, col => row[col])).ToList();
        }

        // Helper method to get userId from cookies
        private int GetUserIdFromCookies()
        {
            var jwtToken = Request.Cookies["jwt"];
            if (string.IsNullOrEmpty(jwtToken))
            {
                throw new UnauthorizedAccessException("JWT token not found in cookies.");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

            // Validate the token
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

            var principal = tokenHandler.ValidateToken(jwtToken, tokenValidationParameters, out _);
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID in JWT token.");
            }

            return userId;
        }

        // Helper method to check if email or phone is unique within the same list
        private async Task<bool> IsEmailOrPhoneUnique(int listId, string email, string phone, int? attendeeId = null)
        {
            string query = @"
                SELECT COUNT(*) FROM Attendees 
                WHERE ListId = @ListId 
                AND ((Email IS NOT NULL AND Email = @Email) OR (Phone IS NOT NULL AND Phone = @Phone))
                AND (@AttendeeId IS NULL OR Id != @AttendeeId);
            ";
            var parameters = new[]
            {
                new MySqlParameter("@ListId", listId),
                new MySqlParameter("@Email", email ?? (object)DBNull.Value),
                new MySqlParameter("@Phone", phone ?? (object)DBNull.Value),
                new MySqlParameter("@AttendeeId", attendeeId ?? (object)DBNull.Value)
            };

            var result = await _databaseHelper.ExecuteScalarAsync(query, parameters);
            return Convert.ToInt32(result) == 0; // Return true if email and phone are unique
        }

        // Helper method to check if the user owns the list
        private async Task<bool> DoesUserOwnList(int userId, int listId)
        {
            string query = "SELECT COUNT(*) FROM lists WHERE Id = @ListId AND UserId = @UserId;";
            var parameters = new[]
            {
                new MySqlParameter("@ListId", listId),
                new MySqlParameter("@UserId", userId)
            };

            var result = await _databaseHelper.ExecuteScalarAsync(query, parameters);
            return Convert.ToInt32(result) > 0; // Return true if the user owns the list
        }

        // GET: api/organizer/Attendees/getall?listId={listId}
        [HttpGet("getall")]
        public async Task<IActionResult> GetAllAttendees(int listId) // Add listId as a parameter
        {
            try
            {
                int userId = GetUserIdFromCookies();

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, listId))
                {
                    return BadRequest(new { message = "You do not own the specified list." });
                }

                string query = "SELECT * FROM attendees WHERE ListId = @ListId;";
                var parameters = new[] { new MySqlParameter("@ListId", listId) };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return Ok(new { code = 200, message = "No attendees found for the specified list." });
                }

                // Convert DataTable to List of Dictionaries
                var attendees = ConvertDataTableToList(result);
                return Ok(attendees);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving attendees." });
            }
        }

        // GET: api/organizer/lists/getlistdetails:{listId}
        [HttpGet("getlistdetails:{listId}")]
        public async Task<IActionResult> GetListDetails(int listId)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, listId))
                {
                    return BadRequest(new { message = "You do not own the specified list." });
                }

                string query = "SELECT Name, Description FROM lists WHERE Id = @ListId;";
                var parameters = new[] { new MySqlParameter("@ListId", listId) };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "List not found." });
                }

                var listDetails = new
                {
                    Name = result.Rows[0]["Name"].ToString(),
                    Description = result.Rows[0]["Description"].ToString()
                };

                return Ok(listDetails);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving list details." });
            }
        }

        // GET: api/organizer/Attendees/getby:{id}?listId={listId}
        [HttpGet("getby:{id}")]
        public async Task<IActionResult> GetAttendeeById(int id, int listId) // Add listId as a parameter
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid attendee ID." });
                }

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, listId))
                {
                    return BadRequest(new { message = "You do not own the specified list." });
                }

                string query = @"
                    SELECT * FROM attendees 
                    WHERE Id = @Id AND ListId = @ListId;
                ";
                var parameters = new[]
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@ListId", listId)
                };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "Attendee not found or you do not have access to this attendee." });
                }

                // Convert DataTable to List of Dictionaries
                var attendee = ConvertDataTableToList(result).FirstOrDefault();
                return Ok(attendee);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the attendee." });
            }
        }

        // POST: api/organizer/Attendees/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateAttendee([FromBody] Attendee attendee)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                // Validate input
                if (attendee == null)
                {
                    return BadRequest(new { message = "Attendee data is required." });
                }

                if (string.IsNullOrWhiteSpace(attendee.FirstName) || string.IsNullOrWhiteSpace(attendee.LastName))
                {
                    return BadRequest(new { message = "First name and last name are required." });
                }

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, attendee.ListId))
                {
                    return BadRequest(new { message = "You do not own the specified list." });
                }

                // Check if email or phone is unique within the same list
                if (!await IsEmailOrPhoneUnique(attendee.ListId, attendee.Email, attendee.Phone))
                {
                    return BadRequest(new { message = "Email or phone number must be unique within the same list." });
                }

                string query = @"
            INSERT INTO attendees (FirstName, LastName, Email, Phone, ListId, AllowedPeople, isPaying)
            VALUES (@FirstName, @LastName, @Email, @Phone, @ListId, @AllowedPeople, @IsPaying);
            SELECT LAST_INSERT_ID();";

                var parameters = new[]
                {
            new MySqlParameter("@FirstName", attendee.FirstName),
            new MySqlParameter("@LastName", attendee.LastName),
            new MySqlParameter("@Email", attendee.Email ?? (object)DBNull.Value),
            new MySqlParameter("@Phone", attendee.Phone ?? (object)DBNull.Value),
            new MySqlParameter("@ListId", attendee.ListId),
            new MySqlParameter("@AllowedPeople", attendee.AllowedPeople),
            new MySqlParameter("@IsPaying", attendee.IsPaying)
        };

                // Get the new attendee ID
                var attendeeId = await _databaseHelper.ExecuteScalarAsync(query, parameters);

                // Check if this list is attached to any events
                var eventIds = await GetEventsAttachedToList(attendee.ListId);

                // If list is attached to events, add this attendee to those events
                if (eventIds.Any())
                {
                    foreach (var eventId in eventIds)
                    {
                        string insertEventAttendeeQuery = @"
                    INSERT INTO event_attendees (attendee_id, event_id, list_id, visibility, is_added, is_invited, is_confirmed, is_paid)
                    VALUES (@AttendeeId, @EventId, @ListId, 'visible', 1, 0, 0, 0)
                    ON DUPLICATE KEY UPDATE is_added = 1;";

                        var eventAttendeeParams = new[]
                        {
                    new MySqlParameter("@AttendeeId", attendeeId),
                    new MySqlParameter("@EventId", eventId),
                    new MySqlParameter("@ListId", attendee.ListId)
                };

                        await _databaseHelper.ExecuteNonQueryAsync(insertEventAttendeeQuery, eventAttendeeParams);
                    }
                }

                return Ok(new { message = "Attendee created successfully!", attendeeId = attendeeId });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the attendee." });
            }
        }

        // PUT: api/organizer/Attendees/updateby:{id}
        [HttpPut("updateby:{id}")]
        public async Task<IActionResult> UpdateAttendee(int id, [FromBody] Attendee attendee)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                // Validate input
                if (attendee == null)
                {
                    return BadRequest(new { message = "Attendee data is required." });
                }

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid attendee ID." });
                }

                if (string.IsNullOrWhiteSpace(attendee.FirstName) || string.IsNullOrWhiteSpace(attendee.LastName))
                {
                    return BadRequest(new { message = "First name and last name are required." });
                }

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, attendee.ListId))
                {
                    return BadRequest(new { message = "You do not own the specified list." });
                }

                // Check if email or phone is unique within the same list (excluding the current attendee)
                if (!await IsEmailOrPhoneUnique(attendee.ListId, attendee.Email, attendee.Phone, id))
                {
                    return BadRequest(new { message = "Email or phone number must be unique within the same list." });
                }

                string query = @"
            UPDATE attendees
            SET FirstName = @FirstName, 
                LastName = @LastName, 
                Email = @Email, 
                Phone = @Phone, 
                ListId = @ListId, 
                AllowedPeople = @AllowedPeople,
                isPaying = @IsPaying
            WHERE Id = @Id AND ListId = @ListId;";

                var parameters = new[]
                {
            new MySqlParameter("@Id", id),
            new MySqlParameter("@FirstName", attendee.FirstName),
            new MySqlParameter("@LastName", attendee.LastName),
            new MySqlParameter("@Email", attendee.Email ?? (object)DBNull.Value),
            new MySqlParameter("@Phone", attendee.Phone ?? (object)DBNull.Value),
            new MySqlParameter("@ListId", attendee.ListId),
            new MySqlParameter("@AllowedPeople", attendee.AllowedPeople),
            new MySqlParameter("@IsPaying", attendee.IsPaying)
        };

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(query, parameters);

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "Attendee not found or you do not have access to this attendee." });
                }

                // Check if this list is attached to any events and update those records
                var eventIds = await GetEventsAttachedToList(attendee.ListId);

                if (eventIds.Any())
                {
                    foreach (var eventId in eventIds)
                    {
                        string updateEventAttendeeQuery = @"
                    UPDATE event_attendees 
                    SET 
                        attendee_id = @AttendeeId,
                        list_id = @ListId
                    WHERE 
                        attendee_id = @AttendeeId AND 
                        event_id = @EventId AND 
                        list_id = @ListId;";

                        var eventAttendeeParams = new[]
                        {
                    new MySqlParameter("@AttendeeId", id),
                    new MySqlParameter("@EventId", eventId),
                    new MySqlParameter("@ListId", attendee.ListId)
                };

                        await _databaseHelper.ExecuteNonQueryAsync(updateEventAttendeeQuery, eventAttendeeParams);
                    }
                }

                return Ok(new { message = "Attendee updated successfully!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the attendee." });
            }
        }

        // DELETE: api/organizer/Attendees/deleteby:{id}
        [HttpDelete("deleteby:{id}")]
        public async Task<IActionResult> DeleteAttendee(int id)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid attendee ID." });
                }

                // First get the listId and check ownership
                string getListIdQuery = "SELECT ListId FROM attendees WHERE Id = @Id;";
                var getListIdParameters = new[] { new MySqlParameter("@Id", id) };

                var listIdResult = await _databaseHelper.ExecuteScalarAsync(getListIdQuery, getListIdParameters);

                if (listIdResult == null || !int.TryParse(listIdResult.ToString(), out var listId))
                {
                    return NotFound(new { message = "Attendee not found." });
                }

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, listId))
                {
                    return BadRequest(new { message = "You do not own the list associated with this attendee." });
                }

                // First delete from event_attendees if this list is attached to any events
                var eventIds = await GetEventsAttachedToList(listId);
                if (eventIds.Any())
                {
                    string deleteEventAttendeesQuery = "DELETE FROM event_attendees WHERE attendee_id = @AttendeeId;";
                    await _databaseHelper.ExecuteNonQueryAsync(deleteEventAttendeesQuery,
                        new[] { new MySqlParameter("@AttendeeId", id) });
                }

                // Then delete from Attendees
                string deleteQuery = "DELETE FROM attendees WHERE Id = @Id AND ListId = @ListId;";
                var deleteParameters = new[]
                {
            new MySqlParameter("@Id", id),
            new MySqlParameter("@ListId", listId)
        };

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(deleteQuery, deleteParameters);

                if (rowsAffected == 0)
                {
                    return Ok(new { message = "Attendee not found or you do not have access to this attendee." });
                }

                return Ok(new { message = "Attendee deleted successfully!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the attendee." });
            }
        }
        // Add this new endpoint to get attendee statistics
        [HttpGet("stats")]
        public async Task<IActionResult> GetAttendeeStats(int listId)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                // Check if the user owns the list
                if (!await DoesUserOwnList(userId, listId))
                {
                    return BadRequest(new { message = "You do not own the specified list." });
                }

                string query = @"
            SELECT 
                COUNT(*) as TotalAttendees,
                SUM(AllowedPeople) as TotalAllowedPeople,
                COUNT(DISTINCT Email) as UniqueEmails,
                COUNT(DISTINCT Phone) as UniquePhones
            FROM attendees 
            WHERE ListId = @ListId;
        ";

                var parameters = new[] { new MySqlParameter("@ListId", listId) };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return Ok(new
                    {
                        TotalAttendees = 0,
                        TotalAllowedPeople = 0,
                        UniqueEmails = 0,
                        UniquePhones = 0
                    });
                }

                var stats = new
                {
                    TotalAttendees = Convert.ToInt32(result.Rows[0]["TotalAttendees"]),
                    TotalAllowedPeople = Convert.ToInt32(result.Rows[0]["TotalAllowedPeople"]),
                    UniqueEmails = Convert.ToInt32(result.Rows[0]["UniqueEmails"]),
                    UniquePhones = Convert.ToInt32(result.Rows[0]["UniquePhones"])
                };

                return Ok(stats);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving attendee statistics." });
            }
        }


        // Add a new endpoint for attendee registration
        [HttpPost("register/{eventId}")]
        public async Task<IActionResult> RegisterAttendee(int eventId, [FromBody] Attendee attendee)
        {
            try
            {
                // 1. Get the default list for this event
                string getListQuery = @"
            SELECT list_id FROM event_attendee_lists 
            WHERE event_id = @EventId 
            ORDER BY list_id LIMIT 1";

                var listResult = await _databaseHelper.ExecuteScalarAsync(getListQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                if (listResult == null)
                {
                    return BadRequest(new { message = "No attendee list found for this event" });
                }

                int listId = Convert.ToInt32(listResult);

                // 2. Insert the attendee
                string insertAttendeeQuery = @"
            INSERT INTO attendees 
            (FirstName, LastName, Email, Phone, ListId, AllowedPeople, IsPaying)
            VALUES 
            (@FirstName, @LastName, @Email, @Phone, @ListId, @AllowedPeople, @IsPaying);
            SELECT LAST_INSERT_ID();
        ";

                var parameters = new[]
                {
            new MySqlParameter("@FirstName", attendee.FirstName),
            new MySqlParameter("@LastName", attendee.LastName),
            new MySqlParameter("@Email", attendee.Email),
            new MySqlParameter("@Phone", attendee.Phone),
            new MySqlParameter("@ListId", listId),
            new MySqlParameter("@AllowedPeople", attendee.AllowedPeople),
            new MySqlParameter("@IsPaying", attendee.IsPaying)
        };

                var attendeeId = await _databaseHelper.ExecuteScalarAsync(insertAttendeeQuery, parameters);

                return Ok(new
                {
                    message = "Attendee registered successfully!",
                    attendeeId = attendeeId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while registering attendee." });
            }
        }
    }

}