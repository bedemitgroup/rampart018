namespace BedemApi.Models;

/// <summary>
/// The transitions a petition is allowed to make, in one place instead of as
/// scattered <c>if</c>s across five endpoints. Same shape as
/// <see cref="AssemblyTopicRules"/>: each method returns the Serbian sentence
/// explaining the refusal, or null when the move is allowed.
/// </summary>
public static class PetitionRules
{
    public static string? WhyCannotSign(Petition petition, DateTime now)
    {
        if (petition.Status == PetitionStatus.Draft)
            return "Peticija još nije objavljena.";

        if (petition.Status is PetitionStatus.Closed or PetitionStatus.Archived)
            return "Peticija je zatvorena i više se ne potpisuje.";

        if (petition.ClosesAt is { } deadline && deadline <= now)
            return "Rok za potpisivanje ove peticije je istekao.";

        return null;
    }

    public static string? WhyCannotOpen(Petition petition) =>
        petition.Status switch
        {
            PetitionStatus.Open => "Peticija je već otvorena.",
            PetitionStatus.Closed => "Zatvorena peticija se ne otvara ponovo — potpisnici su "
                                   + "pristali na prikupljanje koje je okončano.",
            PetitionStatus.Archived => "Peticija je arhivirana i potpisi su obrisani.",
            _ => null
        };

    public static string? WhyCannotClose(Petition petition) =>
        petition.Status switch
        {
            PetitionStatus.Draft => "Nacrt se ne zatvara — obrišite ga ili ga prvo objavite.",
            PetitionStatus.Closed => "Peticija je već zatvorena.",
            PetitionStatus.Archived => "Peticija je arhivirana.",
            _ => null
        };

    /// <summary>
    /// The text freezes the moment somebody signs it. A petition edited after
    /// the fact is one people put their name to something else — and their
    /// consent named this text, not whatever it becomes.
    /// </summary>
    public static string? WhyCannotEdit(Petition petition, bool hasSignatures) =>
        petition.Status == PetitionStatus.Archived
            ? "Peticija je arhivirana."
        : hasSignatures
            ? "Peticija je već potpisana — tekst se više ne menja, jer su potpisnici pristali "
            + "upravo na ovaj tekst."
            : null;

    /// <summary>
    /// Deleting a petition that holds signatures would take personal data with
    /// it in a way nothing records. Purge first, deliberately, then delete.
    /// The FK is Restrict so the database refuses too; this is the sentence
    /// that spares the caller a 500.
    /// </summary>
    public static string? WhyCannotDelete(Petition petition, bool hasSignatures) =>
        hasSignatures
            ? "Peticija ima potpise. Prvo obrišite potpise (arhiviranje), pa onda peticiju."
            : null;

    public static string? WhyCannotPurge(Petition petition, bool hasSignatures)
    {
        if (petition.Status is PetitionStatus.Draft or PetitionStatus.Open)
            return "Peticija još prikuplja potpise — prvo je zatvorite.";

        return hasSignatures ? null : "Nema potpisa za brisanje.";
    }

    /// <summary>
    /// When the signatures on a closed petition must be gone. The service that
    /// enforces it and the policy that promises it read the same constant.
    /// </summary>
    public static DateTime? PurgeDueAt(Petition petition) =>
        petition.ClosedAt?.AddMonths(PetitionConsent.RetentionMonths);
}
