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

namespace GatherlyAPIv0._0._1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class EventController : ControllerBase
    {
        private readonly DatabaseHelper _databaseHelper;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly SmsHelper _smsHelper;

        public EventController(DatabaseHelper databaseHelper, IConfiguration configuration, IWebHostEnvironment hostingEnvironment, SmsHelper smsHelper)
        {
            _databaseHelper = databaseHelper;
            _configuration = configuration;
            _hostingEnvironment = hostingEnvironment;
            _smsHelper = smsHelper;
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

        private async Task<string> SaveFile(IFormFile file, string subdirectory)
        {
            var uploadsPath = Path.Combine(_hostingEnvironment.WebRootPath, "uploads", subdirectory);
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return Path.Combine("uploads", subdirectory, uniqueFileName).Replace("\\", "/");
        }

        private void DeleteFile(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            var fullPath = Path.Combine(_hostingEnvironment.WebRootPath, filePath);
            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }
        }

        #endregion

        #region Event CRUD Operations

        [HttpGet]
        public async Task<IActionResult> GetAllEvents([FromQuery] string status = null)
        {
            try
            {
                int userId = GetUserIdFromToken();
                string query = "SELECT * FROM events WHERE organizer_id = @UserId" +
                    (status != null ? " AND status = @Status" : "") +
                    " ORDER BY start_date DESC";

                var parameters = new List<MySqlParameter>
                {
                    new MySqlParameter("@UserId", userId)
                };

                if (status != null)
                {
                    parameters.Add(new MySqlParameter("@Status", status));
                }

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters.ToArray());
                var r = ConvertDataTableToList(result);
                return Ok(r);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
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
                if (!await IsEventOrganizer(id))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
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
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving event", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromForm] EventCreateRequest request)
        {
            try
            {
                int userId = GetUserIdFromToken();



                string query = @"
    INSERT INTO events (
        title, description, summary, start_date, start_time, end_time,
        location, ticket_type, ticket_price, capacity, status, visibility,
        organizer_id, registration_expiry, organizer_name, organizer_email, longitude, latitude
    ) VALUES (
        @Title, @Description, @Summary, @StartDate, @StartTime, @EndTime,
        @Location, @TicketType, @TicketPrice, @Capacity, @Status, @Visibility,
        @OrganizerId, @RegistrationExpiry, @OrganizerName, @OrganizerEmail, @Longitude, @Latitude
    );
    SELECT LAST_INSERT_ID();";


                var parameters = new[]
                {
                    new MySqlParameter("@Title", request.Title),
                    new MySqlParameter("@Description", request.Description),
                    new MySqlParameter("@Summary", request.summary),
                    new MySqlParameter("@StartDate", request.StartDate),
                    new MySqlParameter("@StartTime", request.StartTime),
                    new MySqlParameter("@EndTime", request.EndTime),
                    new MySqlParameter("@Location", request.Location),
                    new MySqlParameter("@TicketType", request.TicketType),
                    new MySqlParameter("@TicketPrice", request.TicketPrice),
                    new MySqlParameter("@Capacity", request.Capacity),
                    new MySqlParameter("@Status", request.Status ?? "draft"),
                    new MySqlParameter("@Visibility", request.Visibility ?? "public"),
                    new MySqlParameter("@OrganizerId", userId),
                     new MySqlParameter("@RegistrationExpiry", request.RegistrationExpiry ?? (object)DBNull.Value),
                     new MySqlParameter("@OrganizerName", request.OrganizerName),
                     new MySqlParameter("@OrganizerEmail", request.OrganizerEmail),
                     new MySqlParameter("@Longitude", request.Longitude),
                     new MySqlParameter("@Latitude", request.Latitude),
                };

                var eventId = await _databaseHelper.ExecuteScalarAsync(query, parameters);
                return Ok(new
                {
                    message = "Event created successfully",
                    eventId = Convert.ToInt32(eventId)
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error creating event",
                    error = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEvent(int id, [FromForm] EventUpdateRequest request)
        {
            try
            {
                if (!await IsEventOrganizer(id))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }



                string query = @"
        UPDATE events SET
            title = @Title,
            description = @Description,
            summary = @Summary,
            start_date = @StartDate,
            start_time = @StartTime,
            end_time = @EndTime,
            location = @Location,
            longitude = @Longitude,
            latitude = @Latitude,
            ticket_type = @TicketType,
            ticket_price = @TicketPrice,
            capacity = @Capacity,
            status = @Status,
            visibility = @Visibility,
            registration_expiry = @RegistrationExpiry,
            organizer_name = @OrganizerName,
            organizer_email = @OrganizerEmail,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @Id";

                var parameters = new List<MySqlParameter>
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@Title", request.Title),
                    new MySqlParameter("@Description", request.Description),
                    new MySqlParameter("@Summary", request.summary),
                    new MySqlParameter("@StartDate", request.StartDate),
                    new MySqlParameter("@StartTime", request.StartTime),
                    new MySqlParameter("@EndTime", request.EndTime),
                    new MySqlParameter("@Location", request.Location),
                    new MySqlParameter("@TicketType", request.TicketType),
                    new MySqlParameter("@TicketPrice", request.TicketPrice),
                    new MySqlParameter("@Capacity", request.Capacity),
                    new MySqlParameter("@Status", request.Status ?? "draft"),
                    new MySqlParameter("@Visibility", request.Visibility ?? "public"),
                     new MySqlParameter("@RegistrationExpiry", request.RegistrationExpiry ?? (object)DBNull.Value),
                          new MySqlParameter("@OrganizerName", request.OrganizerName),
                     new MySqlParameter("@OrganizerEmail", request.OrganizerEmail),
                     new MySqlParameter("@Latitude", request.Latitude),
                     new MySqlParameter("@Longitude", request.Longitude),
                };


                await _databaseHelper.ExecuteNonQueryAsync(query, parameters.ToArray());
                return Ok(new { message = "Event updated successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating event",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            try
            {
                if (!await IsEventOrganizer(id))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }
                // Check if event is published
                string statusQuery = "SELECT status FROM events WHERE id = @Id";
                var status = await _databaseHelper.ExecuteScalarAsync(statusQuery,
                    new[] { new MySqlParameter("@Id", id) });

                if (status?.ToString() == "published")
                {
                    return BadRequest(new { message = "Published events cannot be deleted" });
                }

                // Get all media files to delete
                var filesToDelete = new List<string>();

              

                // Get images
                string imagesQuery = "SELECT file_path FROM event_images WHERE event_id = @EventId";
                var images = await _databaseHelper.ExecuteQueryAsync(imagesQuery,
                    new[] { new MySqlParameter("@EventId", id) });
                foreach (DataRow row in images.Rows)
                {
                    filesToDelete.Add(row["file_path"].ToString());
                }

                // Get videos
                string videosQuery = "SELECT file_path FROM event_videos WHERE event_id = @EventId";
                var videos = await _databaseHelper.ExecuteQueryAsync(videosQuery,
                    new[] { new MySqlParameter("@EventId", id) });
                foreach (DataRow row in videos.Rows)
                {
                    filesToDelete.Add(row["file_path"].ToString());
                }

                // Delete all files
                foreach (var file in filesToDelete)
                {
                    DeleteFile(file);
                }

                // Delete the event (cascading deletes should handle related records)
                string deleteQuery = "DELETE FROM events WHERE id = @Id";
                await _databaseHelper.ExecuteNonQueryAsync(deleteQuery,
                    new[] { new MySqlParameter("@Id", id) });

                return Ok(new { message = "Event deleted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error deleting event",
                    error = ex.Message
                });
            }
        }

        #endregion

        #region Media Management

        [HttpGet("{eventId}/media")]
        public async Task<IActionResult> GetEventMedia(int eventId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
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
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
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

        [HttpPost("{eventId}/images")]
        public async Task<IActionResult> UploadImages(int eventId, [FromForm] List<IFormFile> images)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                if (images == null || images.Count == 0)
                {
                    return BadRequest(new { message = "No images provided" });
                }

                var uploadedImages = new List<object>();

                foreach (var image in images)
                {
                    var imagePath = await SaveFile(image, "event_images");

                    string query = @"
                    INSERT INTO event_images (
                        event_id, name, type, size, file_path
                    ) VALUES (
                        @EventId, @Name, @Type, @Size, @FilePath
                    );
                    SELECT LAST_INSERT_ID();";

                    var parameters = new[]
                    {
                        new MySqlParameter("@EventId", eventId),
                        new MySqlParameter("@Name", image.FileName),
                        new MySqlParameter("@Type", image.ContentType),
                        new MySqlParameter("@Size", image.Length),
                        new MySqlParameter("@FilePath", imagePath)
                    };

                    var imageId = await _databaseHelper.ExecuteScalarAsync(query, parameters);

                    uploadedImages.Add(new
                    {
                        id = Convert.ToInt32(imageId),
                        name = image.FileName,
                        path = imagePath,
                        size = image.Length,
                        type = image.ContentType
                    });
                }

                return Ok(new
                {
                    message = "Images uploaded successfully",
                    images = uploadedImages
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error uploading images",
                    error = ex.Message
                });
            }
        }

        [HttpPost("{eventId}/videos")]
        public async Task<IActionResult> UploadVideos(int eventId, [FromForm] List<IFormFile> videos)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                if (videos == null || videos.Count == 0)
                {
                    return BadRequest(new { message = "No videos provided" });
                }

                var uploadedVideos = new List<object>();

                foreach (var video in videos)
                {
                    var videoPath = await SaveFile(video, "event_videos");

                    string query = @"
                    INSERT INTO event_videos (
                        event_id, name, type, size, file_path
                    ) VALUES (
                        @EventId, @Name, @Type, @Size, @FilePath
                    );
                    SELECT LAST_INSERT_ID();";

                    var parameters = new[]
                    {
                        new MySqlParameter("@EventId", eventId),
                        new MySqlParameter("@Name", video.FileName),
                        new MySqlParameter("@Type", video.ContentType),
                        new MySqlParameter("@Size", video.Length),
                        new MySqlParameter("@FilePath", videoPath)
                    };

                    var videoId = await _databaseHelper.ExecuteScalarAsync(query, parameters);

                    uploadedVideos.Add(new
                    {
                        id = Convert.ToInt32(videoId),
                        name = video.FileName,
                        path = videoPath,
                        size = video.Length,
                        type = video.ContentType
                    });
                }

                return Ok(new
                {
                    message = "Videos uploaded successfully",
                    videos = uploadedVideos
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error uploading videos",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            try
            {
                // Verify ownership
                string verifyQuery = @"
                SELECT e.organizer_id, ei.file_path 
                FROM event_images ei
                JOIN events e ON ei.event_id = e.id
                WHERE ei.id = @ImageId";

                var result = await _databaseHelper.ExecuteQueryAsync(verifyQuery,
                    new[] { new MySqlParameter("@ImageId", imageId) });

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "Image not found" });
                }

                int organizerId = Convert.ToInt32(result.Rows[0]["organizer_id"]);
                if (organizerId != GetUserIdFromToken())
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Delete file
                var filePath = result.Rows[0]["file_path"].ToString();
                DeleteFile(filePath);

                // Delete record
                string deleteQuery = "DELETE FROM event_images WHERE id = @ImageId";
                await _databaseHelper.ExecuteNonQueryAsync(deleteQuery,
                    new[] { new MySqlParameter("@ImageId", imageId) });

                return Ok(new { message = "Image deleted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error deleting image",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("videos/{videoId}")]
        public async Task<IActionResult> DeleteVideo(int videoId)
        {
            try
            {
                // Verify ownership
                string verifyQuery = @"
                SELECT e.organizer_id, ev.file_path 
                FROM event_videos ev
                JOIN events e ON ev.event_id = e.id
                WHERE ev.id = @VideoId";

                var result = await _databaseHelper.ExecuteQueryAsync(verifyQuery,
                    new[] { new MySqlParameter("@VideoId", videoId) });

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "Video not found" });
                }

                int organizerId = Convert.ToInt32(result.Rows[0]["organizer_id"]);
                if (organizerId != GetUserIdFromToken())
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Delete file
                var filePath = result.Rows[0]["file_path"].ToString();
                DeleteFile(filePath);

                // Delete record
                string deleteQuery = "DELETE FROM event_videos WHERE id = @VideoId";
                await _databaseHelper.ExecuteNonQueryAsync(deleteQuery,
                    new[] { new MySqlParameter("@VideoId", videoId) });

                return Ok(new { message = "Video deleted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error deleting video",
                    error = ex.Message
                });
            }
        }

        #endregion

        #region Event Status Management

        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishEvent(int id)
        {
            try
            {
                if (!await IsEventOrganizer(id))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
                UPDATE events 
                SET 
                    status = 'published',
                    published_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @Id";

                await _databaseHelper.ExecuteNonQueryAsync(query,
                    new[] { new MySqlParameter("@Id", id) });

                return Ok(new { message = "Event published successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error publishing event",
                    error = ex.Message
                });
            }
        }
        [HttpPost("{id}/draft")]
        public async Task<IActionResult> DraftEvent(int id)
        {
            try
            {
                if (!await IsEventOrganizer(id))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
                UPDATE events 
                SET 
                    status = 'draft',
                    published_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @Id";

                await _databaseHelper.ExecuteNonQueryAsync(query,
                    new[] { new MySqlParameter("@Id", id) });

                return Ok(new { message = "Event Drafted successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error drafting event",
                    error = ex.Message
                });
            }
        }
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelEvent(int id)
        {
            try
            {
                if (!await IsEventOrganizer(id))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
                UPDATE events 
                SET 
                    status = 'cancelled',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @Id";

                await _databaseHelper.ExecuteNonQueryAsync(query,
                    new[] { new MySqlParameter("@Id", id) });

                return Ok(new { message = "Event cancelled successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error cancelling event",
                    error = ex.Message
                });
            }
        }

        #endregion

        // GET: api/event/{eventId}/attendee-lists
        [HttpGet("{eventId}/attendee-lists")]
        public async Task<IActionResult> GetEventAttendeelists(int eventId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
            SELECT l.Id, l.Name, l.Description 
            FROM event_attendee_lists eal
            JOIN lists l ON eal.list_id = l.Id
            WHERE eal.event_id = @EventId";

                var result = await _databaseHelper.ExecuteQueryAsync(query,
                    new[] { new MySqlParameter("@EventId", eventId) });

                // Return empty array if no results instead of error
                return Ok(ConvertDataTableToList(result) ?? new List<Dictionary<string, object>>());
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving attendee lists", error = ex.Message });
            }
        }

        // POST: api/event/{eventId}/attach-attendee-list
        [HttpPost("{eventId}/attach-attendee-list/{listId}")]
        public async Task<IActionResult> AttachAttendeeList(int eventId, int listId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Verify the list belongs to the user
                int userId = GetUserIdFromToken();
                string verifyQuery = "SELECT COUNT(*) FROM lists WHERE Id = @ListId AND UserId = @UserId";
                var verifyResult = await _databaseHelper.ExecuteScalarAsync(verifyQuery,
                    new[] {
                new MySqlParameter("@ListId", listId),
                new MySqlParameter("@UserId", userId)
                    });

                if (Convert.ToInt64(verifyResult) == 0)
                {
                    return BadRequest(new { message = "List not found or you don't have access" });
                }

                // Check if list is archived
                string listEventCheckQueryIsArchived = "SELECT COUNT(*) FROM lists WHERE Id = @ListId and IsArchived = true";
                var listEventCheckIsArchived = await _databaseHelper.ExecuteScalarAsync(listEventCheckQueryIsArchived,
                    new[] { new MySqlParameter("@ListId", listId) });

                if (Convert.ToInt64(listEventCheckIsArchived) > 0)
                {
                    return BadRequest(new { message = "This list is Archived" });
                }

                // Check if event already has a list attached
                string eventListCheckQuery = "SELECT COUNT(*) FROM event_attendee_lists WHERE event_id = @EventId";
                var eventListCheck = await _databaseHelper.ExecuteScalarAsync(eventListCheckQuery,
                    new[] { new MySqlParameter("@EventId", eventId) });

                if (Convert.ToInt64(eventListCheck) > 0)
                {
                    return BadRequest(new { message = "This event already has an attendee list attached" });
                }

                // Check if list is already attached to another event
                string listEventCheckQuery = "SELECT COUNT(*) FROM event_attendee_lists WHERE list_id = @ListId";
                var listEventCheck = await _databaseHelper.ExecuteScalarAsync(listEventCheckQuery,
                    new[] { new MySqlParameter("@ListId", listId) });

                if (Convert.ToInt64(listEventCheck) > 0)
                {
                    return BadRequest(new { message = "This list is already attached to another event" });
                }

                // Attach the list to the event
                string insertQuery = @"
            INSERT INTO event_attendee_lists (event_id, list_id)
            VALUES (@EventId, @ListId)";

                await _databaseHelper.ExecuteNonQueryAsync(insertQuery,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@ListId", listId)
                    });

                // Get all attendees from the list
                string attendeesQuery = "SELECT Id FROM attendees WHERE ListId = @ListId";
                var attendeesResult = await _databaseHelper.ExecuteQueryAsync(attendeesQuery,
                    new[] { new MySqlParameter("@ListId", listId) });

                // Insert each attendee into event_attendees table
                foreach (DataRow row in attendeesResult.Rows)
                {
                    int attendeeId = Convert.ToInt32(row["Id"]);

                    string insertAttendeeQuery = @"
                INSERT INTO event_attendees (attendee_id, event_id, list_id, visibility, is_added, is_invited, is_confirmed, is_paid)
                VALUES (@AttendeeId, @EventId, @ListId, 'visible', 1, 0, 0, 0)";

                    await _databaseHelper.ExecuteNonQueryAsync(insertAttendeeQuery,
                        new[] {
                    new MySqlParameter("@AttendeeId", attendeeId),
                    new MySqlParameter("@EventId", eventId),
                    new MySqlParameter("@ListId", listId)
                        });
                }

                return Ok(new { message = "Attendee list attached successfully" });
            }
            catch (MySqlException ex) when (ex.Number == 1062) // Duplicate entry
            {
                return Conflict(new { message = "This list is already attached to the event" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error attaching attendee list", error = ex.Message });
            }
        }

        // DELETE: api/event/{eventId}/detach-attendee-list/{listId}
        [HttpDelete("{eventId}/detach-attendee-list/{listId}")]
        public async Task<IActionResult> DetachAttendeeList(int eventId, int listId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // First delete all attendee associations for this event-list combination
                string deleteAttendeesQuery = @"
            DELETE FROM event_attendees 
            WHERE event_id = @EventId AND list_id = @ListId";

                await _databaseHelper.ExecuteNonQueryAsync(deleteAttendeesQuery,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@ListId", listId)
                    });

                // Then delete the list-event association
                string deleteListQuery = @"
            DELETE FROM event_attendee_lists 
            WHERE event_id = @EventId AND list_id = @ListId";

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(deleteListQuery,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@ListId", listId)
                    });

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "Attendee list not found or not attached to this event" });
                }

                return Ok(new { message = "Attendee list detached successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error detaching attendee list", error = ex.Message });
            }
        }
        // Add these methods to your EventsController
        private string FormatPhoneNumber(string phone)
        {
            if (string.IsNullOrEmpty(phone)) return phone;

            // Remove any existing +92 or other prefixes
            phone = phone.Trim().Replace("+", "").Replace(" ", "");

            // If starts with 0, replace with +92
            if (phone.StartsWith("0"))
            {
                phone = "+92" + phone.Substring(1);
            }
            // If starts with 92 but no +, add +
            else if (phone.StartsWith("92"))
            {
                phone = "+" + phone;
            }
            // If starts with neither, assume it's already in international format
            else if (!phone.StartsWith("+"))
            {
                phone = "+" + phone;
            }

            return phone;
        }
        [HttpPost("{eventId}/send-email-invite/{attendeeId}")]
        public async Task<IActionResult> SendEmailInvite(int eventId, int attendeeId, [FromBody] InviteRequest request)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Get attendee details
                string attendeeQuery = "SELECT * FROM attendees WHERE Id = @AttendeeId";
                var attendeeResult = await _databaseHelper.ExecuteQueryAsync(attendeeQuery,
                    new[] { new MySqlParameter("@AttendeeId", attendeeId) });

                if (attendeeResult.Rows.Count == 0)
                {
                    return NotFound(new { message = "Attendee not found" });
                }

                var attendee = attendeeResult.Rows[0];
                string email = attendee["Email"].ToString();
                string name = $"{attendee["FirstName"]} {attendee["LastName"]}";

                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "Attendee has no email address" });
                }

                // Get event details
                var eventResult = await _databaseHelper.ExecuteQueryAsync(
                    "SELECT title, start_date, start_time, location FROM events WHERE id = @EventId",
                    new[] { new MySqlParameter("@EventId", eventId) });

                if (eventResult.Rows.Count == 0)
                {
                    return NotFound(new { message = "Event not found" });
                }

                var eventData = eventResult.Rows[0];
                string eventTitle = eventData["title"].ToString();
                string eventDate = ((DateTime)eventData["start_date"]).ToString("MMMM dd, yyyy");
                string eventTime = ((TimeSpan)eventData["start_time"]).ToString(@"hh\:mm");
                string eventLocation = eventData["location"].ToString();

                // Build email message
                string subject = $"Invitation: {eventTitle}";
                string body = $"Dear {name},\n\n" +
                              $"You're invited to attend {eventTitle} on {eventDate} at {eventTime}.\n" +
                              $"Location: {eventLocation}\n\n" +
                              $"Message from organizer:\n{request.Message}\n\n" +
                              $"We hope to see you there!";

                await EmailHelper.SendEmailAsync(email, subject, body);

                return Ok(new { message = "Email invitation sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending email invite", error = ex.Message });
            }
        }

        [HttpPost("{eventId}/send-sms-invite/{attendeeId}")]
        public async Task<IActionResult> SendSmsInvite(int eventId, int attendeeId, [FromBody] InviteRequest request)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Get attendee details
                string attendeeQuery = "SELECT * FROM attendees WHERE Id = @AttendeeId";
                var attendeeResult = await _databaseHelper.ExecuteQueryAsync(attendeeQuery,
                    new[] { new MySqlParameter("@AttendeeId", attendeeId) });

                if (attendeeResult.Rows.Count == 0)
                {
                    return NotFound(new { message = "Attendee not found" });
                }

                var attendee = attendeeResult.Rows[0];
                string phone = attendee["Phone"].ToString();
                if (string.IsNullOrEmpty(phone))
                {
                    return BadRequest(new { message = "Attendee has no phone number" });
                }

                // Get event details
                var eventResult = await _databaseHelper.ExecuteQueryAsync(
                    "SELECT title, start_date, start_time FROM events WHERE id = @EventId",
                    new[] { new MySqlParameter("@EventId", eventId) });

                if (eventResult.Rows.Count == 0)
                {
                    return NotFound(new { message = "Event not found" });
                }

                var eventData = eventResult.Rows[0];
                string eventTitle = eventData["title"].ToString();
                string eventDate = ((DateTime)eventData["start_date"]).ToString("MMMM dd");
                string eventTime = ((TimeSpan)eventData["start_time"]).ToString(@"hh\:mm");
                string name = $"{attendee["FirstName"]} {attendee["LastName"]}";

                // Build SMS message
                string smsMessage = $"{name}\n" +
                    $"Invitation: {eventTitle} on {eventDate} at {eventTime}. " +
                                   $"Message: {request.Message}. " +
                                   "Reply YES to confirm attendance.";

                           
                phone = FormatPhoneNumber(phone);  // Add this line
                Console.WriteLine(phone);

                bool smsSent = await _smsHelper.SendInvitationAsync(phone, smsMessage);

                return smsSent
                    ? Ok(new { message = "SMS invitation sent successfully" })
                    : BadRequest(new { message = "Failed to send SMS" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending SMS invite", error = ex.Message });
            }
        }

        [HttpPost("{eventId}/send-list-invites/{listId}")]
        public async Task<IActionResult> SendListInvites(int eventId, int listId, [FromBody] ListInviteRequest request)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Verify list belongs to user
                int userId = GetUserIdFromToken();
                string verifyQuery = "SELECT COUNT(*) FROM lists WHERE Id = @ListId AND UserId = @UserId";
                var verifyResult = await _databaseHelper.ExecuteScalarAsync(verifyQuery,
                    new[] {
                new MySqlParameter("@ListId", listId),
                new MySqlParameter("@UserId", userId)
                    });

                if (Convert.ToInt64(verifyResult) == 0)
                {
                    return BadRequest(new { message = "List not found or you don't have access" });
                }

                // Get event details
                var eventResult = await _databaseHelper.ExecuteQueryAsync(
                    "SELECT title, start_date, start_time, location FROM events WHERE id = @EventId",
                    new[] { new MySqlParameter("@EventId", eventId) });

                if (eventResult.Rows.Count == 0)
                {
                    return NotFound(new { message = "Event not found" });
                }

                var eventData = eventResult.Rows[0];
                string eventTitle = eventData["title"].ToString();
                string eventDate = ((DateTime)eventData["start_date"]).ToString("MMMM dd, yyyy");
                string eventTime = ((TimeSpan)eventData["start_time"]).ToString(@"hh\:mm");
                string eventLocation = eventData["location"].ToString();

                // Get list attendees
                string attendeesQuery = "SELECT * FROM attendees WHERE ListId = @ListId";
                var attendeesResult = await _databaseHelper.ExecuteQueryAsync(attendeesQuery,
                    new[] { new MySqlParameter("@ListId", listId) });

                int successCount = 0;
                int totalCount = attendeesResult.Rows.Count;

                foreach (DataRow attendee in attendeesResult.Rows)
                {
                    try
                    {
                        string name = $"{attendee["FirstName"]} {attendee["LastName"]}";

                        if (request.Method == "email" && !string.IsNullOrEmpty(attendee["Email"].ToString()))
                        {
                            string email = attendee["Email"].ToString();
                            string subject = $"Invitation: {eventTitle}";
                            string body = $"Dear {name},\n\n" +
                                          $"You're invited to attend {eventTitle} on {eventDate} at {eventTime}.\n" +
                                          $"Location: {eventLocation}\n\n" +
                                          $"Message from organizer:\n{request.Message}\n\n" +
                                          $"We hope to see you there!";

                            await EmailHelper.SendEmailAsync(email, subject, body);
                            successCount++;
                        }
                        else if (request.Method == "sms" && !string.IsNullOrEmpty(attendee["Phone"].ToString()))
                        {
                            string phone = attendee["Phone"].ToString();
                            phone = FormatPhoneNumber(phone);  // Add this line
                            Console.WriteLine($"Sending SMS to {name} at {attendee["Phone"]}");
                            string smsMessage =
                            $"{name}\n" +

                                $"Invitation: {eventTitle} on {eventDate} at {eventTime}. " +
                                               $"Message: {request.Message}. " +
                                               "Reply YES to confirm attendance.";


                            bool smsSent = await _smsHelper.SendInvitationAsync(phone, smsMessage);

                            //bool smsSent = await smsHelper.SendSmsAsync(phone, smsMessage);
                            if (smsSent) successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue with other attendees
                        Console.WriteLine($"Error sending invite to attendee {attendee["Id"]}: {ex.Message}");
                    }
                }

                return Ok(new
                {
                    message = $"Sent {successCount} of {totalCount} invites successfully",
                    count = successCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending list invites", error = ex.Message });
            }
        }



        #region Attendee Status Management

        [HttpPost("{eventId}/attendees/{attendeeId}/invite")]
        public async Task<IActionResult> MarkAsInvited(int eventId, int attendeeId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
            UPDATE event_attendees 
            SET is_invited = 1 
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

                return Ok(new { message = "Attendee marked as invited" });
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

        [HttpPost("{eventId}/attendees/{attendeeId}/confirm")]
        public async Task<IActionResult> MarkAsConfirmed(int eventId, int attendeeId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

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

        [HttpPost("{eventId}/attendees/{attendeeId}/paid")]
        public async Task<IActionResult> MarkAsPaid(int eventId, int attendeeId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
            UPDATE event_attendees 
            SET is_paid = 1 
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

                return Ok(new { message = "Attendee marked as paid" });
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

        [HttpGet("{eventId}/attendees")]
        public async Task<IActionResult> GetEventAttendees(int eventId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string query = @"
            SELECT 
                a.Id, 
                a.FirstName, 
                a.LastName, 
                a.Email, 
                a.Phone,
                ea.is_added,
                ea.is_invited,
                ea.is_confirmed,
                ea.is_paid
            FROM event_attendees ea
            JOIN attendees a ON ea.attendee_id = a.Id
            WHERE ea.event_id = @EventId";

                var result = await _databaseHelper.ExecuteQueryAsync(query,
                    new[] { new MySqlParameter("@EventId", eventId) });

                return Ok(ConvertDataTableToList(result) ?? new List<Dictionary<string, object>>());
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving attendees", error = ex.Message });
            }
        }

        [HttpPost("{eventId}/add-attendee/{attendeeId}")]
        public async Task<IActionResult> AddIndividualAttendee(int eventId, int attendeeId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                // Verify attendee exists
                string verifyAttendeeQuery = "SELECT COUNT(*) FROM attendees WHERE Id = @AttendeeId";
                var verifyResult = await _databaseHelper.ExecuteScalarAsync(verifyAttendeeQuery,
                    new[] { new MySqlParameter("@AttendeeId", attendeeId) });

                if (Convert.ToInt64(verifyResult) == 0)
                {
                    return NotFound(new { message = "Attendee not found" });
                }

                // Check if already added
                string checkQuery = "SELECT COUNT(*) FROM event_attendees WHERE event_id = @EventId AND attendee_id = @AttendeeId";
                var checkResult = await _databaseHelper.ExecuteScalarAsync(checkQuery,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@AttendeeId", attendeeId)
                    });

                if (Convert.ToInt64(checkResult) > 0)
                {
                    return Conflict(new { message = "Attendee already added to this event" });
                }

                // Add attendee
                string insertQuery = @"
            INSERT INTO event_attendees (attendee_id, event_id, visibility, is_added, is_invited, is_confirmed, is_paid)
            VALUES (@AttendeeId, @EventId, 'visible', 1, 0, 0, 0)";

                await _databaseHelper.ExecuteNonQueryAsync(insertQuery,
                    new[] {
                new MySqlParameter("@AttendeeId", attendeeId),
                new MySqlParameter("@EventId", eventId)
                    });

                return Ok(new { message = "Attendee added successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error adding attendee", error = ex.Message });
            }
        }

        [HttpDelete("{eventId}/remove-attendee/{attendeeId}")]
        public async Task<IActionResult> RemoveAttendee(int eventId, int attendeeId)
        {
            try
            {
                if (!await IsEventOrganizer(eventId))
                {
                    return Unauthorized(new { message = "You are not the organizer of this event" });
                }

                string deleteQuery = @"
            DELETE FROM event_attendees 
            WHERE event_id = @EventId AND attendee_id = @AttendeeId";

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(deleteQuery,
                    new[] {
                new MySqlParameter("@EventId", eventId),
                new MySqlParameter("@AttendeeId", attendeeId)
                    });

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "Attendee not found for this event" });
                }

                return Ok(new { message = "Attendee removed successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error removing attendee", error = ex.Message });
            }
        }

        #endregion


    }




    #region Request Models
    // Add these DTO classes at the bottom of your controller
    public class InviteRequest
    {
        public string Message { get; set; }
    }

    public class ListInviteRequest : InviteRequest
    {
        public string Method { get; set; } // "email" or "sms"
    }
    public class EventCreateRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string summary { get; set; }
        public DateTime StartDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Location { get; set; }
        public string TicketType { get; set; }
        public decimal TicketPrice { get; set; }
        public decimal Longitude { get; set; }
        public decimal Latitude { get; set; }

        public int Capacity { get; set; }
        public string Status { get; set; }
        public string Visibility { get; set; }
        public DateTime? RegistrationExpiry { get; set; }
        public string OrganizerName { get; set; }
        public string OrganizerEmail { get; set; }
    }

    public class EventUpdateRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string summary { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Location { get; set; }
        public string TicketType { get; set; }
        public decimal TicketPrice { get; set; }
        public int Capacity { get; set; }
        public decimal Longitude { get; set; }
        public decimal Latitude { get; set; }
        public string Status { get; set; }
        public string Visibility { get; set; }
        public DateTime? RegistrationExpiry { get; set; }
        public string OrganizerName { get; set; }
        public string OrganizerEmail { get; set; }
    }

    #endregion
}