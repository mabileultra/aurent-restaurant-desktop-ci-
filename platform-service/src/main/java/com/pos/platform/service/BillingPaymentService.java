package com.pos.platform.service;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.dto.billing.BillingPaymentCreateResponse;
import com.pos.platform.dto.billing.BillingPaymentIntentResponse;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.BillingPaymentIntent;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface BillingPaymentService {

    BillingPaymentCreateResponse createPayment(BillingPaymentProvider provider, BigDecimal amount);

    PageResponse<BillingPaymentIntentResponse> listForCompany(Integer companyId, Pageable pageable);

    PageResponse<BillingPaymentIntentResponse> list(Integer companyId, BillingPaymentStatus status, Pageable pageable);

    BillingPaymentIntentResponse getForCompany(Integer companyId, UUID id);

    Map<String, Object> clickPrepare(Map<String, String> params);

    Map<String, Object> clickComplete(Map<String, String> params);

    Object paymeHandle(Map<String, Object> body, String authHeader);

    BillingPaymentIntent requireIntent(UUID id);
}
