package com.pos.sales.support;

import com.pos.sales.entity.CashierShift;
import com.pos.sales.service.cashier.support.OpenCashierShiftLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Resolves cash register id for an open cashier shift at a store (POS / offline sync). */
@Component
@RequiredArgsConstructor
public class CashierPosRegisterSupport {

    private final OpenCashierShiftLookup openCashierShiftLookup;

    public Long resolveOpenRegisterId(UUID cashierId, Integer storeId) {
        if (cashierId == null || storeId == null) {
            return null;
        }
        return openCashierShiftLookup.findOpen(cashierId, storeId)
            .map(CashierShift::getCashRegister)
            .map(r -> r != null ? r.getId() : null)
            .orElse(null);
    }
}
