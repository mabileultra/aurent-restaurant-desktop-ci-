package com.pos.pharmacy.revenue.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.pharmacy.revenue.domain.RevenueOutboxChannel;
import com.pos.pharmacy.revenue.entity.RevenueOutbox;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.entity.Sale;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyRevenuePublicationServiceTest {

    @Mock
    private RevenueOutboxService outboxService;
    @Mock
    private RevenueOutboxDispatchService outboxDispatchService;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PharmacyRevenuePublicationService service;

    @Test
    void enqueuesAndDispatchesWithoutBlockingTrySend() throws Exception {
        UUID saleId = UUID.randomUUID();
        UUID outboxId = UUID.randomUUID();
        Sale sale = Sale.builder()
            .id(saleId)
            .companyId(10)
            .storeId(5)
            .receiptNumber("R-1")
            .cashierId(UUID.randomUUID())
            .status(SaleEnums.SaleStatus.COMPLETED)
            .totalAmount(new BigDecimal("1000.00"))
            .subtotal(new BigDecimal("892.86"))
            .taxTotal(new BigDecimal("107.14"))
            .discountTotal(BigDecimal.ZERO)
            .cashAmount(new BigDecimal("1000.00"))
            .cardAmount(BigDecimal.ZERO)
            .paymentMethod(SaleEnums.PaymentMethod.CASH)
            .receiptType(SaleEnums.ReceiptType.SALE)
            .items(java.util.List.of())
            .build();

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(outboxService.enqueue(
            eq(RevenueOutboxChannel.SALE_COMPLETED),
            anyString(),
            eq(saleId.toString()),
            anyString(),
            eq("{}")
        )).thenReturn(RevenueOutbox.builder().id(outboxId).build());

        service.onSaleCompleted(sale, Map.of(), "Store A");

        ArgumentCaptor<UUID> idCaptor = ArgumentCaptor.forClass(UUID.class);
        verify(outboxDispatchService).dispatchAfterCommit(idCaptor.capture());
        assertEquals(outboxId, idCaptor.getValue());
        verify(outboxService, never()).trySend(any());
    }

    @Test
    void ignoresNullSale() {
        service.onSaleCompleted(null, Map.of(), null);
        verify(outboxService, never()).enqueue(any(), anyString(), anyString(), anyString(), anyString());
    }
}
