package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.AdjustBalanceRequest;
import com.pos.platform.dto.billing.AssignCompanyPlanRequest;
import com.pos.platform.dto.billing.BillingAccessResponse;
import com.pos.platform.dto.billing.BillingOverviewResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.entity.BillingPlan;
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
import com.pos.platform.service.support.BillingMapper;
import com.pos.platform.service.support.BillingMoney;
import com.pos.platform.service.support.BillingTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyBillingAccountServiceImpl implements CompanyBillingAccountService {

    private final CompanyBillingRepository companyBillingRepository;
    private final CompanyRepository companyRepository;
    private final BillingTopUpRequestRepository topUpRepository;
    private final BillingPlanService planService;
    private final BillingLedgerService ledgerService;

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
                return billing != null ? BillingMapper.toCompany(billing) : emptyBilling(company);
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
        Company company = requireCompany(companyId);
        BillingPlan plan = planService.requirePlan(request.planId());

        CompanyBilling billing = companyBillingRepository.findDetailedByCompanyId(companyId)
            .orElseGet(() -> CompanyBilling.builder().company(company).companyId(companyId).build());

        billing.setCompany(company);
        billing.setPlan(plan);
        if (request.addonMonthlyAmount() != null) {
            billing.setAddonMonthlyAmount(BillingMoney.of(request.addonMonthlyAmount()));
        }
        if (request.autoChargeEnabled() != null) {
            billing.setAutoChargeEnabled(request.autoChargeEnabled());
        }
        if (request.billingEnabled() != null) {
            billing.setBillingEnabled(request.billingEnabled());
        }
        if (billing.getNextChargeAt() == null) {
            advancePeriod(billing, Instant.now());
        }
        if (billing.getStatus() == null) {
            billing.setStatus(BillingAccountStatus.ACTIVE);
        }
        return BillingMapper.toCompany(companyBillingRepository.save(billing));
    }

    @Override
    @Transactional
    public CompanyBillingResponse adjustBalance(Integer companyId, AdjustBalanceRequest request, boolean credit) {
        CompanyBilling billing = requireOrCreateBilling(companyId);
        BigDecimal delta = BillingMoney.of(request.amount());
        if (delta.signum() <= 0) {
            throw new BadRequestException("Сумма должна быть больше 0");
        }
        if (!credit) {
            delta = delta.negate();
        }
        ledgerService.record(
            billing,
            delta,
            credit ? BillingLedgerType.TOP_UP : BillingLedgerType.ADJUST,
            request.description() != null && !request.description().isBlank()
                ? request.description()
                : (credit ? "Ручное пополнение супер-админом" : "Корректировка / списание супер-админом")
        );
        refreshAccessStatus(billing, Instant.now());
        return BillingMapper.toCompany(companyBillingRepository.save(billing));
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
                advancePeriod(billing, Instant.now());
            }
        }
        return BillingMapper.toCompany(companyBillingRepository.save(billing));
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyBillingResponse tenantSnapshot() {
        Integer companyId = BillingTenantSupport.requireCompanyId();
        return companyBillingRepository.findDetailedByCompanyId(companyId)
            .map(BillingMapper::toCompany)
            .orElseGet(() -> emptyBilling(companyRepository.findById(companyId).orElse(null), companyId));
    }

    @Override
    @Transactional(readOnly = true)
    public BillingAccessResponse accessForCompany(Integer companyId) {
        return companyBillingRepository.findById(companyId)
            .map(b -> {
                boolean enabled = b.isBillingEnabled();
                boolean allowed = !enabled || b.getStatus() != BillingAccountStatus.BLOCKED;
                return new BillingAccessResponse(companyId, enabled, allowed, b.getStatus());
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
        return companyBillingRepository.findDetailedByCompanyId(companyId)
            .orElseGet(() -> {
                Company company = requireCompany(companyId);
                return companyBillingRepository.save(CompanyBilling.builder()
                    .company(company)
                    .companyId(companyId)
                    .balance(BigDecimal.ZERO)
                    .status(BillingAccountStatus.ACTIVE)
                    .billingEnabled(true)
                    .autoChargeEnabled(true)
                    .addonMonthlyAmount(BigDecimal.ZERO)
                    .build());
            });
    }

    @Override
    public void refreshAccessStatus(CompanyBilling billing, Instant now) {
        if (!billing.isBillingEnabled()) {
            billing.setStatus(BillingAccountStatus.ACTIVE);
            return;
        }
        if (billing.getStatus() == BillingAccountStatus.BLOCKED) {
            BigDecimal total = BillingMapper.monthlyTotal(billing);
            if (billing.getBalance().compareTo(total) >= 0) {
                billing.setStatus(BillingAccountStatus.ACTIVE);
                billing.setGraceUntil(null);
                if (billing.getNextChargeAt() == null || billing.getNextChargeAt().isBefore(now)) {
                    advancePeriod(billing, now);
                }
            }
            return;
        }
        if (billing.getStatus() == BillingAccountStatus.GRACE) {
            BigDecimal total = BillingMapper.monthlyTotal(billing);
            if (billing.getBalance().compareTo(total) >= 0) {
                billing.setStatus(BillingAccountStatus.ACTIVE);
                billing.setGraceUntil(null);
            }
        }
    }

    @Override
    public void advancePeriod(CompanyBilling billing, Instant from) {
        Instant next = from.plus(30, ChronoUnit.DAYS);
        billing.setNextChargeAt(next);
        billing.setPaidUntil(next);
    }

    private Company requireCompany(Integer companyId) {
        return companyRepository.findById(companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Компания не найдена"));
    }

    private static CompanyBillingResponse emptyBilling(Company company) {
        return emptyBilling(company, company.getId());
    }

    private static CompanyBillingResponse emptyBilling(Company company, Integer companyId) {
        return new CompanyBillingResponse(
            companyId,
            company != null ? company.getName() : null,
            null,
            null,
            null,
            null,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BillingAccountStatus.ACTIVE,
            false,
            true,
            null,
            null,
            null,
            null,
            null,
            "UZS"
        );
    }
}
