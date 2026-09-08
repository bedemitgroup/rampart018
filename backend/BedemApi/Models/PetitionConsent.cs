namespace BedemApi.Models;

/// <summary>
/// The consent a signature rests on, and the only place its wording lives.
///
/// Signing a petition reveals a political opinion. Under čl. 17 st. 1 ZZPL
/// (art. 9(1) GDPR) processing that is forbidden outright; the exception this
/// feature relies on is čl. 17 st. 2 tač. 1 — the signer's *explicit* consent.
/// Explicit means the person agreed to a specific statement, so there has to be
/// a specific statement, and the controller has to be able to produce it later
/// (čl. 15 st. 1).
///
/// Hence: the server copies <see cref="CurrentText"/> into every signature it
/// writes and never takes the client's word for what was shown. A tampered
/// browser can lie about which sentence it displayed; it cannot make this file
/// say something else.
///
/// Changing the wording means bumping <see cref="CurrentVersion"/>. Old rows
/// keep their own copy and stay valid evidence of what they agreed to.
/// </summary>
public static class PetitionConsent
{
    /// <summary>
    /// TODO before launch: the association's full registered name, matching the
    /// controller named in the privacy policy. It appears verbatim in what
    /// people consent to, so a placeholder here is a defect, not a detail.
    /// </summary>
    public const string Controller = "Udruženje Bedem";

    /// <summary>
    /// How long signatures are held after a petition closes. Published in the
    /// privacy policy and enforced by <c>PetitionRetentionService</c> — the
    /// promise and the job that keeps it read the same number.
    /// </summary>
    public const int RetentionMonths = 12;

    /// <summary>Bump whenever any text below changes.</summary>
    public const string CurrentVersion = "2026-09-04";

    /// <summary>
    /// The mandatory statement. The age line covers čl. 16 ZZPL, where 15 is
    /// the threshold for consenting on your own to an information society
    /// service — carried in the sentence rather than as a third checkbox,
    /// because a form nobody reads to the end protects nobody.
    /// </summary>
    public const string CurrentText =
        "Izričito pristajem da " + Controller + " obrađuje moje ime, prezime i grad "
        + "radi evidentiranja mog potpisa na ovoj peticiji. Razumem da podatak o tome "
        + "da sam potpisao/la ovu peticiju otkriva moje političko mišljenje i da spada "
        + "u posebnu vrstu podataka o ličnosti. Potvrđujem da imam najmanje 15 godina. "
        + "Znam da pristanak mogu povući u svakom trenutku, čime se moj potpis briše.";

    /// <summary>
    /// The optional one. Separate on purpose: making publication a condition of
    /// signing would make the consent unfree, and an unfree consent is no legal
    /// basis at all.
    /// </summary>
    public const string PublicDisplayText =
        "Pristajem da moje ime, prezime i grad budu javno prikazani na listi potpisnika "
        + "ove peticije. Ovo je dobrovoljno — bez ovog pristanka potpis se i dalje broji, "
        + "samo se ne prikazuje.";

    /// <summary>
    /// What the petition page must say next to the signature counter. An online
    /// petition is not a narodna inicijativa: under the Zakon o referendumu i
    /// narodnoj inicijativi signatures for one are certified at the municipal
    /// administration, or collected electronically only through eUprava. Letting
    /// people believe otherwise would be the campaign misleading its own
    /// supporters.
    /// </summary>
    public const string LegalEffectNotice =
        "Ova peticija je izraz javne podrške i nema pravno dejstvo narodne inicijative. "
        + "Potpisi za narodnu inicijativu overavaju se u opštinskoj upravi ili se prikupljaju "
        + "elektronski isključivo preko portala eUprava.";
}
