package com.pos.identity.service;

import com.pos.identity.dto.platform.security.CreatePlatformSuperAdminRequest;
import com.pos.identity.dto.platform.security.PlatformSuperAdminResponse;
import com.pos.identity.dto.platform.security.UpdatePlatformSuperAdminRequest;

import java.util.List;
import java.util.UUID;

public interface PlatformSuperAdminService {

    List<PlatformSuperAdminResponse> listSuperAdmins();

    PlatformSuperAdminResponse createSuperAdmin(CreatePlatformSuperAdminRequest request);

    PlatformSuperAdminResponse updateSuperAdmin(UUID id, UpdatePlatformSuperAdminRequest request);
}
