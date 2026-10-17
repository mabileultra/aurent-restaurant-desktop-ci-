package com.pos.identity.service.auth;

import com.pos.identity.dto.auth.EdgeStaffExportResponse;

public interface EdgeStaffExportService {

    /** Export company staff hashes for restaurant-desktop offline bootstrap. */
    EdgeStaffExportResponse exportForCurrentCompany();
}
