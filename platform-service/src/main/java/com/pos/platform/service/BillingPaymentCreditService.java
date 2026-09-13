package com.pos.platform.service;

import com.pos.platform.entity.BillingPaymentIntent;

public interface BillingPaymentCreditService {

    void markPaid(BillingPaymentIntent intent, String providerTransId, String description);

    /** Reverse a previously credited Payme payment (Cancel after Perform). */
    void reversePaid(BillingPaymentIntent intent, String description);
}
