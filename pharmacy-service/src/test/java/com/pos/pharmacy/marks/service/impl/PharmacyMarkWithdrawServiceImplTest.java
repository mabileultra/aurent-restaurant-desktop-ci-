package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.client.PosCoreMarkingClient;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawItem;
import com.pos.pharmacy.client.dto.PosMarkingWithdrawResponse;
import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyMarkWithdrawServiceImplTest {

    @Mock
    private PosCoreMarkingClient posCoreMarkingClient;

    @Mock
    private PharmacyStockMarkService stockMarkService;

    @InjectMocks
    private PharmacyMarkWithdrawServiceImpl service;

    @Test
    void enqueueAfterSaleConfirmsSuccessfulCodes() {
        when(posCoreMarkingClient.withdraw(any())).thenReturn(new PosMarkingWithdrawResponse(
            List.of(new PosMarkingWithdrawItem("KM1", true, false, "WITHDRAWN", null)),
            1,
            0,
            0
        ));
        when(stockMarkService.confirmSold(eq(10), eq(5), eq(List.of("KM1")), eq("WITHDRAWN")))
            .thenReturn(1);

        service.enqueueAfterSale(10, 5, UUID.randomUUID(), List.of("KM1"), true);

        verify(stockMarkService).confirmSold(10, 5, List.of("KM1"), "WITHDRAWN");
    }

    @Test
    void processPendingBatchRecordsAwaiting() {
        var pending = com.pos.pharmacy.marks.entity.StockMark.builder()
            .companyId(10)
            .storeId(5)
            .markCode("KM2")
            .markKey("k2")
            .status(com.pos.pharmacy.marks.entity.StockMarkStatus.PENDING_WITHDRAW)
            .build();
        when(stockMarkService.findPendingWithdrawBatch(50)).thenReturn(List.of(pending));
        when(posCoreMarkingClient.withdraw(any())).thenReturn(new PosMarkingWithdrawResponse(
            List.of(new PosMarkingWithdrawItem("KM2", false, true, "INTRODUCED", "wait")),
            0,
            1,
            0
        ));

        assertEquals(0, service.processPendingBatch());
        verify(stockMarkService).recordWithdrawAttempt(eq(10), eq(5), eq(List.of("KM2")), eq("awaiting OFD/ASL"));
    }
}
