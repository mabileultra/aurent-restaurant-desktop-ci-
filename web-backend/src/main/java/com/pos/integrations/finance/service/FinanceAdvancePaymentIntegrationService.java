package com.pos.integrations.finance.service;

import com.pos.sales.entity.Sale;

public interface FinanceAdvancePaymentIntegrationService {

    void onSaleAdvanceApplied(Sale sale);
}
