package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.PharmacyReturnRowResponse;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.SaleMapper;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacySaleQueryService {

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Tashkent");
    private static final Set<SaleEnums.SaleStatus> RETURN_STATUSES = Set.of(
        SaleEnums.SaleStatus.VOIDED,
        SaleEnums.SaleStatus.REFUNDED
    );

    private final SaleRepository saleRepository;
    private final SaleMapper saleMapper;
    private final PharmacyCashierShiftRepository shiftRepository;

    public SaleResponse getByReceiptNumber(String receiptNumber) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByReceiptNumberAndCompanyId(receiptNumber, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacySaleErrors.PHARM_SALE_RECEIPT_NOT_FOUND, receiptNumber));
        return mapWithShift(sale);
    }

    public SaleResponse getById(UUID id) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacySaleErrors.PHARM_SALE_NOT_FOUND, id));
        return mapWithShift(sale);
    }

    public PageResponse<SaleResponse> mySales(Integer storeId, UUID shiftId, Pageable pageable) {
        UUID cashierId = PharmacyTenantContext.getUserId();
        Integer companyId = PharmacyTenantContext.getCompanyId();
        // Не (:shiftId IS NULL OR …) — PostgreSQL/Hibernate ломает typed null UUID.
        Page<Sale> page;
        if (shiftId != null && storeId != null) {
            page = saleRepository.findMySalesByStoreAndShift(companyId, cashierId, storeId, shiftId, pageable);
        } else if (shiftId != null) {
            page = saleRepository.findMySalesByShift(companyId, cashierId, shiftId, pageable);
        } else if (storeId != null) {
            page = saleRepository.findMySalesByStore(companyId, cashierId, storeId, pageable);
        } else {
            page = saleRepository.findMySalesAll(companyId, cashierId, pageable);
        }
        Map<UUID, PharmacyCashierShift> shifts = loadShifts(page.getContent());
        return PageResponse.from(page.map((sale) -> mapWithShift(sale, shifts)));
    }

    /** Журнал продаж компании (админ / менеджер). */
    public PageResponse<SaleResponse> listSales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search,
        String receiptNumber,
        String saleId,
        String cashierName,
        String paymentMethod,
        String status,
        Pageable pageable
    ) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Instant fromInstant = startOfDay(from);
        Instant toInstant = startOfNextDay(to);
        Page<Sale> page = saleRepository.searchCompanySales(
            companyId,
            storeId,
            fromInstant,
            toInstant,
            parsePayment(paymentMethod),
            parseStatus(status),
            blankToNull(search),
            blankToNull(receiptNumber),
            blankToNull(cashierName),
            parseUuid(saleId),
            pageable
        );
        Map<UUID, PharmacyCashierShift> shifts = loadShifts(page.getContent());
        return PageResponse.from(page.map((sale) -> mapWithShift(sale, shifts)));
    }

    /** Журнал возвратов: VOIDED / REFUNDED. */
    public PageResponse<PharmacyReturnRowResponse> listReturns(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        String search,
        String cashierName,
        Pageable pageable
    ) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Instant fromInstant = startOfDay(from);
        Instant toInstant = startOfNextDay(to);
        Page<Sale> page = saleRepository.searchCompanyReturns(
            companyId,
            storeId,
            fromInstant,
            toInstant,
            blankToNull(search),
            blankToNull(cashierName),
            RETURN_STATUSES,
            pageable
        );
        Map<UUID, PharmacyCashierShift> shifts = loadShifts(page.getContent());
        return PageResponse.from(page.map((sale) -> toReturnRow(sale, shifts)));
    }

    private PharmacyReturnRowResponse toReturnRow(Sale sale, Map<UUID, PharmacyCashierShift> shifts) {
        SaleResponse mapped = mapWithShift(sale, shifts);
        int positions = mapped.items() != null ? mapped.items().size() : 0;
        BigDecimal amount = mapped.returnAmount() != null && mapped.returnAmount().signum() > 0
            ? mapped.returnAmount()
            : (mapped.totalAmount() != null ? mapped.totalAmount() : BigDecimal.ZERO);
        String fiscal = firstNonBlank(mapped.fiscalSign(), mapped.fiscalReceiptSeq(), mapped.receiptNumber());
        return new PharmacyReturnRowResponse(
            mapped.id(),
            mapped.createdAt(),
            fiscal,
            amount,
            positions,
            mapped.storeName(),
            extractReturnReason(mapped.notes()),
            mapped.status(),
            mapped.receiptNumber(),
            mapped.cashierName(),
            mapped.storeId()
        );
    }

    private static String extractReturnReason(String notes) {
        if (!StringUtils.hasText(notes)) {
            return null;
        }
        String text = notes.trim();
        int voidAt = text.toUpperCase().lastIndexOf("VOID:");
        if (voidAt >= 0) {
            return text.substring(voidAt + 5).trim();
        }
        int partialAt = text.toUpperCase().lastIndexOf("PARTIAL_RETURN:");
        if (partialAt >= 0) {
            return text.substring(partialAt + 15).trim();
        }
        return text;
    }

    private SaleResponse mapWithShift(Sale sale) {
        Map<UUID, PharmacyCashierShift> shifts = loadShifts(List.of(sale));
        return mapWithShift(sale, shifts);
    }

    private SaleResponse mapWithShift(Sale sale, Map<UUID, PharmacyCashierShift> shifts) {
        UUID shiftId = sale.getCashierShiftId();
        PharmacyCashierShift shift = shiftId != null ? shifts.get(shiftId) : null;
        if (shift == null) {
            return saleMapper.toResponse(sale);
        }
        String status = shift.getStatus() != null ? shift.getStatus().name() : null;
        return saleMapper.toResponse(
            sale,
            shift.getStoreName(),
            status,
            shift.getOpenedAt(),
            shift.getClosedAt(),
            null,
            null
        );
    }

    private Map<UUID, PharmacyCashierShift> loadShifts(List<Sale> sales) {
        List<UUID> ids = sales.stream()
            .map(Sale::getCashierShiftId)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, PharmacyCashierShift> map = new HashMap<>();
        for (PharmacyCashierShift shift : shiftRepository.findAllById(ids)) {
            map.put(shift.getId(), shift);
        }
        return map;
    }

    /**
     * PostgreSQL cannot type-check {@code :instant IS NULL OR createdAt >= :instant}.
     * Always bind concrete bounds (same pattern as grocery SalesQuerySupport).
     */
    private static Instant startOfDay(LocalDate date) {
        if (date == null) {
            return Instant.EPOCH;
        }
        return date.atStartOfDay(REPORT_ZONE).toInstant();
    }

    private static Instant startOfNextDay(LocalDate date) {
        if (date == null) {
            return Instant.now().plus(3650, ChronoUnit.DAYS);
        }
        return date.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static UUID parseUuid(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static SaleEnums.PaymentMethod parsePayment(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return SaleEnums.PaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static SaleEnums.SaleStatus parseStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return SaleEnums.SaleStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }
}
