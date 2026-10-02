package com.pos.restaurant.shift.support;

import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.shift.domain.RestaurantShiftStatus;
import com.pos.restaurant.shift.dto.ShiftItemRow;
import com.pos.restaurant.shift.dto.ShiftReportResponse;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShiftReportAssemblerTest {

    private final ShiftReportAssembler assembler = new ShiftReportAssembler();
    private final ShiftSaleAccumulator accumulator = new ShiftSaleAccumulator();

    private static RestaurantShift shift(String openingCash) {
        return RestaurantShift.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(1)
            .openedByUserId(UUID.randomUUID())
            .status(RestaurantShiftStatus.OPEN)
            .openedAt(Instant.parse("2026-10-01T03:00:00Z"))
            .openingCash(new BigDecimal(openingCash))
            .build();
    }

    @Test
    void expectedCashIsOpeningPlusNetCashSales() {
        RestaurantShift shift = shift("50000.00");
        accumulator.applyPayment(shift, PaymentMethod.CASH, new BigDecimal("100000.00"), null, null);
        accumulator.applyPayment(shift, PaymentMethod.CARD, new BigDecimal("80000.00"), null, null);
        accumulator.applyPayment(
            shift,
            PaymentMethod.MIXED,
            new BigDecimal("60000.00"),
            new BigDecimal("20000.00"),
            new BigDecimal("40000.00")
        );
        accumulator.applyPayment(shift, PaymentMethod.CREDIT, new BigDecimal("30000.00"), null, null);
        accumulator.applyPayment(shift, PaymentMethod.ADVANCE, new BigDecimal("25000.00"), null, null);
        accumulator.applyRefund(shift, PaymentMethod.CASH, new BigDecimal("10000.00"), null, null);

        ShiftReportResponse report = assembler.toReport("X", shift, null, null, Instant.now(), 1, List.of());

        assertEquals(new BigDecimal("110000.00"), report.cashAmount());
        assertEquals(new BigDecimal("160000.00"), report.expectedCash());
        assertEquals(new BigDecimal("50000.00"), report.openingCash());
    }

    @Test
    void expectedCashWithoutSalesEqualsOpening() {
        ShiftReportResponse report = assembler.toReport("X", shift("50000.00"), null, null, Instant.now(), 0, null);

        assertEquals(new BigDecimal("50000.00"), report.expectedCash());
        assertTrue(report.items().isEmpty());
    }

    @Test
    void expectedCashIncludesCashOps() {
        RestaurantShift shift = shift("50000.00");
        accumulator.applyPayment(shift, PaymentMethod.CASH, new BigDecimal("10000.00"), null, null);
        ShiftCashMath.Drawer drawer = ShiftCashMath.Drawer.zero()
            .plus(com.pos.restaurant.shift.domain.CashOpType.IN, new BigDecimal("4000"))
            .plus(com.pos.restaurant.shift.domain.CashOpType.OUT, new BigDecimal("1000"));

        ShiftReportResponse report = assembler.toReport(
            "X", shift, null, null, Instant.now(), 0, List.of(), drawer
        );

        assertEquals(new BigDecimal("63000.00"), report.expectedCash());
    }

    @Test
    void passesItemsThroughAndKeepsClosingCash() {
        RestaurantShift shift = shift("0.00");
        shift.setClosingCash(new BigDecimal("50000.00"));
        List<ShiftItemRow> items = List.of(
            new ShiftItemRow("Лагман", new BigDecimal("12.00"), new BigDecimal("360000.00")),
            new ShiftItemRow("Чай", new BigDecimal("30.00"), new BigDecimal("90000.00"))
        );

        ShiftReportResponse report = assembler.toReport("Z", shift, null, null, Instant.now(), 0, items);

        assertEquals("Z", report.reportType());
        assertEquals(items, report.items());
        assertEquals(new BigDecimal("50000.00"), report.closingCash());
    }
}
