package com.pos.integrations.finance.service;

import com.pos.entity.Sale;

public interface FinanceSaleIntegrationService {

    void onSaleCompleted(Sale sale);
}
