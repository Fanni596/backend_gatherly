using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace GatherlyAPIv0._0._1.Helpers
{
    public class OTPHelper : ControllerBase
    {

        // In-memory storage for verification codes
        public static ConcurrentDictionary<string, (string Code, DateTime Expiry)> verificationCodes = new();

        // Generate random 6-digit code
        public string GenerateVerificationCode()
        {
            Random rnd = new Random();
            return rnd.Next(100000, 999999).ToString();
        }

    }
}
