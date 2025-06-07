namespace GatherlyAPIv0._0._1.Models.AttendeesList
{
    public class Attendee
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public int ListId { get; set; }
        public int AllowedPeople { get; set; } // Number of people this attendee can bring
    public bool IsPaying { get; set; } // Add this property
    }
}
