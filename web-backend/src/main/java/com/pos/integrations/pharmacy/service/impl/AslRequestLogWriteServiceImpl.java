package com.pos.integrations.pharmacy.service.impl;

import com.pos.integrations.pharmacy.domain.AslRequestOperation;
import com.pos.integrations.pharmacy.domain.AslRequestOutcome;
import com.pos.integrations.pharmacy.entity.AslRequestLog;
import com.pos.integrations.pharmacy.repository.AslRequestLogRepository;
import com.pos.integrations.pharmacy.service.AslRequestLogWriteService;
import com.pos.integrations.pharmacy.support.AslMarkCodeMasker;
import com.pos.integrations.pharmacy.support.AslRequestLogCallContext;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AslRequestLogWriteServiceImpl implements AslRequestLogWriteService {

  private final AslRequestLogRepository repository;
  private final AslMarkCodeMasker masker;

  @Override
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void record(AslRequestLogCallContext context) {
    if (context == null || context.getOutcome() == null) {
      return;
    }
    boolean reached = context.getOutcome() != AslRequestOutcome.NOT_SENT;
    recordFinished(
        context.getCompanyId(),
        context.getStoreId(),
        context.getOperation(),
        context.getMarkCode(),
        context.getOutcome(),
        reached,
        context.getHttpStatus(),
        context.getEndpoint(),
        context.getAslStatus(),
        context.getMessage(),
        context.durationMs()
    );
  }

  @Override
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void recordNotSent(
      Integer companyId,
      Integer storeId,
      AslRequestOperation operation,
      String markCode,
      String message
  ) {
    recordFinished(
        companyId,
        storeId,
        operation,
        markCode,
        AslRequestOutcome.NOT_SENT,
        false,
        null,
        null,
        null,
        message,
        0
    );
  }

  @Override
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void recordFinished(
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
  ) {
    if (companyId == null || storeId == null || operation == null || outcome == null) {
      return;
    }
    AslRequestLog row = AslRequestLog.builder()
        .companyId(companyId)
        .storeId(storeId)
        .operation(operation)
        .outcome(outcome)
        .reached(reached)
        .httpStatus(httpStatus)
        .endpoint(endpoint)
        .markCodeShort(masker.shortCode(markCode))
        .aslStatus(truncate(aslStatus, 64))
        .message(masker.truncateMessage(message))
        .durationMs(Math.max(durationMs, 0))
        .createdAt(Instant.now())
        .build();
    repository.save(row);
    LogUtil.info(
        AslRequestLogWriteServiceImpl.class,
        "ASL request log op={} outcome={} reached={} storeId={} http={} durMs={}",
        operation,
        outcome,
        reached,
        storeId,
        httpStatus,
        durationMs
    );
  }

  private static String truncate(String value, int max) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    if (trimmed.length() <= max) {
      return trimmed;
    }
    return trimmed.substring(0, max);
  }
}
