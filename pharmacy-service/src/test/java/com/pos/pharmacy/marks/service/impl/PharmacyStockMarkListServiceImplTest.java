package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.marks.dto.StockMarkListItemResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.security.PharmacyTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyStockMarkListServiceImplTest {

    @Mock
    private StockMarkRepository stockMarkRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private SaleRepository saleRepository;

    private PharmacyStockMarkListServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PharmacyStockMarkListServiceImpl(stockMarkRepository, productRepository, saleRepository);
        PharmacyTenantContext.set(10, UUID.randomUUID(), "ADMIN");
    }

    @AfterEach
    void tearDown() {
        PharmacyTenantContext.clear();
    }

    @Test
    void listRequiresCompany() {
        PharmacyTenantContext.clear();
        assertThrows(BusinessException.class, () ->
            service.list(null, null, null, null, null, null, true, PageRequest.of(0, 20))
        );
    }

    @Test
    void listMapsProductReceiptAndAttention() {
        UUID productId = UUID.randomUUID();
        UUID saleId = UUID.randomUUID();
        UUID markId = UUID.randomUUID();
        Instant soldAt = Instant.parse("2026-09-18T10:00:00Z");

        StockMark pending = StockMark.builder()
            .id(markId)
            .companyId(10)
            .storeId(5)
            .productId(productId)
            .markCode("010478001234567821ABCDEFG")
            .markKey("key1")
            .status(StockMarkStatus.PENDING_WITHDRAW)
            .aslStatus("INTRODUCED")
            .saleId(saleId)
            .soldAt(soldAt)
            .withdrawAttempts(2)
            .lastWithdrawError("awaiting OFD/ASL")
            .updatedAt(soldAt)
            .build();

        when(stockMarkRepository.searchForMonitor(
            eq(10), eq(5), isNull(), isNull(), isNull(), isNull(), isNull(), eq(true), any()
        )).thenReturn(new PageImpl<>(List.of(pending), PageRequest.of(0, 20), 1));

        when(productRepository.findAllById(any())).thenReturn(List.of(
            Product.builder().id(productId).companyId(10).sku("S1").name("Аспирин").build()
        ));
        when(saleRepository.findAllById(any())).thenReturn(List.of(
            Sale.builder()
                .id(saleId)
                .companyId(10)
                .receiptNumber("PH-100")
                .storeId(5)
                .cashierId(UUID.randomUUID())
                .subtotal(java.math.BigDecimal.ONE)
                .taxTotal(java.math.BigDecimal.ZERO)
                .totalAmount(java.math.BigDecimal.ONE)
                .paymentMethod(com.pos.pharmacy.sales.domain.SaleEnums.PaymentMethod.CASH)
                .build()
        ));

        PageResponse<StockMarkListItemResponse> page = service.list(
            5, null, null, null, null, null, true, PageRequest.of(0, 20)
        );

        assertEquals(1, page.totalElements());
        StockMarkListItemResponse item = page.content().get(0);
        assertEquals(markId, item.id());
        assertEquals("Аспирин", item.productName());
        assertEquals("PH-100", item.receiptNumber());
        assertEquals(StockMarkStatus.PENDING_WITHDRAW, item.status());
        assertEquals("INTRODUCED", item.aslStatus());
        assertTrue(item.needsAttention());
        assertEquals(2, item.withdrawAttempts());

        verify(stockMarkRepository).searchForMonitor(
            eq(10), eq(5), isNull(), isNull(), isNull(), isNull(), isNull(), eq(true), any()
        );
    }

    @Test
    void soldWithoutErrorIsNotAttention() {
        UUID productId = UUID.randomUUID();
        StockMark sold = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(5)
            .productId(productId)
            .markCode("KM-OK")
            .markKey("ok")
            .status(StockMarkStatus.SOLD)
            .aslStatus("WITHDRAWN")
            .soldAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        when(stockMarkRepository.searchForMonitor(
            eq(10), isNull(), eq(StockMarkStatus.SOLD), isNull(), isNull(), isNull(), isNull(), eq(false), any()
        )).thenReturn(new PageImpl<>(List.of(sold)));
        when(productRepository.findAllById(any())).thenReturn(List.of());

        StockMarkListItemResponse item = service.list(
            null, StockMarkStatus.SOLD, null, null, null, null, false, PageRequest.of(0, 10)
        ).content().get(0);

        assertFalse(item.needsAttention());
        assertEquals("WITHDRAWN", item.aslStatus());
    }
}
