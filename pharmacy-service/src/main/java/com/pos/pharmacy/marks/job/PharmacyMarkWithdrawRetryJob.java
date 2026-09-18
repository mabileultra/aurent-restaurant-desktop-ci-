package com.pos.pharmacy.marks.job;

import com.pos.pharmacy.marks.service.PharmacyMarkWithdrawService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PharmacyMarkWithdrawRetryJob {

    private final PharmacyMarkWithdrawService markWithdrawService;

    @Scheduled(fixedDelayString = "${app.pharmacy.mark-withdraw.retry-ms:30000}")
    public void retryPending() {
        int confirmed = markWithdrawService.processPendingBatch();
        if (confirmed > 0) {
            LogUtil.info(PharmacyMarkWithdrawRetryJob.class, "Confirmed {} stock mark withdraw rows", confirmed);
        }
    }
}
