package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.PharmacyReturnRowResponse;
import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.support.PharmacySaleSettlementFilter;
import com.pos.pharmacy.sales.support.SaleMapper;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.blankToNull;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.boundedPage;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.extractReturnReason;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.firstNonBlank;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.parsePayment;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.parseStatus;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.parseUuid;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.startOfDay;
import static com.pos.pharmacy.sales.support.PharmacySaleQuerySupport.startOfNextDay;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacySaleQueryService {

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

    public PageResponse<SaleResponse> mySales(
        Integer storeId,
        UUID shiftId,
        String receiptNumber,
        String paymentMethod,
        String status,
        String paymentSettlement,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        UUID cashierId = PharmacyTenantContext.getUserId();
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Instant fromInstant = startOfDay(from);
        Instant toInstant = startOfNextDay(to);
        Pageable bounded = boundedPage(pageable);
        String settlement = PharmacySaleSettlementFilter.normalize(paymentSettlement);
        // Не (:shiftId IS NULL OR …) — PostgreSQL/Hibernate ломает typed null UUID.
        Page<Sale> page = shiftId != null
            ? saleRepository.searchMySalesByShift(
                companyId, cashierId, shiftId, storeId, fromInstant, toInstant,
                parsePayment(paymentMethod), parseStatus(status), settlement,
                blankToNull(receiptNumber), bounded
            )
            : saleRepository.searchMySales(
                companyId, cashierId, storeId, fromInstant, toInstant,
                parsePayment(paymentMethod), parseStatus(status), settlement,
                blankToNull(receiptNumber), bounded
            );
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
        String paymentSettlement,
        Pageable pageable
    ) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Instant fromInstant = startOfDay(from);
        Instant toInstant = startOfNextDay(to);
        Pageable bounded = boundedPage(pageable);
        Page<Sale> page = saleRepository.searchCompanySales(
            companyId,
            storeId,
            fromInstant,
            toInstant,
            parsePayment(paymentMethod),
            parseStatus(status),
            PharmacySaleSettlementFilter.normalize(paymentSettlement),
            blankToNull(search),
            blankToNull(receiptNumber),
            blankToNull(cashierName),
            parseUuid(saleId),
            bounded
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
        Pageable bounded = boundedPage(pageable);
        Page<Sale> page = saleRepository.searchCompanyReturns(
            companyId,
            storeId,
            fromInstant,
            toInstant,
            blankToNull(search),
            blankToNull(cashierName),
            RETURN_STATUSES,
            bounded
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
}
