package com.pos.pharmacy.shift.service.impl;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.shift.domain.PharmacyShiftStatus;
import com.pos.pharmacy.shift.dto.PharmacyShiftResponse;
import com.pos.pharmacy.shift.dto.ShiftItemRow;
import com.pos.pharmacy.shift.dto.ShiftSoldItemsReport;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import com.pos.pharmacy.shift.repository.PharmacyCashierShiftRepository;
import com.pos.pharmacy.shift.support.PharmacyShiftLookup;
import com.pos.pharmacy.shift.support.PharmacyShiftResponseAssembler;
import com.pos.pharmacy.shift.support.PharmacyShiftSoldItemsLoader;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PharmacyShiftCloseSoldItemsTest {

    @AfterEach
    void clearTenant() {
        PharmacyTenantContext.clear();
    }

    @Test
    void closeReturnsTheGoodsSlipAfterTheShiftIsMarkedClosed() {
        UUID cashierId = UUID.randomUUID();
        PharmacyTenantContext.set(10, cashierId, "CASHIER");
        PharmacyCashierShift shift = openShift(cashierId);
        PharmacyShiftLookup lookup = mock(PharmacyShiftLookup.class);
        PharmacyShiftSoldItemsLoader loader = mock(PharmacyShiftSoldItemsLoader.class);
        when(lookup.require(shift.getId())).thenReturn(shift);
        when(loader.load(shift)).thenAnswer(invocation -> {
            PharmacyCashierShift closed = invocation.getArgument(0);
            assertEquals(PharmacyShiftStatus.CLOSED, closed.getStatus());
            return new ShiftSoldItemsReport(
                closed.getOpenedAt(),
                closed.getClosedAt(),
                List.of(new ShiftItemRow("Парацетамол", new BigDecimal("2.000"), new BigDecimal("18000.00")))
            );
        });
        PharmacyCashierShiftServiceImpl service = service(lookup, loader);

        PharmacyShiftResponse response = service.close(shift.getId(), null);

        assertEquals("CLOSED", response.status());
        assertEquals(1, response.soldItems().items().size());
        assertEquals("Парацетамол", response.soldItems().items().get(0).name());
        assertEquals(shift.getOpenedAt(), response.soldItems().from());
        assertEquals(shift.getClosedAt(), response.soldItems().to());
    }

    @Test
    void openResponseHasNoGoodsSlip() {
        PharmacyShiftResponse response = new PharmacyShiftResponseAssembler().toResponse(openShift(UUID.randomUUID()));
        assertNull(response.soldItems());
    }

    @Test
    void alreadyClosedOrForeignCashierDoesNotBuildASlip() {
        UUID cashierId = UUID.randomUUID();
        PharmacyTenantContext.set(10, cashierId, "CASHIER");
        PharmacyShiftLookup lookup = mock(PharmacyShiftLookup.class);
        PharmacyShiftSoldItemsLoader loader = mock(PharmacyShiftSoldItemsLoader.class);
        PharmacyCashierShiftServiceImpl service = service(lookup, loader);

        PharmacyCashierShift closed = openShift(cashierId);
        closed.setStatus(PharmacyShiftStatus.CLOSED);
        when(lookup.require(closed.getId())).thenReturn(closed);
        assertThrows(BusinessException.class, () -> service.close(closed.getId(), null));

        PharmacyCashierShift foreign = openShift(UUID.randomUUID());
        when(lookup.require(foreign.getId())).thenReturn(foreign);
        assertThrows(BusinessException.class, () -> service.close(foreign.getId(), null));

        verify(loader, never()).load(any());
    }

    private static PharmacyCashierShiftServiceImpl service(
        PharmacyShiftLookup lookup,
        PharmacyShiftSoldItemsLoader loader
    ) {
        return new PharmacyCashierShiftServiceImpl(
            mock(PharmacyCashierShiftRepository.class),
            lookup,
            new PharmacyShiftResponseAssembler(),
            loader
        );
    }

    private static PharmacyCashierShift openShift(UUID cashierId) {
        return PharmacyCashierShift.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(3)
            .storeName("Аптека")
            .cashierId(cashierId)
            .cashierName("Азиза")
            .status(PharmacyShiftStatus.OPEN)
            .openedAt(Instant.parse("2026-10-01T05:00:00Z"))
            .build();
    }
}
