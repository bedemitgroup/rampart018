using System.Text.Json.Serialization;

namespace BedemApi.DTOs;

// ---------------------------------------------------------------------------
// Panel writes
// ---------------------------------------------------------------------------

public record CreatePetitionRequest(
    string Title,
    string Summary,
    string Body,
    string Recipient,
    string? ImageUrl,
    int Goal,
    DateTimeOffset? ClosesAt);

public record UpdatePetitionRequest(
    string Title,
    string Summary,
    string Body,
    string Recipient,
    string? ImageUrl,
    int Goal,
    DateTimeOffset? ClosesAt);

/// <summary>Open or close collection. Status is one of <c>PetitionStatus</c>.</summary>
public record PetitionStatusRequest(string Status);

public record MovePetitionRequest(string Direction);

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/// <summary>
/// What the signing form sends. Note what is absent: no consent *text*. The
/// client says whether the boxes were ticked; the server decides what they
/// said, from <c>PetitionConsent</c>. A browser cannot testify about itself.
/// </summary>
public record SignPetitionRequest(
    string FirstName,
    string LastName,
    string City,
    bool Consent,
    bool PublicDisplay,
    [property: JsonPropertyName("contact_reference")] string? ContactReference = null);

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

public record PetitionListItemResponse(
    int Id,
    string Slug,
    string Title,
    string Summary,
    string Recipient,
    string? ImageUrl,
    int Goal,
    string Status,
    DateTime? ClosesAt,
    int SignatureCount,
    DateTime CreatedAt);

public record PetitionDetailResponse(
    int Id,
    string Slug,
    string Title,
    string Summary,
    string Body,
    string Recipient,
    string? ImageUrl,
    int Goal,
    string Status,
    DateTime? ClosesAt,
    DateTime? ClosedAt,
    DateTime? SignaturesPurgedAt,
    int SignatureCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    // Null when signing is allowed; otherwise the reason it is not.
    string? SignBlockedReason,
    bool ViewerHasSigned,
    // The consent wording in force, so the form renders what the server will store.
    string ConsentText,
    string PublicDisplayConsentText,
    string LegalEffectNotice);

/// <summary>
/// A signature as the public list shows it — only ever built from rows whose
/// signer ticked the second box.
/// </summary>
public record PublicSignatureResponse(
    string FirstName,
    string LastName,
    string City,
    DateTime SignedAt);

public record PublicSignaturePageResponse(
    IReadOnlyList<PublicSignatureResponse> Items,
    int Total,
    int Page,
    int PageSize);

/// <summary>
/// A signature as the panel shows it. Carries the account's username so a
/// moderator can tell two identical names apart, and deliberately not its
/// email — nothing in the job of running a petition needs it.
/// </summary>
public record AdminSignatureResponse(
    int Id,
    string FirstName,
    string LastName,
    string City,
    string Username,
    bool PublicDisplay,
    string ConsentVersion,
    DateTime SignedAt);

public record AdminSignaturePageResponse(
    IReadOnlyList<AdminSignatureResponse> Items,
    int Total,
    int Page,
    int PageSize);

/// <summary>
/// What one person signed, for that person. This is the right of access
/// (čl. 26 ZZPL) in the smallest useful form: everything stored about the
/// signature, including the exact sentence consented to.
/// </summary>
public record MySignatureResponse(
    int PetitionId,
    string Slug,
    string Title,
    string PetitionStatus,
    string FirstName,
    string LastName,
    string City,
    bool PublicDisplay,
    string ConsentText,
    string ConsentVersion,
    DateTime SignedAt);
