package com.pos.pharmacy.sales.service.impl;

import com.pos.pharmacy.sales.entity.SaleSoldMark;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.repository.SaleSoldMarkRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacySoldMarkUnregisterTest {

    @Mock
    private SaleSoldMarkRepository soldMarkRepository;

    @Mock
    private SaleRepository saleRepository;

    @InjectMocks
    private PharmacySoldMarkServiceImpl service;

    @Test
    void unregisterForReturnTakesLimitedUniqueCodesPerItem() {
        UUID saleId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        SaleSoldMark a1 = row(saleId, itemId, "CODE_A", "keyA1");
        SaleSoldMark a2 = row(saleId, itemId, "CODE_A", "keyA2");
        SaleSoldMark b1 = row(saleId, itemId, "CODE_B", "keyB1");
        when(soldMarkRepository.findBySaleIdAndSaleItemIdIn(eq(saleId), any()))
            .thenReturn(List.of(a1, a2, b1));

        List<String> removed = service.unregisterForReturn(saleId, Map.of(itemId, 1));

        assertEquals(List.of("CODE_A"), removed);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SaleSoldMark>> captor = ArgumentCaptor.forClass(List.class);
        verify(soldMarkRepository).deleteAll(captor.capture());
        assertEquals(2, captor.getValue().size());
    }

    private static SaleSoldMark row(UUID saleId, UUID itemId, String code, String key) {
        return SaleSoldMark.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(1)
            .saleId(saleId)
            .saleItemId(itemId)
            .markCode(code)
            .markKey(key)
            .build();
    }
}
