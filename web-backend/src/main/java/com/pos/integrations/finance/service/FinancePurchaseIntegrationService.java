package com.pos.integrations.finance.service;

import com.pos.entity.StockReceipt;

public interface FinancePurchaseIntegrationService {

    void onPurchaseCompleted(StockReceipt receipt, String paymentType);
}
