package com.pos.service.crm;

import com.pos.dto.crm.internal.CustomerSyncRequest;

public interface CrmCustomerSyncService {

    void sync(CustomerSyncRequest request);
}
