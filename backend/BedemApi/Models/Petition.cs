namespace BedemApi.Models;

/// <summary>
/// A petition the association publishes and asks people to sign.
///
/// Signing one reveals a political opinion, which čl. 17 ZZPL (art. 9 GDPR)
/// makes a special category of personal data: forbidden to process unless the
/// signer gave explicit consent. Three things follow from that, and they are
/// the reason this is not simply another <see cref="News"/>:
///
///  * <see cref="PetitionSignature.ConsentText"/> stores the sentence the
///    signer agreed to, so the consent can be proven later (čl. 15 st. 1).
///  * A signature can be withdrawn, and withdrawal deletes the row.
///  * <see cref="ClosedAt"/> starts a retention clock. Twelve months after it,
///    <c>PetitionRetentionService</c> deletes every signature and leaves
///    <see cref="FinalSignatureCount"/> behind.
/// </summary>
public class Petition
{
    public int Id { get; set; }

    public string Slug { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    /// <summary>One paragraph for the list page.</summary>
    public string Summary { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    /// <summary>Who the petition is addressed to — a ministry, a city, a company.</summary>
    public string Recipient { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    /// <summary>The number of signatures the campaign is aiming at, for the progress bar.</summary>
    public int Goal { get; set; }

    public string Status { get; set; } = PetitionStatus.Draft;

    /// <summary>
    /// Optional deadline. Past it the petition refuses signatures even while the
    /// status still says open — closing is a decision somebody makes, and the
    /// nightly job is not the place to make it.
    /// </summary>
    public DateTime? ClosesAt { get; set; }

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? OpenedAt { get; set; }

    /// <summary>When collection stopped. This is what the retention clock counts from.</summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>When the signatures were deleted. Null while they are still held.</summary>
    public DateTime? SignaturesPurgedAt { get; set; }

    /// <summary>
    /// The tally frozen at the moment of purging. Null while the signatures
    /// exist, because until then the rows themselves are the count and a second
    /// copy would only get out of step.
    /// </summary>
    public int? FinalSignatureCount { get; set; }

    public int DisplayOrder { get; set; }

    public ICollection<PetitionSignature> Signatures { get; set; } = new List<PetitionSignature>();
}
