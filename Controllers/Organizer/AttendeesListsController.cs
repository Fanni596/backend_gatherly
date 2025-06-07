using Microsoft.AspNetCore.Mvc;
using GatherlyAPIv0._0._1.Helpers;
using MySql.Data.MySqlClient;
using System.Data;
using System.Threading.Tasks;
using GatherlyAPIv0._0._1.Models.AttendeesList;
using System;
using GatherlyAPIv0._0._1.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;
using Google.Protobuf.Collections;

namespace GatherlyAPIv0._0._1.Controllers.Organizer
{
    [Route("api/organizer/[controller]")]
    [ApiController]
    public class AttendeelistsController : ControllerBase
    {
        private readonly DatabaseHelper _databaseHelper;
        private readonly IConfiguration _configuration;

        public AttendeelistsController(DatabaseHelper databaseHelper, IConfiguration configuration)
        {
            _databaseHelper = databaseHelper;
            _configuration = configuration;
        }

        private List<Dictionary<string, object>> ConvertDataTableToList(DataTable table)
        {
            return table.AsEnumerable().Select(row => table.Columns.Cast<DataColumn>()
                .ToDictionary(col => col.ColumnName, col => row[col])).ToList();
        }

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

        [HttpGet("getall")]
        public async Task<IActionResult> GetAlllists()
        {
            try
            {
                int userId = GetUserIdFromCookies();

                string query = @"
                    SELECT l.*, 
                           COUNT(a.Id) AS AttendeeCount,
                           TRUE AS IsOwner,
                           FALSE AS IsSharedWithMe
                    FROM lists l
                    LEFT JOIN attendees a ON a.ListId = l.Id
                    WHERE l.UserId = @UserId
                    GROUP BY l.Id;
                ";

                var parameters = new[] { new MySqlParameter("@UserId", userId) };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return Ok(new { code = 200, message = "No lists found for the current user." });
                }

                var lists = ConvertDataTableToList(result);
                return Ok(lists);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while retrieving lists." });
            }
        }

