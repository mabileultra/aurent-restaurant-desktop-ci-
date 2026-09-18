package com.pos.identity.service.account;

import com.pos.identity.dto.platform.account.PlatformOperatorAccountResponse;
import com.pos.identity.dto.platform.account.UpdatePlatformOperatorAccountRequest;

public interface PlatformOperatorAccountService {

    PlatformOperatorAccountResponse current();

    PlatformOperatorAccountResponse update(UpdatePlatformOperatorAccountRequest request);
}
