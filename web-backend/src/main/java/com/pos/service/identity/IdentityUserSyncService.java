package com.pos.service.identity;

import com.pos.dto.identity.internal.UserSyncRequest;

public interface IdentityUserSyncService {

    void sync(UserSyncRequest request);
}
