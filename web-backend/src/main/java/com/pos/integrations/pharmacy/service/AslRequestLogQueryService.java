package com.pos.integrations.pharmacy.service;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import com.pos.integrations.pharmacy.dto.AslRequestLogItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface AslRequestLogQueryService {

  Page<AslRequestLogItemResponse> search(
      Integer storeId,
      AslRequestOperation operation,
      AslRequestOutcome outcome,
      Boolean reached,
      Instant from,
      Instant to,
      String search,
      Pageable pageable
  );
}
