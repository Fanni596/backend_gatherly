// Models/Event.cs
namespace GatherlyAPIv0._0._1.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Summary { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } // "draft", "published", "cancelled"
        public string Visibility { get; set; } // "public", "private", "unlisted"
        public string QRCode { get; set; }

        // Date/time fields
        public DateTime StartDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Timezone { get; set; }
        public string Duration { get; set; }

        // Location fields
        public string Location { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        // Ticket fields
        public string TicketType { get; set; } // "free", "paid"
        public decimal TicketPrice { get; set; }
        public string Currency { get; set; }
        public int? Capacity { get; set; }
        public int? TicketInventory { get; set; }

        // Media fields
        public string ThumbnailUrl { get; set; }

        // Organizer fields
        public int OrganizerId { get; set; }
        public string OrganizerName { get; set; }
        public string OrganizerEmail { get; set; }

        // System fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public int Views { get; set; }
        public int Bookmarks { get; set; }

        // Navigation properties
        public List<EventImage> Images { get; set; }
        public List<EventVideo> Videos { get; set; }
        public List<EventTag> Tags { get; set; }
        public List<EventCategory> Categories { get; set; }
        public List<EventAccessibilityOption> AccessibilityOptions { get; set; }
        public List<EventSocialLink> SocialLinks { get; set; }
        public List<Event> RelatedEvents { get; set; }
    }

    public class EventImage
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
        public string FilePath { get; set; }
        public string PreviewUrl { get; set; }
        public int SortOrder { get; set; }
        public bool IsThumbnail { get; set; }
    }

    public class EventVideo
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
        public string FilePath { get; set; }
        public string PreviewUrl { get; set; }
        public int? Duration { get; set; }
    }

    public class EventTag
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class EventCategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class EventAccessibilityOption
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class EventSocialLink
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Platform { get; set; }
        public string Url { get; set; }
    }
}