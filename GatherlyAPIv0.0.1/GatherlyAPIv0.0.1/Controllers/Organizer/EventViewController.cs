using Microsoft.AspNetCore.Mvc;
using GatherlyAPIv0._0._1.Helpers;
using MySql.Data.MySqlClient;
using System.Data;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using MySqlX.XDevAPI.Common;
using System.Xml.Linq;

namespace GatherlyAPIv0._0._1.Controllers.Organizer
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventViewController : ControllerBase
    {
        private readonly DatabaseHelper _databaseHelper;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _hostingEnvironment;

        public EventViewController(DatabaseHelper databaseHelper, IConfiguration configuration, IWebHostEnvironment hostingEnvironment)
        {
            _databaseHelper = databaseHelper;
            _configuration = configuration;
            _hostingEnvironment = hostingEnvironment;
        }

        #region Helper Methods
        private List<Dictionary<string, object>> ConvertDataTableToList(DataTable table)
        {
            return table.AsEnumerable().Select(row => table.Columns.Cast<DataColumn>()
                .ToDictionary(col => col.ColumnName, col => row[col])).ToList();
        }

        private int GetUserIdFromToken()
        {
            var jwtToken = Request.Cookies["jwt"];
            if (string.IsNullOrEmpty(jwtToken))
            {
                throw new UnauthorizedAccessException("JWT token not found in cookies.");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Audience"],
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

        private async Task<bool> IsEventOrganizer(int eventId)
        {
            int userId = GetUserIdFromToken();
            string query = "SELECT COUNT(*) FROM events WHERE id = @EventId AND organizer_id = @UserId";
            var parameters = new[]
            {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@UserId", userId)
            };

            var result = await _databaseHelper.ExecuteScalarAsync(query, parameters);
            return Convert.ToInt64(result) > 0;
        }

        private async Task<bool> IsUserInAttachedList(int eventId, int userId)
        {
            string query = @"
                SELECT COUNT(*) 
                FROM event_attendee_lists eal
                JOIN attendees la ON eal.list_id = la.ListId
                WHERE eal.event_id = @EventId AND la.Id = @UserId";

            var parameters = new[]
            {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@UserId", userId)
            };

            var result = await _databaseHelper.ExecuteScalarAsync(query, parameters);
            return Convert.ToInt64(result) > 0;
        }

        private async Task<bool> CanUserViewEvent(int eventId)
        {
            try
            {
                int userId = GetUserIdFromToken();

                // First check if event is public
                string visibilityQuery = "SELECT visibility FROM events WHERE id = @EventId";
                var visibilityResult = await _databaseHelper.ExecuteScalarAsync(visibilityQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                if (visibilityResult == null)
                {
                    return false; // Event doesn't exist
                }

                string visibility = visibilityResult.ToString();

                if (visibility == "public")
                {
                    return true;
                }

                // For private events, check if user is organizer or in attached list
                return await IsEventOrganizer(eventId) || await IsUserInAttachedList(eventId, userId);
            }
            catch
            {
                // If there's any error (like no token), only show public events
                string visibilityQuery = "SELECT visibility FROM events WHERE id = @EventId";
                var visibilityResult = await _databaseHelper.ExecuteScalarAsync(visibilityQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                return visibilityResult?.ToString() == "public";
            }
        }
        #endregion

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] string status = null)
        {
            try
            {
                string baseQuery = "SELECT * FROM events WHERE visibility = 'public' AND status = 'published'";

                // For authenticated users, include their private events and events they're in lists for
                try
                {
                    int userId = GetUserIdFromToken();
                    baseQuery = $@"
                        SELECT e.* FROM events e
                        WHERE (e.visibility = 'public' AND e.status = 'published')
                        OR e.organizer_id = {userId}
                        OR (e.id IN (
                            SELECT eal.event_id 
                            FROM event_attendee_lists eal
                            JOIN attendees la ON eal.list_id = la.ListId
                            WHERE la.Id = {userId}
                        ) AND e.status = 'published')";
                }
                catch
                {
                    // User not authenticated, only show public published events
                }

                if (status != null)
                {
                    // Only apply status filter for organizers viewing their own events
                    try
                    {
                        int userId = GetUserIdFromToken();
                        baseQuery = $@"
                            SELECT e.* FROM events e
                            WHERE (e.organizer_id = {userId} AND (@Status IS NULL OR e.status = @Status))
                            OR ((e.visibility = 'public' OR e.id IN (
                                SELECT eal.event_id 
                                FROM event_attendee_lists eal
                                JOIN attendees la ON eal.list_id = la.ListId
                                WHERE la.Id = {userId}
                            )) AND e.status = 'published')";
                    }
                    catch
                    {
                        // Status parameter ignored for non-authenticated users
                        return BadRequest(new { message = "Status filtering is only available for event organizers" });
                    }
                }

                baseQuery += " ORDER BY start_date DESC";

                var parameters = new List<MySqlParameter>();
                if (status != null)
                {
                    parameters.Add(new MySqlParameter("@Status", status));
                }

                var result = await _databaseHelper.ExecuteQueryAsync(baseQuery, parameters.ToArray());
                var r = ConvertDataTableToList(result);
                return Ok(r);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving events", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(int id)
        {
            try
            {
                bool canView = await CanUserViewEvent(id);
                if (!canView)
                {
                    return NotFound(new { message = "Event not found or you don't have access" });
                }

                // Additional check for non-organizers - event must be published
                try
                {
                    int userId = GetUserIdFromToken();
                    bool isOrganizer = await IsEventOrganizer(id);

                    if (!isOrganizer)
                    {
                        string statusCheckQuery = "SELECT status FROM events WHERE id = @Id";
                        var statusResult = await _databaseHelper.ExecuteScalarAsync(statusCheckQuery,
                            new[] { new MySqlParameter("@Id", id) });

                        if (statusResult?.ToString() != "published")
                        {
                            return NotFound(new { message = "Event not found or you don't have access" });
                        }
                    }
                }
                catch
                {
                    // For non-authenticated users, we already check in CanUserViewEvent that it's public
                    // But let's double-check it's published
                    string statusCheckQuery = "SELECT status FROM events WHERE id = @Id AND visibility = 'public'";
                    var statusResult = await _databaseHelper.ExecuteScalarAsync(statusCheckQuery,
                        new[] { new MySqlParameter("@Id", id) });

                    if (statusResult?.ToString() != "published")
                    {
                        return NotFound(new { message = "Event not found or you don't have access" });
                    }
                }

                string query = @"
                SELECT e.*, 
                (SELECT COUNT(*) FROM event_images WHERE event_id = e.id) AS image_count,
                (SELECT COUNT(*) FROM event_videos WHERE event_id = e.id) AS video_count
                FROM events e WHERE e.id = @Id";

                var result = await _databaseHelper.ExecuteQueryAsync(query,
                    new[] { new MySqlParameter("@Id", id) });

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "Event not found" });
                }

                var r = ConvertDataTableToList(result);
                return Ok(r);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving event", error = ex.Message });
            }
        }

        [HttpGet("{eventId}/media")]
        public async Task<IActionResult> GetEventMedia(int eventId)
        {
            try
            {
                if (!await CanUserViewEvent(eventId))
                {
                    return NotFound(new { message = "Event not found or you don't have access" });
                }

                // Additional check for non-organizers - event must be published
                try
                {
                    int userId = GetUserIdFromToken();
                    bool isOrganizer = await IsEventOrganizer(eventId);

                    if (!isOrganizer)
                    {
                        string statusCheckQuery = "SELECT status FROM events WHERE id = @EventId";
                        var statusResult = await _databaseHelper.ExecuteScalarAsync(statusCheckQuery,
                            new[] { new MySqlParameter("@EventId", eventId) });

                        if (statusResult?.ToString() != "published")
                        {
                            return NotFound(new { message = "Event not found or you don't have access" });
                        }
                    }
                }
                catch
                {
                    // For non-authenticated users, double-check it's published
                    string statusCheckQuery = "SELECT status FROM events WHERE id = @EventId AND visibility = 'public'";
                    var statusResult = await _databaseHelper.ExecuteScalarAsync(statusCheckQuery,
                        new[] { new MySqlParameter("@EventId", eventId) });

                    if (statusResult?.ToString() != "published")
                    {
                        return NotFound(new { message = "Event not found or you don't have access" });
                    }
                }

                // Get images
                string imagesQuery = "SELECT * FROM event_images WHERE event_id = @EventId";
                var images = await _databaseHelper.ExecuteQueryAsync(imagesQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                // Get videos
                string videosQuery = "SELECT * FROM event_videos WHERE event_id = @EventId";
                var videos = await _databaseHelper.ExecuteQueryAsync(videosQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                return Ok(new
                {
                    images = ConvertDataTableToList(images),
                    videos = ConvertDataTableToList(videos)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving media",
                    error = ex.Message
                });
            }
        }
        [HttpGet("{eventId}/attendees/{attendeeId}/status")]
        public async Task<IActionResult> GetAttendeeStatus(int eventId, int attendeeId)
        {
            try
            {
                if (!await CanUserViewEvent(eventId))
                {
                    return NotFound(new { message = "Event not found or you don't have access" });
                }

                string query = @"
            SELECT 
                is_invited AS isInvited,
                is_confirmed AS isConfirmed,
                is_paid AS isPaid
            FROM event_attendees
            WHERE event_id = @EventId AND attendee_id = @AttendeeId";

                var result = await _databaseHelper.ExecuteQueryAsync(query,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@AttendeeId", attendeeId)
                    });

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "Attendee not found for this event" });
                }

                var status = new
                {
                    status = result.Rows[0]["isConfirmed"].ToString() == "1" ? "confirmed" :
                            result.Rows[0]["isInvited"].ToString() == "1" ? "invited" : "pending",
                    isInvited = Convert.ToBoolean(result.Rows[0]["isInvited"]),
                    isConfirmed = Convert.ToBoolean(result.Rows[0]["isConfirmed"]),
                    isPaid = Convert.ToBoolean(result.Rows[0]["isPaid"])
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving attendee status", error = ex.Message });
            }
        }
    }
}