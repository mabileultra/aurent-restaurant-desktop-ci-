package com.pos.integrations.finance.service.impl;

import com.pos.sales.entity.Sale;
import com.pos.integrations.finance.service.FinanceCreditSaleIntegrationService;
import com.pos.integrations.finance.service.support.FinanceCreditSalePayloadBuilder;
import com.pos.integrations.finance.service.support.FinanceIntegrationPublisher;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class FinanceCreditSaleIntegrationServiceImpl implements FinanceCreditSaleIntegrationService {

    private final FinanceIntegrationPublisher financeIntegrationPublisher;

    @Override
    public void onCreditSaleCompleted(Sale sale) {
        Map<String, Object> payload = FinanceCreditSalePayloadBuilder.build(sale);
        if (payload == null) {
            return;
        }
        financeIntegrationPublisher.publishCreditSaleAfterCommit(payload);
        LogUtil.info(FinanceCreditSaleIntegrationServiceImpl.class, "Finance credit sale sync scheduled: sale={}", sale.getId());
    }
}
