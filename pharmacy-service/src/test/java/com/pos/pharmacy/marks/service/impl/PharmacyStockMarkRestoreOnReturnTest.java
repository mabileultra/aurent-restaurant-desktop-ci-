package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.support.StockMarkKeys;
import com.pos.pharmacy.security.PharmacyTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyStockMarkRestoreOnReturnTest {

    private static final String MARK = "010478001234567821SERIAL91CRYPT";

    @Mock
    private StockMarkRepository stockMarkRepository;

    private PharmacyStockMarkServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PharmacyStockMarkServiceImpl(stockMarkRepository);
        PharmacyTenantContext.set(10, UUID.randomUUID(), "ADMIN");
    }

    @AfterEach
    void tearDown() {
        PharmacyTenantContext.clear();
    }

    @Test
    void restoreOnReturnMovesSoldBackToInStock() {
        UUID saleId = UUID.randomUUID();
        StockMark row = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(5)
            .productId(UUID.randomUUID())
            .markCode(MARK)
            .markKey(StockMarkKeys.primaryKey(MARK))
            .status(StockMarkStatus.SOLD)
            .saleId(saleId)
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(row));
        when(stockMarkRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        int updated = service.restoreOnReturn(5, saleId, List.of(MARK));

        assertEquals(1, updated);
        assertEquals(StockMarkStatus.IN_STOCK, row.getStatus());
        assertNull(row.getSaleId());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<StockMark>> captor = ArgumentCaptor.forClass(List.class);
        verify(stockMarkRepository).saveAll(captor.capture());
        assertEquals(1, captor.getValue().size());
    }
}
