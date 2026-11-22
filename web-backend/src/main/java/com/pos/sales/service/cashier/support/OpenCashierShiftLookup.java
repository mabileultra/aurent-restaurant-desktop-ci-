package com.pos.sales.service.cashier.support;

import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * One OPEN shift per cashier+store. Race opens used to create duplicates;
 * {@code Optional} find then threw NonUnique and blocked POS open/current.
 */
@Component
@RequiredArgsConstructor
public class OpenCashierShiftLookup {

    private final CashierShiftRepository cashierShiftRepository;

    /** Read-safe: oldest OPEN if several exist (no write). */
    public Optional<CashierShift> findOpen(UUID cashierId, Integer storeId) {
        return cashierShiftRepository.findFirstByCashierIdAndStoreIdAndStatusOrderByOpenedAtAsc(
            cashierId,
            storeId,
            CashierShift.ShiftStatus.OPEN
        );
    }

    /** Write path: keep oldest OPEN, close extras. */
    @Transactional
    public Optional<CashierShift> findOpenAndCloseDuplicates(UUID cashierId, Integer storeId) {
        List<CashierShift> opens = cashierShiftRepository
            .findAllByCashierIdAndStoreIdAndStatusOrderByOpenedAtAsc(
                cashierId,
                storeId,
                CashierShift.ShiftStatus.OPEN
            );
        if (opens.isEmpty()) {
            return Optional.empty();
        }
        CashierShift keep = opens.get(0);
        if (opens.size() == 1) {
            return Optional.of(keep);
        }
        Instant now = Instant.now();
        for (int i = 1; i < opens.size(); i++) {
            CashierShift dup = opens.get(i);
            dup.setStatus(CashierShift.ShiftStatus.CLOSED);
            dup.setClosedAt(now);
            cashierShiftRepository.save(dup);
            LogUtil.warn(
                OpenCashierShiftLookup.class,
                "Closed duplicate OPEN cashier shift: keepId={}, closedId={}, storeId={}, cashierId={}",
                keep.getId(),
                dup.getId(),
                storeId,
                cashierId
            );
        }
        return Optional.of(keep);
    }
}
