package com.pos.platform.dto.site;

import jakarta.validation.constraints.NotBlank;

public record ConvertLeadRequest(
    @NotBlank String companyName,
    String phone,
    String legalName,
    String tin,
    String businessType,
    @NotBlank String regionCode,
    @NotBlank String districtCode,
    String branchName,
    boolean createAdmin,
    String adminName,
    String adminLogin,
    String adminEmail,
    String adminPassword,
    boolean markDone
) {}
