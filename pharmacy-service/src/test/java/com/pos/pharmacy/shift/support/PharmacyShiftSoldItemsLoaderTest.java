package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.shift.domain.PharmacyShiftStatus;
import com.pos.pharmacy.shift.dto.ShiftSoldItemsReport;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PharmacyShiftSoldItemsLoaderTest {

    @Test
    void loadsNetGoodsForThisCompanyAndShift() {
        SaleRepository sales = mock(SaleRepository.class);
        UUID shiftId = UUID.randomUUID();
        Instant opened = Instant.parse("2026-10-01T05:00:00Z");
        Instant closed = Instant.parse("2026-10-01T17:00:00Z");
        PharmacyCashierShift shift = PharmacyCashierShift.builder()
            .id(shiftId)
            .companyId(10)
            .storeId(3)
            .cashierId(UUID.randomUUID())
            .status(PharmacyShiftStatus.CLOSED)
            .openedAt(opened)
            .closedAt(closed)
            .build();
        when(sales.aggregateNetSoldByShift(10, shiftId)).thenReturn(List.<Object[]>of(
            new Object[] {"Парацетамол", new BigDecimal("2"), new BigDecimal("18000")}
        ));

        ShiftSoldItemsReport report = new PharmacyShiftSoldItemsLoader(sales).load(shift);

        verify(sales).aggregateNetSoldByShift(10, shiftId);
        assertEquals(opened, report.from());
        assertEquals(closed, report.to());
        assertEquals("Парацетамол", report.items().get(0).name());
        assertEquals(new BigDecimal("2.000"), report.items().get(0).quantity());
        assertEquals(new BigDecimal("18000.00"), report.items().get(0).amount());
    }
}
