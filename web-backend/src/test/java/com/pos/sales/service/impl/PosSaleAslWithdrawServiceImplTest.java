package com.pos.sales.service.impl;

import com.pos.integrations.pharmacy.dto.MarkingWithdrawItemResult;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawRequest;
import com.pos.integrations.pharmacy.dto.MarkingWithdrawResponse;
import com.pos.integrations.pharmacy.service.PharmacyMarkingWithdrawService;
import com.pos.sales.dto.sale.SaleItemRequest;
import com.pos.sales.service.PosSaleAslWithdrawService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PosSaleAslWithdrawServiceImplTest {

    @Mock
    private PharmacyMarkingWithdrawService withdrawService;

    @InjectMocks
    private PosSaleAslWithdrawServiceImpl service;

    @Test
    void codesOfCollectsLineMarks() {
        SaleItemRequest line = new SaleItemRequest(
            UUID.randomUUID(),
            BigDecimal.ONE,
            null,
            null,
            List.of("  KM1  ", "KM1", "KM2")
        );
        assertEquals(List.of("KM1", "KM2"), PosSaleAslWithdrawService.codesOf(List.of(line)));
    }

    @Test
    void settledPollDoesNotNeedFiscalConfirm() {
        when(withdrawService.withdraw(any())).thenReturn(new MarkingWithdrawResponse(
            List.of(MarkingWithdrawItemResult.ok("KM1", "WITHDRAWN")),
            1,
            0,
            0
        ));
        service.enqueueAfterSale(7, List.of("KM1"), true);
        verify(withdrawService, times(1)).withdraw(any());
    }

    @Test
    void fiscalConfirmedRetriesWhenAslStillWaiting() {
        when(withdrawService.withdraw(any())).thenReturn(new MarkingWithdrawResponse(
            List.of(MarkingWithdrawItemResult.waiting("KM1", "INTRODUCED", "wait")),
            0,
            1,
            0
        ));
        service.enqueueAfterSale(7, List.of("KM1"), true);
        verify(withdrawService, times(2)).withdraw(any(MarkingWithdrawRequest.class));
    }

    @Test
    void emptyCodesSkipWithdraw() {
        service.enqueueAfterSale(7, List.of(), true);
        verify(withdrawService, never()).withdraw(any());
    }
}
