package com.pos.integrations.pharmacy.service;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import com.pos.integrations.pharmacy.support.AslRequestLogCallContext;

public interface AslRequestLogWriteService {

  void record(AslRequestLogCallContext context);

  void recordNotSent(
      Integer companyId,
      Integer storeId,
      AslRequestOperation operation,
      String markCode,
      String message
  );

  void recordFinished(
      Integer companyId,
      Integer storeId,
      AslRequestOperation operation,
      String markCode,
      AslRequestOutcome outcome,
      boolean reached,
      Integer httpStatus,
      String endpoint,
      String aslStatus,
      String message,
      int durationMs
  );
}
