using System.Text.RegularExpressions;
using PhoneNumbers;

namespace BedemApi.Services;

public static class ContactNormalizer
{
    private static readonly PhoneNumberUtil PhoneUtil =
        PhoneNumberUtil.GetInstance();

    private static readonly Regex EmailRegex = new(
        @"^[^\s@]+@[^\s@]+\.[^\s@]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    public static bool IsValidEmail(string email)
    {
        var normalized = NormalizeEmail(email);
        return EmailRegex.IsMatch(normalized);
    }

    public static bool TryNormalizePhone(
        string? phone,
        out string? normalizedPhone)
    {
        normalizedPhone = null;

        if (string.IsNullOrWhiteSpace(phone))
            return true;

        var input = phone.Trim();

        // International format is required.
        if (!input.StartsWith('+'))
            return false;

        try
        {
            var parsed = PhoneUtil.Parse(input, null);

            if (!PhoneUtil.IsValidNumber(parsed))
                return false;

            normalizedPhone = PhoneUtil.Format(
                parsed,
                PhoneNumberFormat.E164);

            return true;
        }
        catch (NumberParseException)
        {
            return false;
        }
    }
}