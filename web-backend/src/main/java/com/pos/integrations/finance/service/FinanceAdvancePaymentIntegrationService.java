package com.pos.integrations.finance.service;

import com.pos.entity.Sale;

public interface FinanceAdvancePaymentIntegrationService {

    void onSaleAdvanceApplied(Sale sale);
}
