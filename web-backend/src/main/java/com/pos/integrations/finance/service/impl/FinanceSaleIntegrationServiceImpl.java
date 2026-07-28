package com.pos.integrations.finance.service.impl;

import com.pos.sales.entity.Sale;
import com.pos.integrations.finance.service.FinanceSaleIntegrationService;
import com.pos.integrations.finance.service.support.FinanceIntegrationPublisher;
import com.pos.integrations.finance.service.support.FinanceSalePayloadBuilder;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceSaleIntegrationServiceImpl implements FinanceSaleIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onSaleCompleted(Sale sale) {
        Map<String, Object> payload = FinanceSalePayloadBuilder.build(sale);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishSaleIncomeAfterCommit(payload);
        LogUtil.info(FinanceSaleIntegrationServiceImpl.class, "Finance sale sync scheduled: sale={}", sale.getId());
    }
}
