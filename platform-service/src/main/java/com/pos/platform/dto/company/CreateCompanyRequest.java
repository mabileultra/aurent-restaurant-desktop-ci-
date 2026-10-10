package com.pos.platform.dto.company;

import jakarta.validation.constraints.NotBlank;

public record CreateCompanyRequest(
    @NotBlank String name,
    String loginCode,
    String legalName,
    String tin,
    String address,
    @NotBlank String regionCode,
    @NotBlank String districtCode,
    String phone,
    String businessType,
    Boolean active
) {}
