package com.pos.pharmacy.sales.service;

import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.security.PharmacyTenantContext;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacySaleQueryService {

    private final SaleRepository saleRepository;
    private final SaleMapper saleMapper;
    private final PharmacyCashierShiftRepository shiftRepository;

    public SaleResponse getByReceiptNumber(String receiptNumber) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByReceiptNumberAndCompanyId(receiptNumber, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound("Sale receipt", receiptNumber));
        return mapWithShift(sale);
    }

    public SaleResponse getById(UUID id) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Sale sale = saleRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> PharmacyErrors.notFound("Sale", id));
        return mapWithShift(sale);
    }

    public PageResponse<SaleResponse> mySales(Integer storeId, UUID shiftId, Pageable pageable) {
        UUID cashierId = PharmacyTenantContext.getUserId();
        Integer companyId = PharmacyTenantContext.getCompanyId();
        Page<Sale> page = saleRepository.findMySales(companyId, cashierId, storeId, shiftId, pageable);
        Map<UUID, PharmacyCashierShift> shifts = loadShifts(page.getContent());
        return PageResponse.from(page.map((sale) -> mapWithShift(sale, shifts)));
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
            null,
            status,
            shift.getOpenedAt(),
            shift.getClosedAt(),
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
