package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;
import com.pos.platform.dto.billing.BillingPaymentCreateResponse;
import com.pos.platform.dto.billing.BillingPaymentIntentResponse;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.BillingPaymentIntent;
import com.pos.platform.entity.Company;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingPaymentIntentRepository;
import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.BillingPaymentService;
import com.pos.platform.service.ClickBillingCallbackService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.PaymeBillingCallbackService;
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingMoney;
import com.pos.platform.service.support.BillingPaymentAuth;
import com.pos.platform.service.support.BillingPaymentUrlBuilder;
import com.pos.platform.service.support.BillingTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingPaymentServiceImpl implements BillingPaymentService {

    private final BillingPaymentIntentRepository intentRepository;
    private final CompanyRepository companyRepository;
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

        return new BillingPaymentCreateResponse(
            intent.getId(),
            provider,
            money,
            intent.getStatus(),
            paymentUrl(intent)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BillingPaymentIntentResponse> listForCompany(Integer companyId, Pageable pageable) {
        return PageResponse.from(
            intentRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable)
                .map(this::toResponse)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BillingPaymentIntentResponse> list(Integer companyId, BillingPaymentStatus status, Pageable pageable) {
        Page<BillingPaymentIntent> page;
        if (companyId != null && status != null) {
            page = intentRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status, pageable);
        } else if (companyId != null) {
            page = intentRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable);
        } else if (status != null) {
            page = intentRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = intentRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        Map<Integer, String> names = companyNames(page);
        return PageResponse.from(page.map(intent -> toResponse(intent, names.get(intent.getCompanyId()))));
    }

    @Override
    @Transactional(readOnly = true)
    public BillingPaymentIntentResponse getForCompany(Integer companyId, UUID id) {
        BillingPaymentIntent intent = intentRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Платёж не найден"));
        return toResponse(intent);
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

    private BillingPaymentIntentResponse toResponse(BillingPaymentIntent intent) {
        String name = companyRepository.findById(intent.getCompanyId()).map(Company::getName).orElse(null);
        return toResponse(intent, name);
    }

    private BillingPaymentIntentResponse toResponse(BillingPaymentIntent intent, String companyName) {
        boolean open = intent.getStatus() == BillingPaymentStatus.PENDING
            || intent.getStatus() == BillingPaymentStatus.PREPARED;
        return BillingMapper.toPayment(intent, companyName, open ? paymentUrl(intent) : null);
    }

    private String paymentUrl(BillingPaymentIntent intent) {
        if (intent.getProvider() == BillingPaymentProvider.CLICK) {
            return urlBuilder.click(intent.getId(), intent.getAmount());
        }
        return urlBuilder.payme(intent.getId(), intent.getAmount());
    }

    private Map<Integer, String> companyNames(Page<BillingPaymentIntent> page) {
        var ids = page.getContent().stream().map(BillingPaymentIntent::getCompanyId).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return companyRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(Company::getId, Company::getName, (a, b) -> a));
    }
}
