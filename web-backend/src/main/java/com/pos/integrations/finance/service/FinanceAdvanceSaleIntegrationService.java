package com.pos.integrations.finance.service;

import com.pos.entity.Sale;

public interface FinanceAdvanceSaleIntegrationService {

    void onAdvanceSaleCompleted(Sale sale);
}
