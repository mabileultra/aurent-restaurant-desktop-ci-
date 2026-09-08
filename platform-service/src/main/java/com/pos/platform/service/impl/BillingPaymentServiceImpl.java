package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.dto.billing.BillingPaymentCreateResponse;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.BillingPaymentService;
import com.pos.platform.service.ClickBillingCallbackService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.PaymeBillingCallbackService;
import com.pos.platform.service.support.BillingMoney;
import com.pos.platform.service.support.BillingPaymentAuth;
import com.pos.platform.service.support.BillingPaymentUrlBuilder;
import com.pos.platform.service.support.BillingTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingPaymentServiceImpl implements BillingPaymentService {

    private final BillingPaymentIntentRepository intentRepository;
    private final CompanyBillingAccountService accountService;
    private final BillingPaymentAuth auth;
    private final BillingPaymentUrlBuilder urlBuilder;
    private final ClickBillingCallbackService clickCallbacks;
    private final PaymeBillingCallbackService paymeCallbacks;

    @Override
    @Transactional
    public BillingPaymentCreateResponse createPayment(BillingPaymentProvider provider, BigDecimal amount) {
        Integer companyId = BillingTenantSupport.requireCompanyId();
        BigDecimal money = BillingMoney.of(amount);
        if (money.signum() <= 0) {
            throw new BadRequestException("Сумма должна быть больше 0");
        }
        if (provider == BillingPaymentProvider.CLICK && !auth.clickConfigured()) {
            throw new BadRequestException("Click не настроен. Укажите CLICK_MERCHANT_ID / SERVICE_ID / SECRET_KEY.");
        }
        if (provider == BillingPaymentProvider.PAYME && !auth.paymeConfigured()) {
            throw new BadRequestException("Payme не настроен. Укажите PAYME_MERCHANT_ID / SECRET_KEY.");
        }

        accountService.requireOrCreateBilling(companyId);
        BillingPaymentIntent intent = intentRepository.save(BillingPaymentIntent.builder()
            .companyId(companyId)
            .provider(provider)
            .amount(money)
            .currency("UZS")
            .status(BillingPaymentStatus.PENDING)
            .createdByUserId(PlatformTenantContext.getUserId())
            .build());

        String paymentUrl = provider == BillingPaymentProvider.CLICK
            ? urlBuilder.click(intent.getId(), money)
            : urlBuilder.payme(intent.getId(), money);

        return new BillingPaymentCreateResponse(
            intent.getId(),
            provider,
            money,
            intent.getStatus(),
            paymentUrl
        );
    }

    @Override
    public Map<String, Object> clickPrepare(Map<String, String> params) {
        return clickCallbacks.prepare(params);
    }

    @Override
    public Map<String, Object> clickComplete(Map<String, String> params) {
        return clickCallbacks.complete(params);
    }

    @Override
    public Object paymeHandle(Map<String, Object> body, String authHeader) {
        return paymeCallbacks.handle(body, authHeader);
    }

    @Override
    @Transactional(readOnly = true)
    public BillingPaymentIntent requireIntent(UUID id) {
        return intentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Платёж не найден"));
    }
}
