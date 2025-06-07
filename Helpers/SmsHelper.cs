using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace GatherlyAPIv0._0._1.Helpers
{
    public class SmsHelper
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiUsername;
        private readonly string _apiPassword;
        private readonly string _apiEndpoint;

        public SmsHelper(string apiUsername, string apiPassword, string apiEndpoint = "https://api.sms-gate.app/3rdparty/v1/message")
        {
            _httpClient = new HttpClient();
            _apiUsername = apiUsername;
            _apiPassword = apiPassword;
            _apiEndpoint = apiEndpoint;

            // Set up basic authentication
            var byteArray = Encoding.ASCII.GetBytes($"{_apiUsername}:{_apiPassword}");
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));
        }

        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                phoneNumber = FormatPhoneNumber(phoneNumber); // Format the phone number

                var body = new
                {
                    message = message,
                    phoneNumbers = new List<string> { phoneNumber }
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(body),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync(_apiEndpoint, content);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> SendVerificationCodeAsync(string phoneNumber, string code)
        {
            var message = $"Your verification code is: {code}";
            return await SendSmsAsync(phoneNumber, message);
        }

        public async Task<bool> SendInvitationAsync(string phoneNumber, string inviteMessage)
        {
            return await SendSmsAsync(phoneNumber, inviteMessage);
        }

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
    }
}