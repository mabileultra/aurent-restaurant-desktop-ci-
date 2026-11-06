package com.pos.sales.service.cashier.support;

import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.ShiftCashMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Live cash in the drawer for an open shift: net cash sales (current Z period)
 * plus cash-in minus cash-out movements since shift open.
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShiftCashDrawerBalance {

    private final CashierShiftAggregateLoader aggregateLoader;
    private final ShiftCashMovementRepository movementRepository;

    public BigDecimal currentCashAmount(CashierShift shift) {
        Instant periodFrom = shift.getPeriodStartedAt() != null
            ? shift.getPeriodStartedAt()
            : shift.getOpenedAt();
        Instant now = Instant.now();
        BigDecimal salesCash = aggregateLoader.loadForShift(shift, periodFrom, now).cashAmount();
        if (salesCash == null) {
            salesCash = BigDecimal.ZERO;
        }
        BigDecimal movementsNet = movementRepository.sumNetAmountByShiftId(shift.getId());
        if (movementsNet == null) {
            movementsNet = BigDecimal.ZERO;
        }
        return salesCash.add(movementsNet);
    }
}
