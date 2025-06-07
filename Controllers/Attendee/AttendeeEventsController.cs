using GatherlyAPIv0._0._1.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[Route("api/[controller]")]
[ApiController]
public class AttendeeEventsController : ControllerBase
{
    private readonly DatabaseHelper _databaseHelper;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public AttendeeEventsController(DatabaseHelper databaseHelper, IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
    {
        _databaseHelper = databaseHelper;
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    private List<Dictionary<string, object>> ConvertDataTableToList(DataTable table)
    {
        return table.AsEnumerable().Select(row => table.Columns.Cast<DataColumn>()
            .ToDictionary(col => col.ColumnName, col => row[col])).ToList();
    }

    private string GetCurrentUserIdentifier()
    {
        try
        {
            var jwtToken = Request.Cookies["attendee_jwt"];
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
            var userIdentifier = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdentifier))
            {
                throw new UnauthorizedAccessException("User identifier not found in JWT token.");
            }

            return userIdentifier;
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException("Invalid token", ex);
        }
    }

    private string GetCurrentUserIdentifierOrNull()
    {
        try
        {
            return GetCurrentUserIdentifier();
        }
        catch (UnauthorizedAccessException)
        {
            return null;
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPublishedEvents([FromQuery] string search = "", [FromQuery] string category = "", [FromQuery] string type = "")
    {
        try
        {
            string query = @"
                SELECT 
                    e.*, 
                    (SELECT COUNT(*) FROM event_images WHERE event_id = e.id) AS image_count,
                    (SELECT COUNT(*) FROM event_videos WHERE event_id = e.id) AS video_count,
                    (SELECT COUNT(*) FROM user_event_preferences WHERE event_id = e.id AND is_liked = 1) AS like_count,
                    (SELECT COUNT(*) FROM user_event_preferences WHERE event_id = e.id AND is_saved = 1) AS save_count
                FROM events e 
                WHERE e.status = 'published' AND (e.visibility = 'public' OR e.visibility = 'unlisted')";

            var parameters = new List<MySqlParameter>();

            if (!string.IsNullOrEmpty(search))
            {
                query += " AND (e.title LIKE @Search OR e.description LIKE @Search OR e.location LIKE @Search OR e.organizer_name LIKE @Search)";
                parameters.Add(new MySqlParameter("@Search", $"%{search}%"));
            }

            if (!string.IsNullOrEmpty(category) && category != "all")
            {
                query += " AND e.category = @Category";
                parameters.Add(new MySqlParameter("@Category", category));
            }

            if (!string.IsNullOrEmpty(type) && type != "all")
            {
                query += " AND e.ticket_type = @Type";
                parameters.Add(new MySqlParameter("@Type", type));
            }

            query += " ORDER BY e.start_date DESC";

            var result = await _databaseHelper.ExecuteQueryAsync(query, parameters.ToArray());
            var events = ConvertDataTableToList(result);

            var userIdentifier = GetCurrentUserIdentifierOrNull();
            if (userIdentifier != null)
            {
                foreach (var evt in events)
                {
                    var prefQuery = @"
                        SELECT is_saved, is_liked 
                        FROM user_event_preferences 
                        WHERE user_identifier = @UserIdentifier
                        AND event_id = @EventId";

                    var prefResult = await _databaseHelper.ExecuteQueryAsync(prefQuery,
                        new[] {
                            new MySqlParameter("@UserIdentifier", userIdentifier),
                            new MySqlParameter("@EventId", evt["id"])
                        });

                    if (prefResult.Rows.Count > 0)
                    {
                        evt["is_saved"] = prefResult.Rows[0]["is_saved"];
                        evt["is_liked"] = prefResult.Rows[0]["is_liked"];
                    }
                    else
                    {
                        evt["is_saved"] = false;
                        evt["is_liked"] = false;
                    }
                }
            }

            return Ok(events);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving events", error = ex.Message });
        }
    }

    [HttpGet("private")]
    public async Task<IActionResult> GetPrivateEvents()
    {
        try
        {
            var userIdentifier = GetCurrentUserIdentifier();

            string query = @"
                SELECT DISTINCT e.*, 
                    (SELECT COUNT(*) FROM event_images WHERE event_id = e.id) AS image_count,
                    (SELECT COUNT(*) FROM event_videos WHERE event_id = e.id) AS video_count
                FROM events e
                JOIN event_attendee_lists eal ON e.id = eal.event_id
                JOIN lists l ON eal.list_id = l.Id
                JOIN attendees a ON l.Id = a.ListId
                WHERE e.status = 'published' 
                AND e.visibility = 'private'
                AND (a.Email = @UserIdentifier OR a.Phone = @UserIdentifier)
                ORDER BY e.start_date DESC";

            var result = await _databaseHelper.ExecuteQueryAsync(query,
                new[] { new MySqlParameter("@UserIdentifier", userIdentifier) });

            var events = ConvertDataTableToList(result);

            // Add user preferences
            foreach (var evt in events)
            {
                var prefQuery = @"
                    SELECT is_saved, is_liked 
                    FROM user_event_preferences 
                    WHERE user_identifier = @UserIdentifier
                    AND event_id = @EventId";

                var prefResult = await _databaseHelper.ExecuteQueryAsync(prefQuery,
                    new[] {
                        new MySqlParameter("@UserIdentifier", userIdentifier),
                        new MySqlParameter("@EventId", evt["id"])
                    });

                if (prefResult.Rows.Count > 0)
                {
                    evt["is_saved"] = prefResult.Rows[0]["is_saved"];
                    evt["is_liked"] = prefResult.Rows[0]["is_liked"];
                }
                else
                {
                    evt["is_saved"] = false;
                    evt["is_liked"] = false;
                }
            }

            return Ok(events);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "User not authenticated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving private events", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPublishedEventById(int id)
    {
        try
        {
            string query = @"
                SELECT 
                    e.*, 
                    (SELECT COUNT(*) FROM event_images WHERE event_id = e.id) AS image_count,
                    (SELECT COUNT(*) FROM event_videos WHERE event_id = e.id) AS video_count,
                    (SELECT COUNT(*) FROM user_event_preferences WHERE event_id = e.id AND is_liked = 1) AS like_count,
                    (SELECT COUNT(*) FROM user_event_preferences WHERE event_id = e.id AND is_saved = 1) AS save_count
                FROM events e 
                WHERE e.id = @Id AND e.status = 'published'";

            var result = await _databaseHelper.ExecuteQueryAsync(query,
                new[] { new MySqlParameter("@Id", id) });

            if (result.Rows.Count == 0)
            {
                return NotFound(new { message = "Event not found" });
            }

            var eventData = ConvertDataTableToList(result)[0];
            var visibility = eventData["visibility"].ToString();

            // Check access for private events
            if (visibility == "private")
            {
                var userIdentifier = GetCurrentUserIdentifierOrNull();
                if (userIdentifier == null)
                {
                    return Unauthorized(new { message = "Authentication required" });
                }

                var accessCheckQuery = @"
                    SELECT COUNT(*) as has_access
                    FROM event_attendee_lists eal
                    JOIN lists l ON eal.list_id = l.Id
                    JOIN attendees a ON l.Id = a.ListId
                    WHERE eal.event_id = @EventId
                    AND (a.Email = @UserIdentifier OR a.Phone = @UserIdentifier)";

                var accessResult = await _databaseHelper.ExecuteQueryAsync(accessCheckQuery,
                    new[] {
                        new MySqlParameter("@EventId", id),
                        new MySqlParameter("@UserIdentifier", userIdentifier)
                    });

                if (Convert.ToInt32(accessResult.Rows[0]["has_access"]) == 0)
                {
                    return NotFound(new { message = "Event not found" });
                }
            }

            // Add user preferences if authenticated
            var userIdentifierForPrefs = GetCurrentUserIdentifierOrNull();
            if (userIdentifierForPrefs != null)
            {
                var prefQuery = @"
                    SELECT is_saved, is_liked 
                    FROM user_event_preferences 
                    WHERE user_identifier = @UserIdentifier
                    AND event_id = @EventId";

                var prefResult = await _databaseHelper.ExecuteQueryAsync(prefQuery,
                    new[] {
                        new MySqlParameter("@UserIdentifier", userIdentifierForPrefs),
                        new MySqlParameter("@EventId", id)
                    });

                if (prefResult.Rows.Count > 0)
                {
                    eventData["is_saved"] = prefResult.Rows[0]["is_saved"];
                    eventData["is_liked"] = prefResult.Rows[0]["is_liked"];
                }
                else
                {
                    eventData["is_saved"] = false;
                    eventData["is_liked"] = false;
                }
            }

            return Ok(eventData);
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
            // First check if event exists and is published
            string eventCheckQuery = "SELECT id, visibility FROM events WHERE id = @EventId AND status = 'published'";
            var eventCheck = await _databaseHelper.ExecuteQueryAsync(eventCheckQuery,
                new[] { new MySqlParameter("@EventId", eventId) });

            if (eventCheck.Rows.Count == 0)
            {
                return NotFound(new { message = "Event not found" });
            }

            var visibility = eventCheck.Rows[0]["visibility"].ToString();

            // Check access for private events
            if (visibility == "private")
            {
                var userIdentifier = GetCurrentUserIdentifierOrNull();
                if (userIdentifier == null)
                {
                    return Unauthorized(new { message = "Authentication required" });
                }

                var accessCheckQuery = @"
                    SELECT COUNT(*) as has_access
                    FROM event_attendee_lists eal
                    JOIN lists l ON eal.list_id = l.Id
                    JOIN attendees a ON l.Id = a.ListId
                    WHERE eal.event_id = @EventId
                    AND (a.Email = @UserIdentifier OR a.Phone = @UserIdentifier)";

                var accessResult = await _databaseHelper.ExecuteQueryAsync(accessCheckQuery,
                    new[] {
                        new MySqlParameter("@EventId", eventId),
                        new MySqlParameter("@UserIdentifier", userIdentifier)
                    });

                if (Convert.ToInt32(accessResult.Rows[0]["has_access"]) == 0)
                {
                    return NotFound(new { message = "Event not found" });
                }
            }

            // Get images
            string imagesQuery = "SELECT * FROM event_images WHERE event_id = @EventId ORDER BY sort_order, is_thumbnail DESC";
            var images = await _databaseHelper.ExecuteQueryAsync(imagesQuery,
                new[] { new MySqlParameter("@EventId", eventId) });

            // Get videos
            string videosQuery = "SELECT * FROM event_videos WHERE event_id = @EventId ORDER BY id";
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
            return StatusCode(500, new { message = "Error retrieving media", error = ex.Message });
        }
    }

    [HttpPost("{eventId}/save")]
    public async Task<IActionResult> ToggleSaveEvent(int eventId)
    {
        try
        {
            var userIdentifier = GetCurrentUserIdentifier();

            // Check if event exists and is published
            string eventCheckQuery = "SELECT id FROM events WHERE id = @EventId AND status = 'published'";
            var eventCheck = await _databaseHelper.ExecuteQueryAsync(eventCheckQuery,
                new[] { new MySqlParameter("@EventId", eventId) });

            if (eventCheck.Rows.Count == 0)
            {
                return NotFound(new { message = "Event not found" });
            }

            // Check if preference exists
            string checkQuery = "SELECT is_saved FROM user_event_preferences WHERE user_identifier = @UserIdentifier AND event_id = @EventId";
            var checkResult = await _databaseHelper.ExecuteQueryAsync(checkQuery,
                new[] {
                    new MySqlParameter("@UserIdentifier", userIdentifier),
                    new MySqlParameter("@EventId", eventId)
                });

            if (checkResult.Rows.Count > 0)
            {
                bool isSaved = Convert.ToBoolean(checkResult.Rows[0]["is_saved"]);
                string toggleQuery = "UPDATE user_event_preferences SET is_saved = @IsSaved WHERE user_identifier = @UserIdentifier AND event_id = @EventId";
                await _databaseHelper.ExecuteNonQueryAsync(toggleQuery,
                    new[] {
                        new MySqlParameter("@UserIdentifier", userIdentifier),
                        new MySqlParameter("@EventId", eventId),
                        new MySqlParameter("@IsSaved", !isSaved)
                    });

                return Ok(new { isSaved = !isSaved });
            }
            else
            {
                string insertQuery = "INSERT INTO user_event_preferences (user_identifier, event_id, is_saved) VALUES (@UserIdentifier, @EventId, 1)";
                await _databaseHelper.ExecuteNonQueryAsync(insertQuery,
                    new[] {
                        new MySqlParameter("@UserIdentifier", userIdentifier),
                        new MySqlParameter("@EventId", eventId)
                    });

                return Ok(new { isSaved = true });
            }
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Please sign in to save events" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error toggling save status", error = ex.Message });
        }
    }

    [HttpPost("{eventId}/like")]
    public async Task<IActionResult> ToggleLikeEvent(int eventId)
    {
        try
        {
            var userIdentifier = GetCurrentUserIdentifier();

            // Check if event exists and is published
            string eventCheckQuery = "SELECT id FROM events WHERE id = @EventId AND status = 'published'";
            var eventCheck = await _databaseHelper.ExecuteQueryAsync(eventCheckQuery,
                new[] { new MySqlParameter("@EventId", eventId) });

            if (eventCheck.Rows.Count == 0)
            {
                return NotFound(new { message = "Event not found" });
            }

            // Check if preference exists
            string checkQuery = "SELECT is_liked FROM user_event_preferences WHERE user_identifier = @UserIdentifier AND event_id = @EventId";
            var checkResult = await _databaseHelper.ExecuteQueryAsync(checkQuery,
                new[] {
                    new MySqlParameter("@UserIdentifier", userIdentifier),
                    new MySqlParameter("@EventId", eventId)
                });

            if (checkResult.Rows.Count > 0)
            {
                bool isLiked = Convert.ToBoolean(checkResult.Rows[0]["is_liked"]);
                string toggleQuery = "UPDATE user_event_preferences SET is_liked = @IsLiked WHERE user_identifier = @UserIdentifier AND event_id = @EventId";
                await _databaseHelper.ExecuteNonQueryAsync(toggleQuery,
                    new[] {
                        new MySqlParameter("@UserIdentifier", userIdentifier),
                        new MySqlParameter("@EventId", eventId),
                        new MySqlParameter("@IsLiked", !isLiked)
                    });

                // Get updated like count
                string countQuery = "SELECT COUNT(*) as like_count FROM user_event_preferences WHERE event_id = @EventId AND is_liked = 1";
                var countResult = await _databaseHelper.ExecuteQueryAsync(countQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                return Ok(new
                {
                    isLiked = !isLiked,
                    likeCount = Convert.ToInt32(countResult.Rows[0]["like_count"])
                });
            }
            else
            {
                string insertQuery = "INSERT INTO user_event_preferences (user_identifier, event_id, is_liked) VALUES (@UserIdentifier, @EventId, 1)";
                await _databaseHelper.ExecuteNonQueryAsync(insertQuery,
                    new[] {
                        new MySqlParameter("@UserIdentifier", userIdentifier),
                        new MySqlParameter("@EventId", eventId)
                    });

                // Get updated like count
                string countQuery = "SELECT COUNT(*) as like_count FROM user_event_preferences WHERE event_id = @EventId AND is_liked = 1";
                var countResult = await _databaseHelper.ExecuteQueryAsync(countQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                return Ok(new
                {
                    isLiked = true,
                    likeCount = Convert.ToInt32(countResult.Rows[0]["like_count"])
                });
            }
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Please sign in to like events" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error toggling like status", error = ex.Message });
        }
    }






}