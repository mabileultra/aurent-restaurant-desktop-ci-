package com.pos.restaurant.report.support;

import com.pos.restaurant.report.dto.ShiftCashReportRow;
import com.pos.restaurant.shift.domain.CashOpType;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.support.ShiftCashMath;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ShiftCashReportAssemblerTest {

    @Test
    void rowComputesExpectedAndCloseDiff() {
        RestaurantShift shift = RestaurantShift.builder()
            .id(UUID.randomUUID())
            .status(RestaurantShiftStatus.CLOSED)
            .openedAt(Instant.parse("2026-10-01T03:00:00Z"))
            .closedAt(Instant.parse("2026-10-01T15:00:00Z"))
            .openedByUserId(UUID.randomUUID())
            .openingCash(new BigDecimal("50000"))
            .cashAmount(new BigDecimal("20000"))
            .closingCash(new BigDecimal("68000"))
            .handoverExpected(new BigDecimal("50000"))
            .handoverDiff(BigDecimal.ZERO)
            .build();
        ShiftCashMath.Drawer drawer = ShiftCashMath.Drawer.zero()
            .plus(CashOpType.IN, new BigDecimal("3000"))
            .plus(CashOpType.COLLECTION, new BigDecimal("10000"));

        ShiftCashReportRow row = ShiftCashReportAssembler.toRow(shift, drawer);

        assertThat(row.expectedCash()).isEqualByComparingTo("63000.00");
        assertThat(row.difference()).isEqualByComparingTo("5000.00");
        assertThat(ShiftCashReportAssembler.totals(List.of(row)).difference()).isEqualByComparingTo("5000.00");
    }
}
