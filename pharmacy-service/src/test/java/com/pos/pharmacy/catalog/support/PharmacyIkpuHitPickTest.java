package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyIkpuHitPickTest {

    @Mock
    private StoreStockService storeStockService;

    @InjectMocks
    private PharmacyIkpuHitPick pick;

    @Test
    void prefersActiveCardWithStoreStock() {
        UUID zeroId = UUID.randomUUID();
        UUID stockId = UUID.randomUUID();
        Product zero = Product.builder().id(zeroId).active(true).name("A").stockQuantity(BigDecimal.ZERO).build();
        Product stock = Product.builder().id(stockId).active(true).name("B").stockQuantity(BigDecimal.ZERO).build();
        when(storeStockService.getQuantities(eq(7), any())).thenReturn(Map.of(
            zeroId, BigDecimal.ZERO,
            stockId, new BigDecimal("12")
        ));

        Product chosen = pick.pick(List.of(zero, stock), 7);
        assertEquals(stockId, chosen.getId());
    }
}