        [HttpGet("getby:{id}")]
        public async Task<IActionResult> GetListById(int id)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid list ID." });
                }

                string query = @"
                    SELECT l.*, 
                           COUNT(a.Id) AS AttendeeCount,
                           l.UserId = @UserId AS IsOwner,
                           FALSE AS IsSharedWithMe
                    FROM lists l
                    LEFT JOIN attendees a ON a.ListId = l.Id
                    WHERE l.Id = @Id AND l.UserId = @UserId
                    GROUP BY l.Id;
                ";

                var parameters = new[]
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@UserId", userId)
                };

                var result = await _databaseHelper.ExecuteQueryAsync(query, parameters);

                if (result.Rows.Count == 0)
                {
                    return NotFound(new { message = "List not found or you do not have access to this list." });
                }

                var list = ConvertDataTableToList(result).First();
                return Ok(list);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while retrieving the list." });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateList([FromBody] List list)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (list == null)
                {
                    return BadRequest(new { message = "List data is required." });
                }

                if (string.IsNullOrWhiteSpace(list.Name))
                {
                    return BadRequest(new { message = "List name is required." });
                }

                string query = @"
                    INSERT INTO lists 
                    (Name, Description, UserId, IsArchived, IsPrivate, Category, Tags, CreatedDate, LastModifiedDate)
                    VALUES 
                    (@Name, @Description, @UserId, @IsArchived, @IsPrivate, @Category, @Tags, NOW(), NOW());
                    SELECT LAST_INSERT_ID();
                ";

                var parameters = new[]
                {
                    new MySqlParameter("@Name", list.Name),
                    new MySqlParameter("@Description", list.Description ?? (object)DBNull.Value),
                    new MySqlParameter("@UserId", userId),
                    new MySqlParameter("@IsArchived", list.IsArchived ?? false),
                    new MySqlParameter("@IsPrivate", list.IsPrivate ?? false),
                    new MySqlParameter("@Category", list.Category ?? (object)DBNull.Value),
                    new MySqlParameter("@Tags", list.Tags != null ? JsonConvert.SerializeObject(list.Tags) : (object)DBNull.Value)
                };

                var listId = await _databaseHelper.ExecuteScalarAsync(query, parameters);

                return Ok(new
                {
                    message = "List created successfully!",
                    listId = listId
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while creating the list." });
            }
        }

        [HttpPut("updateby:{id}")]
        public async Task<IActionResult> UpdateList(int id, [FromBody] List list)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (list == null)
                {
                    return BadRequest(new { message = "List data is required." });
                }

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid list ID." });
                }

                if (string.IsNullOrWhiteSpace(list.Name))
                {
                    return BadRequest(new { message = "List name is required." });
                }

                string query = @"
                    UPDATE lists
                    SET Name = @Name, 
                        Description = @Description,
                        IsArchived = @IsArchived,
                        IsPrivate = @IsPrivate,
                        Category = @Category,
                        Tags = @Tags,
                        LastModifiedDate = NOW()
                    WHERE Id = @Id AND UserId = @UserId;
                ";

                var parameters = new[]
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@Name", list.Name),
                    new MySqlParameter("@Description", list.Description ?? (object)DBNull.Value),
                    new MySqlParameter("@UserId", userId),
                    new MySqlParameter("@IsArchived", list.IsArchived ?? false),
                    new MySqlParameter("@IsPrivate", list.IsPrivate ?? false),
                    new MySqlParameter("@Category", list.Category ?? (object)DBNull.Value),
                    new MySqlParameter("@Tags", list.Tags != null ? JsonConvert.SerializeObject(list.Tags) : (object)DBNull.Value)
                };

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(query, parameters);

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "List not found or you do not have access to this list." });
                }

                return Ok(new { message = "List updated successfully!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while updating the list." });
            }
        }

        [HttpDelete("deleteby:{id}")]
        public async Task<IActionResult> DeleteList(int id)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid list ID." });
                }

                // Check if list is already attached to another event so it cant be deleted
                string listCheckQuery = "SELECT COUNT(*) FROM event_attendee_lists WHERE list_id = @ListId";
                var listCheck = await _databaseHelper.ExecuteScalarAsync(listCheckQuery,
                    new[] { new MySqlParameter("@ListId", id) });

                if (Convert.ToInt64(listCheck) > 0)
                {
                    return BadRequest(new { message = "This list is attached to an event it can not be deleted" });
                }


                string query = "DELETE FROM lists WHERE Id = @Id AND UserId = @UserId;";
                var parameters = new[]
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@UserId", userId)
                };

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(query, parameters);

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "List not found or you do not have access to this list." });
                }

                return Ok(new { message = "List deleted successfully!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while deleting the list." });
            }
        }

        [HttpPost("archive/{id}")]
        public async Task<IActionResult> ArchiveList(int id, [FromBody] bool archive)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid list ID." });
                }
                // Check if list is archeived
                string listEventCheckQueryIsArchived = "SELECT COUNT(*) FROM event_attendee_lists WHERE list_id = @ListId and event_id != ''";
                var listEventCheckIsArchived = await _databaseHelper.ExecuteScalarAsync(listEventCheckQueryIsArchived,
                    new[] { new MySqlParameter("@ListId", id) });

                if (Convert.ToInt64(listEventCheckIsArchived) > 0)
                {
                    return StatusCode(500, new { message = "This list is attached to an event and cant be Archieved" });
                }

                string query = @"
                    UPDATE lists
                    SET IsArchived = @IsArchived,
                        LastModifiedDate = NOW()
                    WHERE Id = @Id AND UserId = @UserId;
                ";

                var parameters = new[]
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@UserId", userId),
                    new MySqlParameter("@IsArchived", archive)
                };

                int rowsAffected = await _databaseHelper.ExecuteNonQueryAsync(query, parameters);

                if (rowsAffected == 0)
                {
                    return NotFound(new { message = "List not found or you do not have access to this list." });
                }

                return Ok(new
                {
                    message = $"List {(archive ? "archived" : "unarchived")} successfully!",
                    isArchived = archive
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = $"An error occurred while {(archive ? "archiving" : "unarchiving")} the list." });
            }
        }

        [HttpPost("clone/{id}")]
        public async Task<IActionResult> CloneList(int id)
        {
            try
            {
                int userId = GetUserIdFromCookies();

                if (id < 0)
                {
                    return BadRequest(new { message = "Invalid list ID." });
                }

                // Get the original list
                string getQuery = "SELECT * FROM lists WHERE Id = @Id AND UserId = @UserId;";
                var getParameters = new[]
                {
                    new MySqlParameter("@Id", id),
                    new MySqlParameter("@UserId", userId)
                };

                var originalList = await _databaseHelper.ExecuteQueryAsync(getQuery, getParameters);

                if (originalList.Rows.Count == 0)
                {
                    return NotFound(new { message = "List not found or you do not have access to this list." });
                }

                // Create a clone of the list
                string insertQuery = @"
                    INSERT INTO lists 
                    (Name, Description, UserId, IsArchived, IsPrivate, Category, Tags, CreatedDate, LastModifiedDate)
                    VALUES 
                    (CONCAT(@Name, ' (Copy)'), @Description, @UserId, @IsArchived, @IsPrivate, @Category, @Tags, NOW(), NOW());
                    SELECT LAST_INSERT_ID();
                ";

                var insertParameters = new[]
                {
                    new MySqlParameter("@Name", originalList.Rows[0]["Name"]),
                    new MySqlParameter("@Description", originalList.Rows[0]["Description"]),
                    new MySqlParameter("@UserId", userId),
                    new MySqlParameter("@IsArchived", originalList.Rows[0]["IsArchived"]),
                    new MySqlParameter("@IsPrivate", originalList.Rows[0]["IsPrivate"]),
                    new MySqlParameter("@Category", originalList.Rows[0]["Category"]),
                    new MySqlParameter("@Tags", originalList.Rows[0]["Tags"])
                };

                var newListId = await _databaseHelper.ExecuteScalarAsync(insertQuery, insertParameters);

                // Clone attendees if needed
                string cloneAttendeesQuery = @"
                    INSERT INTO attendees 
                    (FirstName, LastName, Email, Phone, ListId, AllowedPeople)
                    SELECT FirstName, LastName, Email, Phone, @NewListId, AllowedPeople
                    FROM attendees
                    WHERE ListId = @OriginalListId;
                ";

                var cloneAttendeesParameters = new[]
                {
                    new MySqlParameter("@OriginalListId", id),
                    new MySqlParameter("@NewListId", newListId)
                };

                await _databaseHelper.ExecuteNonQueryAsync(cloneAttendeesQuery, cloneAttendeesParameters);

                return Ok(new
                {
                    message = "List cloned successfully!",
                    listId = newListId
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while cloning the list." });
            }
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                string query = "SELECT Name FROM list_categories ORDER BY Name;";
                var result = await _databaseHelper.ExecuteQueryAsync(query);

                var categories = result.Rows
                    .Cast<DataRow>()
                    .Select(row => row["Name"].ToString())
                    .ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "An error occurred while retrieving categories." });
            }
        }
    }

    public class List
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int UserId { get; set; }
        public bool? IsArchived { get; set; }
        public bool? IsPrivate { get; set; }
        public string Category { get; set; }
        public List<string> Tags { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime LastModifiedDate { get; set; }
        public int AttendeeCount { get; set; }
        public bool IsOwner { get; set; }
        public bool IsSharedWithMe { get; set; }
    }
}