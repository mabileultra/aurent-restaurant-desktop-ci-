package com.pos.sales.service.cashier.impl;

import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.sales.dto.cashier.CashierShiftResponse;
import com.pos.sales.dto.cashier.ShiftItemRow;
import com.pos.sales.dto.cashier.ShiftSoldItemsReport;
import com.pos.sales.entity.CashierShift;
import com.pos.sales.mapper.CashierShiftMapperImpl;
import com.pos.sales.repository.CashierShiftRepository;
import com.pos.sales.service.CashRegisterTerminalService;
import com.pos.sales.service.cashier.support.CashierShiftAccessPolicy;
import com.pos.sales.service.cashier.support.CashierShiftAggregateLoader;
import com.pos.sales.service.cashier.support.ShiftBannerAggregate;
import com.pos.sales.service.cashier.support.ShiftReturnsAggregate;
import com.pos.sales.service.cashier.support.ShiftSoldItemsLoader;
import com.pos.service.support.CashierSaleSupport;
import com.pos.sales.service.zreport.ZReportFromShiftService;
import com.pos.security.CurrentUserProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CashierShiftCloseSoldItemsTest {

    private static final Instant OPENED = Instant.parse("2026-10-01T04:00:00Z");
    private static final Instant PERIOD = Instant.parse("2026-10-01T10:00:00Z");

    private CashierShiftRepository repository;
    private CashierShiftAggregateLoader aggregateLoader;
    private ShiftSoldItemsLoader soldItemsLoader;
    private CashierShiftAccessPolicy accessPolicy;
    private ZReportFromShiftService zReportFromShiftService;
    private CashierShiftServiceImpl service;
    private CashierShift shift;

    @BeforeEach
    void setUp() {
        repository = mock(CashierShiftRepository.class);
        aggregateLoader = mock(CashierShiftAggregateLoader.class);
        soldItemsLoader = mock(ShiftSoldItemsLoader.class);
        accessPolicy = mock(CashierShiftAccessPolicy.class);
        zReportFromShiftService = mock(ZReportFromShiftService.class);
        service = new CashierShiftServiceImpl(
            repository,
            mock(CurrentUserProvider.class),
            mock(CashierSaleSupport.class),
            zReportFromShiftService,
            new CashierShiftMapperImpl(),
            aggregateLoader,
            soldItemsLoader,
            accessPolicy,
            mock(CashRegisterTerminalService.class)
        );
        shift = openShift();
        when(accessPolicy.requireOwned(shift.getId())).thenReturn(shift);
        when(aggregateLoader.loadForShift(any(), any(), any())).thenReturn(ShiftBannerAggregate.empty());
        when(aggregateLoader.loadReturnsForShift(any(), any(), any())).thenReturn(ShiftReturnsAggregate.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void closeAttachesGoodsForTheCurrentZPeriodNotTheWholeShift() {
        ShiftSoldItemsReport sold = new ShiftSoldItemsReport(
            PERIOD,
            Instant.EPOCH,
            List.of(new ShiftItemRow("Молоко", new BigDecimal("2.000"), new BigDecimal("14000.00")))
        );
        when(soldItemsLoader.load(any(), any(), any())).thenReturn(sold);

        CashierShiftResponse response = service.closeShift(shift.getId());

        ArgumentCaptor<Instant> from = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> to = ArgumentCaptor.forClass(Instant.class);
        verify(soldItemsLoader).load(org.mockito.ArgumentMatchers.eq(shift), from.capture(), to.capture());
        assertEquals(PERIOD, from.getValue());
        assertEquals(shift.getClosedAt(), to.getValue());
        assertSame(sold, response.soldItems());
        assertEquals("Молоко", response.soldItems().items().get(0).name());
        assertEquals(CashierShift.ShiftStatus.CLOSED.name(), response.status());
    }

    @Test
    void liveShiftResponseDoesNotCarryAGoodsSlip() {
        CashierShiftResponse live = new CashierShiftMapperImpl().toResponse(shift, "Магазин", ShiftBannerAggregate.empty());
        assertNull(live.soldItems());
    }

    @Test
    void alreadyClosedShiftDoesNotBuildASlip() {
        shift.setStatus(CashierShift.ShiftStatus.CLOSED);

        assertThrows(BadRequestException.class, () -> service.closeShift(shift.getId()));

        verify(soldItemsLoader, never()).load(any(), any(), any());
        verify(zReportFromShiftService, never()).createForClosedShift(any(), any());
    }

    private static CashierShift openShift() {
        User cashier = User.builder().id(UUID.randomUUID()).fullName("Азиза").build();
        Store store = Store.builder().id(4).name("Магазин").build();
        return CashierShift.builder()
            .id(UUID.randomUUID())
            .cashier(cashier)
            .store(store)
            .status(CashierShift.ShiftStatus.OPEN)
            .openedAt(OPENED)
            .periodStartedAt(PERIOD)
            .saleCount(0)
            .totalAmount(BigDecimal.ZERO)
            .cashAmount(BigDecimal.ZERO)
            .cardAmount(BigDecimal.ZERO)
            .vatAmount(BigDecimal.ZERO)
            .build();
    }
}
