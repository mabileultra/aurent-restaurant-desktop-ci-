package com.pos.sales.service.cashier.support;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.sales.dto.cashier.ShiftSoldItemsReport;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.sale.ShiftReportRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ShiftSoldItemsLoaderTest {

    @Test
    void usesShiftRowsAndDoesNotFallBack() {
        ShiftReportRepository repo = mock(ShiftReportRepository.class);
        CashierShift shift = shift();
        Instant from = Instant.parse("2026-10-01T06:00:00Z");
        Instant to = Instant.parse("2026-10-01T18:00:00Z");
        when(repo.aggregateSoldItemsByShiftId(shift.getId(), from, to)).thenReturn(List.<Object[]>of(
            new Object[] {"Молоко", new BigDecimal("2"), new BigDecimal("14000")}
        ));

        ShiftSoldItemsReport report = new ShiftSoldItemsLoader(repo).load(shift, from, to);

        assertEquals(from, report.from());
        assertEquals(to, report.to());
        assertEquals(1, report.items().size());
        assertEquals("Молоко", report.items().get(0).name());
        verify(repo, never()).aggregateSoldItemsByCashierAndTime(
            shift.getCashier().getId(), shift.getStore().getId(), from, to
        );
    }

    @Test
    void fallsBackToCashierWindowWhenTheShiftHasNoLinkedSales() {
        ShiftReportRepository repo = mock(ShiftReportRepository.class);
        CashierShift shift = shift();
        Instant from = Instant.parse("2026-10-01T06:00:00Z");
        Instant to = Instant.parse("2026-10-01T18:00:00Z");
        when(repo.aggregateSoldItemsByShiftId(shift.getId(), from, to)).thenReturn(List.of());
        when(repo.aggregateSoldItemsByCashierAndTime(shift.getCashier().getId(), shift.getStore().getId(), from, to))
            .thenReturn(List.<Object[]>of(new Object[] {"Хлеб", BigDecimal.ONE, new BigDecimal("4000")}));

        ShiftSoldItemsReport report = new ShiftSoldItemsLoader(repo).load(shift, from, to);

        assertEquals("Хлеб", report.items().get(0).name());
        assertEquals(new BigDecimal("4000.00"), report.items().get(0).amount());
    }

    private static CashierShift shift() {
        User cashier = User.builder().id(UUID.randomUUID()).fullName("Кассир").build();
        Store store = Store.builder().id(9).name("Магазин").build();
        return CashierShift.builder()
            .id(UUID.randomUUID())
            .cashier(cashier)
            .store(store)
            .status(CashierShift.ShiftStatus.OPEN)
            .openedAt(Instant.parse("2026-10-01T04:00:00Z"))
            .periodStartedAt(Instant.parse("2026-10-01T06:00:00Z"))
            .saleCount(0)
            .totalAmount(BigDecimal.ZERO)
            .cashAmount(BigDecimal.ZERO)
            .cardAmount(BigDecimal.ZERO)
            .vatAmount(BigDecimal.ZERO)
            .build();
    }
}
