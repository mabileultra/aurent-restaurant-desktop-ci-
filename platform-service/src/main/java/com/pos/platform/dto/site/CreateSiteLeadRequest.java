package com.pos.platform.dto.site;

import com.pos.platform.domain.SiteLeadType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSiteLeadRequest(
    @NotBlank @Size(min = 2, max = 200) String name,
    @NotBlank @Size(min = 9, max = 32) String phone,
    @Email @Size(max = 255) String email,
    @NotNull SiteLeadType leadType,
    @NotBlank @Size(max = 64) String source,
    @Size(max = 255) String preferredTime,
    @Size(max = 4000) String message,
    @Size(max = 8) String locale
) {}
