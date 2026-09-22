package com.pos.integrations.pharmacy.service.impl;

import com.pos.integrations.pharmacy.repository.AslRequestLogRepository;
import com.pos.integrations.pharmacy.service.AslRequestLogRetentionService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AslRequestLogRetentionServiceImpl implements AslRequestLogRetentionService {

  private final AslRequestLogRepository repository;

  @Value("${app.pharmacy.asl.request-log.retention-days:30}")
  private int retentionDays;

  @Override
  @Transactional
  public int purgeExpired() {
    int days = Math.max(retentionDays, 1);
    Instant cutoff = Instant.now().minus(days, ChronoUnit.DAYS);
    int deleted = repository.deleteOlderThan(cutoff);
    if (deleted > 0) {
      LogUtil.info(
          AslRequestLogRetentionServiceImpl.class,
          "ASL request log retention purged={} olderThanDays={} cutoff={}",
          deleted,
          days,
          cutoff
      );
    }
    return deleted;
  }
}
