package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.BillingTopUpResponse;
import com.pos.platform.dto.billing.ReviewTopUpRequest;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.BillingTopUpRequest;
import com.pos.platform.entity.Company;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingTopUpRequestRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.security.PlatformTenantContext;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingTopUpService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingMoney;
import com.pos.platform.service.support.BillingReceiptStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillingTopUpServiceImpl implements BillingTopUpService {

    private final BillingTopUpRequestRepository topUpRepository;
    private final CompanyRepository companyRepository;
    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyBillingAccountService accountService;
    private final BillingLedgerService ledgerService;
    private final BillingReceiptStorage receiptStorage;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BillingTopUpResponse> list(BillingTopUpStatus status, Pageable pageable) {
        Page<BillingTopUpRequest> page = status == null
            ? topUpRepository.findAllByOrderByCreatedAtDesc(pageable)
            : topUpRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return PageResponse.from(page.map(this::mapTopUp));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BillingTopUpResponse> listForCompany(Integer companyId, Pageable pageable) {
        return PageResponse.from(
            topUpRepository.findByCompanyIdOrderByCreatedAtDesc(companyId, pageable).map(this::mapTopUp)
        );
    }

    @Override
    @Transactional
    public BillingTopUpResponse submit(Integer companyId, BigDecimal amount, String comment, MultipartFile receipt) {
        companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Компания не найдена"));
        accountService.requireOrCreateBilling(companyId);

        BigDecimal money = BillingMoney.of(amount);
        if (money.signum() <= 0) {
            throw new BadRequestException("Сумма пополнения должна быть больше 0");
        }

        BillingReceiptStorage.StoredReceipt stored = receiptStorage.store(companyId, receipt);
        BillingTopUpRequest req = BillingTopUpRequest.builder()
            .companyId(companyId)
            .amount(money)
            .status(BillingTopUpStatus.PENDING)
            .comment(BillingMoney.trimToNull(comment))
            .submittedByUserId(PlatformTenantContext.getUserId())
            .build();
        if (stored != null) {
            req.setReceiptFileName(stored.fileName());
            req.setReceiptContentType(stored.contentType());
            req.setReceiptStoragePath(stored.storagePath());
        }
        return mapTopUp(topUpRepository.save(req));
    }

    @Override
    @Transactional
    public BillingTopUpResponse approve(UUID requestId, ReviewTopUpRequest request) {
        BillingTopUpRequest req = requirePending(requestId);
        CompanyBilling billing = accountService.requireOrCreateBilling(req.getCompanyId());
        ledgerService.record(
            billing,
            req.getAmount(),
            BillingLedgerType.TOP_UP,
            "Пополнение по заявке " + req.getId()
        );
        accountService.refreshAccessStatus(billing, Instant.now());
        companyBillingRepository.save(billing);

        req.setStatus(BillingTopUpStatus.APPROVED);
        req.setReviewedByUserId(PlatformTenantContext.getUserId());
        req.setReviewedAt(Instant.now());
        req.setReviewNote(request != null ? BillingMoney.trimToNull(request.reviewNote()) : null);
        return mapTopUp(topUpRepository.save(req));
    }

    @Override
    @Transactional
    public BillingTopUpResponse reject(UUID requestId, ReviewTopUpRequest request) {
        BillingTopUpRequest req = requirePending(requestId);
        req.setStatus(BillingTopUpStatus.REJECTED);
        req.setReviewedByUserId(PlatformTenantContext.getUserId());
        req.setReviewedAt(Instant.now());
        req.setReviewNote(request != null ? BillingMoney.trimToNull(request.reviewNote()) : null);
        return mapTopUp(topUpRepository.save(req));
    }

    @Override
    @Transactional(readOnly = true)
    public long countPending() {
        return topUpRepository.countByStatus(BillingTopUpStatus.PENDING);
    }

    private BillingTopUpRequest requirePending(UUID requestId) {
        BillingTopUpRequest req = topUpRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Заявка не найдена"));
        if (req.getStatus() != BillingTopUpStatus.PENDING) {
            throw new BadRequestException("Заявка уже обработана");
        }
        return req;
    }

    private BillingTopUpResponse mapTopUp(BillingTopUpRequest req) {
        String name = companyRepository.findById(req.getCompanyId()).map(Company::getName).orElse(null);
        return BillingMapper.toTopUp(req, name);
    }
}
