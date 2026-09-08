namespace BedemApi.Models;

/// <summary>
/// One signature. Modelled on <see cref="AssemblyVote"/> — a record of what
/// somebody did, with the details snapshotted rather than joined, so history
/// does not rewrite itself when an account changes.
///
/// The name and city are typed into the signing form rather than read off the
/// account: <see cref="User"/> holds none of them, and a signature should say
/// what the person put their name to at that moment anyway.
/// </summary>
public class PetitionSignature
{
    public int Id { get; set; }

    public int PetitionId { get; set; }
    public Petition Petition { get; set; } = null!;

    /// <summary>
    /// Who signed. Kept so one account signs once, so the signer can withdraw,
    /// and so the panel can answer "did I sign this". Restrict on the FK: an
    /// account cannot be deleted out from under its own signature.
    /// </summary>
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    /// <summary>
    /// Whether this name may appear on the public list. A separate decision
    /// from signing, and never a condition of it — a signature with this off
    /// still counts, it is just not shown.
    /// </summary>
    public bool PublicDisplay { get; set; }

    /// <summary>
    /// The exact sentence the signer agreed to, copied from
    /// <see cref="PetitionConsent"/> by the server. Written here rather than
    /// referenced by version alone so that editing the text later cannot
    /// retroactively change what somebody consented to.
    /// </summary>
    public string ConsentText { get; set; } = string.Empty;

    /// <summary>The version of that text, for filtering when it changes.</summary>
    public string ConsentVersion { get; set; } = string.Empty;

    /// <summary>Recorded only when <see cref="PublicDisplay"/> was given.</summary>
    public string? PublicDisplayConsentText { get; set; }

    public DateTime SignedAt { get; set; } = DateTime.UtcNow;
}
