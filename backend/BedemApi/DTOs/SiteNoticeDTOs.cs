namespace BedemApi.DTOs;

public record SiteNoticeResponse(string Text, DateTime? UpdatedAt);

public record UpdateSiteNoticeRequest(string Text);
