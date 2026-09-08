package com.pos.platform.service;

import com.pos.platform.entity.BillingPaymentIntent;

public interface BillingPaymentCreditService {

    void markPaid(BillingPaymentIntent intent, String providerTransId, String description);
}
