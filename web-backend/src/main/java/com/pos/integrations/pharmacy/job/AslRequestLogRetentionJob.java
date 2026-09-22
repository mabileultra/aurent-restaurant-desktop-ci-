package com.pos.integrations.pharmacy.job;

import com.pos.integrations.pharmacy.service.AslRequestLogRetentionService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AslRequestLogRetentionJob {

  private final AslRequestLogRetentionService retentionService;

  /** Каждую ночь в 03:40 — удаляем записи старше retention-days (по умолчанию 30). */
  @Scheduled(cron = "${app.pharmacy.asl.request-log.purge-cron:0 40 3 * * *}")
  public void purge() {
    try {
      retentionService.purgeExpired();
    } catch (Exception ex) {
      LogUtil.error(AslRequestLogRetentionJob.class, "ASL request log purge failed", ex);
    }
  }
}
