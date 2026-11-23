package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.entity.Store;
import com.pos.inventory.service.stock.StoreStockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductStoreScopedResponseSupportTest {

    @Mock
    private StoreStockService storeStockService;
    @Mock
    private ProductStorePriceRepository productStorePriceRepository;
    @Mock
    private ProductResponseAssembler assembler;

    @InjectMocks
    private ProductStoreScopedResponseSupport support;

    @Test
    void applyStoreScope_setsQtyPriceAndStoresCount() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).sellingPrice(new BigDecimal("50")).build();
        ProductResponse base = sampleResponse(id, new BigDecimal("50"), new BigDecimal("9"), 2);
        ProductResponse withQty = sampleResponse(id, new BigDecimal("50"), new BigDecimal("3"), 2);
        ProductResponse withPrice = sampleResponse(id, new BigDecimal("77"), new BigDecimal("3"), 2);
        ProductResponse withStores = sampleResponse(id, new BigDecimal("77"), new BigDecimal("3"), 1);

        when(assembler.withStockQuantity(eq(base), eq(new BigDecimal("3")))).thenReturn(withQty);
        when(assembler.withSellingPrice(eq(withQty), eq(new BigDecimal("77")))).thenReturn(withPrice);
        when(assembler.withStoresCount(eq(withPrice), eq(1))).thenReturn(withStores);

        ProductResponse out = support.applyStoreScope(
            base,
            product,
            104,
            Map.of(id, new BigDecimal("3")),
            Map.of(id, new BigDecimal("77"))
        );

        assertThat(out.stockQuantity()).isEqualByComparingTo("3");
        assertThat(out.sellingPrice()).isEqualByComparingTo("77");
        assertThat(out.storesCount()).isEqualTo(1);
    }

    @Test
    void loadStorePrices_mapsRepositoryRows() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).build();
        Store store = Store.builder().id(104).build();
        ProductStorePrice row = ProductStorePrice.builder()
            .product(product)
            .store(store)
            .price(new BigDecimal("12"))
            .build();
        when(productStorePriceRepository.findByProduct_IdInAndStore_Id(any(), eq(104)))
            .thenReturn(List.of(row));

        Map<UUID, BigDecimal> prices = support.loadStorePrices(List.of(product), 104);

        assertThat(prices).containsEntry(id, new BigDecimal("12"));
    }

    private static ProductResponse sampleResponse(UUID id, BigDecimal price, BigDecimal qty, int stores) {
        return new ProductResponse(
            id, "sku", "n", null, null, null,
            BigDecimal.ONE, price, BigDecimal.ZERO, BigDecimal.ZERO,
            null, null, null, 0, false,
            qty, 0, 10, false,
            null, null, List.of(), null, true, null, null,
            null, null, null, null, null, null, true, false, null, null, null, null,
            stores, List.of(), null, null, Map.of(), null
        );
    }
}
