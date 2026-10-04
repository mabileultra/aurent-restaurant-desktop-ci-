package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.shift.dto.ShiftSoldItemsReport;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** Net goods sold on a pharmacy shift (completed and partially refunded). */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacyShiftSoldItemsLoader {

    private final SaleRepository saleRepository;

    public ShiftSoldItemsReport load(PharmacyCashierShift shift) {
        Instant from = shift.getOpenedAt();
        Instant to = shift.getClosedAt() != null ? shift.getClosedAt() : Instant.now();
        List<Object[]> rows = saleRepository.aggregateNetSoldByShift(shift.getCompanyId(), shift.getId());
        return new ShiftSoldItemsReport(from, to, PharmacyShiftSoldItemsRows.map(rows));
    }
}
