package com.pos.integrations.finance.service;

import com.pos.sales.entity.Sale;

public interface FinanceSaleIntegrationService {

    void onSaleCompleted(Sale sale);
}
