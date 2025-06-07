using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace GatherlyAPIv0._0._1.Helpers
{
    public static class EmailHelper
    {
        public static async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpClient = new SmtpClient("smtp-relay.brevo.com")
            {
                Port = 587,
                Credentials = new NetworkCredential("8b8276001@smtp-brevo.com", "AIJOxR9G156TBcXP"),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress("faani596.arid@gmail.com", "Gatherly App"), // ✨ Sender Name shown in Email
                Subject = subject,
                Body = body,
                IsBodyHtml = false, // Set true if you want HTML
            };
            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}
