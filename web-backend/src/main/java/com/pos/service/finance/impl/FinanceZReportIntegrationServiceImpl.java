package com.pos.service.finance.impl;

import com.pos.entity.CashierShift;
import com.pos.entity.ZReport;
import com.pos.service.finance.FinanceZReportIntegrationService;
import com.pos.service.finance.support.FinanceIntegrationPublisher;
import com.pos.service.finance.support.FinanceZReportPayloadBuilder;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceZReportIntegrationServiceImpl implements FinanceZReportIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onZReportCreated(ZReport zReport, CashierShift shift) {
        Map<String, Object> payload = FinanceZReportPayloadBuilder.build(zReport, shift);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishZReportIncomeAfterCommit(payload);
        LogUtil.info(
            FinanceZReportIntegrationServiceImpl.class,
            "Finance Z-report sync scheduled: zReportId={}, zNumber={}",
            zReport.getId(),
            zReport.getZNumber()
        );
    }
}
