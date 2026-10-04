package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.shift.dto.PharmacyShiftResponse;
import com.pos.pharmacy.shift.dto.ShiftSoldItemsReport;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PharmacyShiftResponseAssembler {

    public PharmacyShiftResponse toResponse(PharmacyCashierShift shift) {
        return toResponse(shift, null);
    }

    public PharmacyShiftResponse toResponse(PharmacyCashierShift shift, ShiftSoldItemsReport soldItems) {
        return new PharmacyShiftResponse(
            shift.getId(),
            shift.getStoreId(),
            shift.getStoreName(),
            shift.getCashierName(),
            shift.getCashRegisterId(),
            shift.getRegisterNumber(),
            shift.getStatus() != null ? shift.getStatus().name() : null,
            shift.getOpenedAt(),
            shift.getClosedAt(),
            shift.getSaleCount(),
            nz(shift.getTotalAmount()),
            nz(shift.getCashAmount()),
            nz(shift.getCardAmount()),
            nz(shift.getVatAmount()),
            null,
            soldItems
        );
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
