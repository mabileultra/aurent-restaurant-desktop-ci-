package com.pos.platform.service;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.dto.billing.BillingPaymentCreateResponse;
import com.pos.platform.entity.BillingPaymentIntent;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface BillingPaymentService {

    BillingPaymentCreateResponse createPayment(BillingPaymentProvider provider, BigDecimal amount);

    Map<String, Object> clickPrepare(Map<String, String> params);

    Map<String, Object> clickComplete(Map<String, String> params);

    Object paymeHandle(Map<String, Object> body, String authHeader);

    BillingPaymentIntent requireIntent(UUID id);
}
