package com.pos.integrations.finance.service;

import com.pos.integrations.finance.dto.FinanceSyncOutboxDto;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface FinanceSyncAdminService {

    PageResponse<FinanceSyncOutboxDto> listOutbox(String status, Pageable pageable);

    void retryOutbox(UUID id);

    int retryPendingBatch();
}
