package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.AdjustBalanceRequest;
import com.pos.platform.dto.billing.AssignCompanyPlanRequest;
import com.pos.platform.dto.billing.BillingAccessResponse;
import com.pos.platform.dto.billing.BillingOverviewResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.entity.Company;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.exception.BadRequestException;
import com.pos.platform.exception.ResourceNotFoundException;
import com.pos.platform.repository.BillingTopUpRequestRepository;
import com.pos.platform.repository.CompanyBillingRepository;
import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.service.BillingLedgerService;
import com.pos.platform.service.BillingPlanService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingAccessCache;
import com.pos.platform.service.support.BillingAccessNoticeResolver;
import com.pos.platform.service.support.BillingChargeEngine;
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingMoney;
import com.pos.platform.service.support.BillingTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyBillingAccountServiceImpl implements CompanyBillingAccountService {

    private final BillingAccessNoticeResolver noticeResolver;
    private final BillingChargeEngine chargeEngine;
    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyRepository companyRepository;
    private final BillingTopUpRequestRepository topUpRepository;
    private final BillingPlanService planService;
    private final BillingLedgerService ledgerService;
    private final BillingAccessCache accessCache;

    @Override
    @Transactional(readOnly = true)
    public BillingOverviewResponse overview() {
        BigDecimal mrr = companyBillingRepository.findAllDetailed().stream()
            .filter(CompanyBilling::isBillingEnabled)
            .filter(b -> b.getStatus() == BillingAccountStatus.ACTIVE
                || b.getStatus() == BillingAccountStatus.GRACE
                || b.getStatus() == BillingAccountStatus.TRIAL)
            .map(BillingMapper::monthlyTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new BillingOverviewResponse(
            mrr,
            companyBillingRepository.countByStatus(BillingAccountStatus.ACTIVE)
                + companyBillingRepository.countByStatus(BillingAccountStatus.TRIAL),
            companyBillingRepository.countByStatus(BillingAccountStatus.GRACE),
            companyBillingRepository.countByStatus(BillingAccountStatus.BLOCKED),
            topUpRepository.countByStatus(BillingTopUpStatus.PENDING)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyBillingResponse> list(BillingAccountStatus status, String search) {
        String q = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";
        Map<Integer, CompanyBilling> byCompany = companyBillingRepository.findAllDetailed().stream()
            .collect(Collectors.toMap(CompanyBilling::getCompanyId, b -> b, (a, b) -> a));

        return companyRepository.findAll().stream()
            .filter(c -> q.isEmpty()
                || (c.getName() != null && c.getName().toLowerCase(Locale.ROOT).contains(q)))
            .map(company -> {
                CompanyBilling billing = byCompany.get(company.getId());
                return billing != null ? BillingMapper.toCompany(billing) : BillingMapper.emptyCompany(company);
            })
            .filter(b -> {
                if (status == null) {
                    return true;
                }
                CompanyBilling existing = byCompany.get(b.companyId());
                return existing != null && existing.getStatus() == status;
            })
            .sorted(Comparator.comparing(
                CompanyBillingResponse::companyName,
                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
            ))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyBillingResponse get(Integer companyId) {
        return BillingMapper.toCompany(requireBilling(companyId));
    }

    @Override
    @Transactional
    public CompanyBillingResponse assignPlan(Integer companyId, AssignCompanyPlanRequest request) {
        requireCompany(companyId);
        CompanyBilling billing = ensureBillingRow(companyId);
        if (request.planId() != null) {
            billing.setPlan(planService.requirePlan(request.planId()));
        } else {
            billing.setPlan(null);
        }
        if (request.addonMonthlyAmount() != null) {
            billing.setAddonMonthlyAmount(BillingMoney.of(request.addonMonthlyAmount()));
        }
        if (request.autoChargeEnabled() != null) {
            billing.setAutoChargeEnabled(request.autoChargeEnabled());
        }
        if (request.billingEnabled() != null) {
            billing.setBillingEnabled(request.billingEnabled());
        }
        chargeEngine.applyChargeStart(billing, request.periodStartOn());
        if (billing.getStatus() == null || billing.getStatus() == BillingAccountStatus.BLOCKED) {
            billing.setStatus(BillingAccountStatus.ACTIVE);
            billing.setGraceUntil(null);
        }
        chargeEngine.applyDueCharges(billing, Instant.now());
        CompanyBillingResponse saved = BillingMapper.toCompany(companyBillingRepository.save(billing));
        accessCache.evict(companyId);
        return saved;
    }

    @Override
    @Transactional
    public CompanyBillingResponse adjustBalance(Integer companyId, AdjustBalanceRequest request, boolean credit) {
        CompanyBilling billing = companyBillingRepository.findDetailedByCompanyIdForUpdate(companyId)
            .orElseGet(() -> requireOrCreateBilling(companyId));
        BigDecimal delta = BillingMoney.of(request.amount());
        if (delta.signum() <= 0) {
            throw new BadRequestException("Сумма должна быть больше 0");
        }
        if (!credit) {
            delta = delta.negate();
        }
        String description = request.description() != null && !request.description().isBlank()
            ? request.description()
            : (credit ? "Ручное пополнение супер-админом" : "Корректировка / списание супер-админом");
        if (credit) {
            BillingPaymentMethod method = request.method() != null ? request.method() : BillingPaymentMethod.OTHER;
            ledgerService.recordPayment(billing, delta, method, description);
        } else {
            ledgerService.record(billing, delta, BillingLedgerType.ADJUST, description);
        }
        chargeEngine.refreshAccessStatus(billing, Instant.now());
        CompanyBillingResponse saved = BillingMapper.toCompany(companyBillingRepository.save(billing));
        accessCache.evict(companyId);
        return saved;
    }

    @Override
    @Transactional
    public CompanyBillingResponse setBlocked(Integer companyId, boolean blocked) {
        CompanyBilling billing = requireOrCreateBilling(companyId);
        if (blocked) {
            billing.setStatus(BillingAccountStatus.BLOCKED);
            billing.setGraceUntil(null);
        } else {
            billing.setStatus(BillingAccountStatus.ACTIVE);
            billing.setGraceUntil(null);
            if (billing.getPaidUntil() == null || billing.getPaidUntil().isBefore(Instant.now())) {
                chargeEngine.advancePeriod(billing, Instant.now());
            }
        }
        CompanyBillingResponse saved = BillingMapper.toCompany(companyBillingRepository.save(billing));
        accessCache.evict(companyId);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyBillingResponse tenantSnapshot() {
        Integer companyId = BillingTenantSupport.requireCompanyId();
        return companyBillingRepository.findDetailedByCompanyId(companyId)
            .map(BillingMapper::toCompany)
            .orElseGet(() -> BillingMapper.emptyCompany(
                companyRepository.findById(companyId).orElse(null),
                companyId
            ));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = BillingAccessCache.CACHE_NAME, key = "#companyId")
    public BillingAccessResponse accessForCompany(Integer companyId) {
        Instant now = Instant.now();
        return companyBillingRepository.findDetailedByCompanyId(companyId)
            .map(b -> {
                boolean enabled = b.isBillingEnabled();
                boolean allowed = !enabled || b.getStatus() != BillingAccountStatus.BLOCKED;
                BillingAccessNoticeResolver.Notice notice = allowed
                    ? noticeResolver.resolve(b, now)
                    : BillingAccessNoticeResolver.Notice.none();
                return new BillingAccessResponse(
                    companyId,
                    enabled,
                    allowed,
                    b.getStatus(),
                    notice.required(),
                    notice.kind(),
                    notice.nextChargeAt(),
                    notice.graceUntil(),
                    notice.graceDaysLeft()
                );
            })
            .orElseGet(() -> new BillingAccessResponse(companyId, false, true, BillingAccountStatus.ACTIVE));
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyBilling requireBilling(Integer companyId) {
        return companyBillingRepository.findDetailedByCompanyId(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Биллинг для компании не настроен"));
    }

    @Override
    @Transactional
    public CompanyBilling requireOrCreateBilling(Integer companyId) {
        return ensureBillingRow(companyId);
    }

    @Override
    public void refreshAccessStatus(CompanyBilling billing, Instant now) {
        chargeEngine.refreshAccessStatus(billing, now);
    }

    @Override
    public int applyDueCharges(CompanyBilling billing, Instant now) {
        return chargeEngine.applyDueCharges(billing, now);
    }

    @Override
    public void advancePeriod(CompanyBilling billing, Instant from) {
        chargeEngine.advancePeriod(billing, from);
    }

    private CompanyBilling ensureBillingRow(Integer companyId) {
        if (companyId == null) {
            throw new BadRequestException("Company id is required");
        }
        return companyBillingRepository.findDetailedByCompanyId(companyId)
            .orElseGet(() -> {
                requireCompany(companyId);
                companyBillingRepository.insertBlankIfAbsent(companyId);
                return companyBillingRepository.findDetailedByCompanyId(companyId)
                    .orElseThrow(() -> new IllegalStateException(
                        "Не удалось создать billing для компании " + companyId
                    ));
            });
    }

    private Company requireCompany(Integer companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Компания не найдена"));
    }
}
