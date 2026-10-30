package com.pos.platform.service.impl;

import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.domain.BillingTopUpStatus;
import com.pos.platform.dto.billing.BillingCollectionsOverviewResponse;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;
import com.pos.platform.dto.shared.PageResponse;
import com.pos.platform.entity.BillingLedgerEntry;
import com.pos.platform.entity.Company;
import com.pos.platform.repository.BillingLedgerRepository;
import com.pos.platform.repository.BillingTopUpRequestRepository;
import com.pos.platform.repository.CompanyRepository;
import com.pos.platform.service.BillingCollectionsService;
import com.pos.platform.service.CompanyBillingAccountService;
import com.pos.platform.service.support.BillingPaymentStateResolver;
import com.pos.platform.service.support.BillingTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BillingCollectionsServiceImpl implements BillingCollectionsService {

    private final CompanyBillingAccountService accountService;
    private final CompanyRepository companyRepository;
    private final BillingLedgerRepository ledgerRepository;
    private final BillingTopUpRequestRepository topUpRepository;
    private final BillingPaymentStateResolver stateResolver;

    @Override
    @Transactional(readOnly = true)
    public BillingCollectionsOverviewResponse overview() {
        List<CompanyPaymentRowResponse> rows = rows(Instant.now());
        BigDecimal mrr = BigDecimal.ZERO;
        BigDecimal debt = BigDecimal.ZERO;
        BigDecimal expectedSoon = BigDecimal.ZERO;
        for (CompanyPaymentRowResponse row : rows) {
            BillingPaymentState state = row.paymentState();
            CompanyBillingResponse billing = row.billing();
            if (state != BillingPaymentState.NOT_BILLED && state != BillingPaymentState.SUSPENDED) {
                mrr = mrr.add(orZero(billing.monthlyTotal()));
            }
            if (orZero(billing.balance()).signum() < 0) {
                debt = debt.add(billing.balance().negate());
            }
            if (state == BillingPaymentState.DUE_SOON) {
                expectedSoon = expectedSoon.add(
                    orZero(billing.monthlyTotal()).subtract(orZero(billing.balance()).max(BigDecimal.ZERO))
                );
            }
        }
        Map<BillingPaymentState, Long> counts = rows.stream()
            .collect(Collectors.groupingBy(CompanyPaymentRowResponse::paymentState, Collectors.counting()));
        return new BillingCollectionsOverviewResponse(
            rows.size(),
            rows.stream().filter(CompanyPaymentRowResponse::newCompany).count(),
            counts.getOrDefault(BillingPaymentState.ACTIVE, 0L),
            counts.getOrDefault(BillingPaymentState.DUE_SOON, 0L),
            counts.getOrDefault(BillingPaymentState.OVERDUE, 0L),
            counts.getOrDefault(BillingPaymentState.SUSPENDED, 0L),
            counts.getOrDefault(BillingPaymentState.NOT_BILLED, 0L),
            mrr,
            debt,
            expectedSoon,
            topUpRepository.countByStatus(BillingTopUpStatus.PENDING),
            stateResolver.dueSoonDays(),
            stateResolver.newCompanyDays()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompanyPaymentRowResponse> list(Filter filter) {
        String q = filter.search() != null ? filter.search().trim().toLowerCase(Locale.ROOT) : "";
        return rows(Instant.now()).stream()
            .filter(r -> filter.companyIds() == null || filter.companyIds().isEmpty()
                || filter.companyIds().contains(r.billing().companyId()))
            .filter(r -> filter.state() == null || r.paymentState() == filter.state())
            .filter(r -> !filter.newOnly() || r.newCompany())
            .filter(r -> filter.planId() == null || filter.planId().equals(r.billing().planId()))
            .filter(r -> filter.method() == null || filter.method() == r.lastPaymentMethod())
            .filter(r -> q.isEmpty() || matches(r, q))
            .filter(r -> inRange(r, filter))
            .filter(r -> filter.regionCode() == null || filter.regionCode().isBlank()
                || filter.regionCode().equals(r.regionCode()))
            .filter(r -> filter.districtCode() == null || filter.districtCode().isBlank()
                || filter.districtCode().equals(r.districtCode()))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CompanyPaymentRowResponse> listPaged(Filter filter, Pageable pageable) {
        return PageResponse.slice(list(filter), pageable);
    }

    private static boolean inRange(CompanyPaymentRowResponse row, Filter filter) {
        if (filter.from() == null && filter.to() == null) {
            return true;
        }
        DateField field = filter.dateField() != null ? filter.dateField() : DateField.NEXT_CHARGE;
        Instant value = switch (field) {
            case NEXT_CHARGE -> row.billing().nextChargeAt();
            case LAST_PAYMENT -> row.lastPaymentAt();
            case CREATED -> row.companyCreatedAt();
        };
        if (value == null) {
            return false;
        }
        LocalDate day = LocalDate.ofInstant(value, BillingTime.ZONE);
        return (filter.from() == null || !day.isBefore(filter.from()))
            && (filter.to() == null || !day.isAfter(filter.to()));
    }

    private List<CompanyPaymentRowResponse> rows(Instant now) {
        Map<Integer, Company> companies = companyRepository.findAll().stream()
            .collect(Collectors.toMap(Company::getId, Function.identity(), (a, b) -> a));
        Map<Integer, LastPayment> lastPayments = lastPayments();
        return accountService.list(null, null).stream()
            .map(billing -> toRow(billing, companies.get(billing.companyId()), lastPayments.get(billing.companyId()), now))
            .toList();
    }

    private CompanyPaymentRowResponse toRow(
        CompanyBillingResponse billing,
        Company company,
        LastPayment last,
        Instant now
    ) {
        BillingPaymentStateResolver.Resolution resolution = stateResolver.resolve(billing, now);
        Instant createdAt = company != null ? company.getCreatedAt() : null;
        return new CompanyPaymentRowResponse(
            billing,
            resolution.state(),
            resolution.daysUntilDue(),
            resolution.daysOverdue(),
            stateResolver.isNewCompany(createdAt, now),
            createdAt,
            company != null ? company.getPhone() : null,
            company != null ? company.getTin() : null,
            company != null ? company.getRegionCode() : null,
            company != null ? company.getDistrictCode() : null,
            last != null ? last.method() : null,
            last != null ? last.at() : null
        );
    }

    private Map<Integer, LastPayment> lastPayments() {
        return ledgerRepository.findLatestPaymentPerCompany().stream()
            .collect(Collectors.toMap(
                BillingLedgerEntry::getCompanyId,
                e -> new LastPayment(e.getPaymentMethod(), e.getCreatedAt()),
                (a, b) -> a
            ));
    }

    private static boolean matches(CompanyPaymentRowResponse row, String q) {
        CompanyBillingResponse b = row.billing();
        return Stream.of(
                b.companyName(),
                b.companyId() != null ? String.valueOf(b.companyId()) : null,
                row.companyPhone(),
                row.companyTin()
            )
            .filter(Objects::nonNull)
            .anyMatch(v -> v.toLowerCase(Locale.ROOT).contains(q));
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private record LastPayment(BillingPaymentMethod method, Instant at) {}
}
