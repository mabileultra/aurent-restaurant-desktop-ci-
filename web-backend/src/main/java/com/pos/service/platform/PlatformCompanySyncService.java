package com.pos.service.platform;

import com.pos.dto.platform.internal.CompanySyncRequest;

public interface PlatformCompanySyncService {

    void sync(CompanySyncRequest request);
}
