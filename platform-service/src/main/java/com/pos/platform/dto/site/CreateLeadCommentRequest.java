package com.pos.platform.dto.site;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLeadCommentRequest(
    @NotBlank @Size(max = 2000) String text
) {}
