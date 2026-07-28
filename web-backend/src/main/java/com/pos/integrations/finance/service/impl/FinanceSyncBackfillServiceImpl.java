package com.pos.integrations.finance.service.impl;

import com.pos.integrations.finance.dto.FinanceSyncBackfillResponse;
import com.pos.inventory.entity.StockReceipt;
import com.pos.sales.entity.ZReport;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.sales.repository.ZReportRepository;
import com.pos.integrations.finance.service.FinanceSyncBackfillService;
import com.pos.integrations.finance.service.support.FinanceIntegrationPublisher;
import com.pos.integrations.finance.service.support.FinancePurchasePayloadBuilder;
import com.pos.integrations.finance.service.support.FinanceZReportPayloadBuilder;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class FinanceSyncBackfillServiceImpl implements FinanceSyncBackfillService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final ZReportRepository zReportRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final FinanceIntegrationPublisher integrationPublisher;
    private final TenantAccessSupport tenantAccess;

    @Override
    public FinanceSyncBackfillResponse backfill(LocalDate from, LocalDate to, Set<String> types) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();

        int zReportsEnqueued = 0;
        int purchasesEnqueued = 0;
        int skipped = 0;

        if (types.contains("z-reports") || types.contains("sales")) {
            for (ZReport zReport : zReportRepository.findForFinanceBackfill(companyId, start, end)) {
                Map<String, Object> payload = FinanceZReportPayloadBuilder.build(zReport, null);
                if (payload == null) {
                    skipped++;
                    continue;
                }
                integrationPublisher.publishZReportIncomeAfterCommit(payload);
                zReportsEnqueued++;
            }
        }

        if (types.contains("purchases")) {
            for (StockReceipt receipt : stockReceiptRepository.findForFinanceBackfill(start, end, companyId)) {
                Map<String, Object> payload = FinancePurchasePayloadBuilder.build(receipt, "CASH");
                if (payload == null) {
                    skipped++;
                    continue;
                }
                integrationPublisher.publishPurchaseExpenseAfterCommit(payload);
                purchasesEnqueued++;
            }
        }

        return new FinanceSyncBackfillResponse(zReportsEnqueued, purchasesEnqueued, skipped);
    }
}
