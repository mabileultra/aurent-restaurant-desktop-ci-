package com.pos.integrations.finance.service;

import com.pos.entity.Sale;

public interface FinanceCreditSaleIntegrationService {

    void onCreditSaleCompleted(Sale sale);
}
