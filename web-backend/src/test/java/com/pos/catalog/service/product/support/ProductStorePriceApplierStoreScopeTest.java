package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductStorePriceRequest;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.repository.StoreRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductStorePriceApplierStoreScopeTest {

    @Mock
    private StoreRepository storeRepository;

    @InjectMocks
    private ProductStorePriceApplier applier;

    @Test
    void applySellingPriceForStore_updatesOnlyTargetStore() {
        Company company = Company.builder().id(55).name("C").build();
        Store store1 = Store.builder().id(48).name("A").company(company).active(true).build();
        Store store2 = Store.builder().id(104).name("B").company(company).active(true).build();
        Product product = Product.builder()
            .id(java.util.UUID.randomUUID())
            .company(company)
            .storePrices(new ArrayList<>(List.of(
                ProductStorePrice.builder().store(store1).price(new BigDecimal("10")).build(),
                ProductStorePrice.builder().store(store2).price(new BigDecimal("20")).build()
            )))
            .build();
        product.getStorePrices().forEach(p -> p.setProduct(product));

        applier.applySellingPriceForStore(
            product,
            104,
            new BigDecimal("99"),
            List.of(new ProductStorePriceRequest(104, new BigDecimal("99")))
        );

        assertThat(product.getStorePrices())
            .filteredOn(p -> p.getStore().getId() == 48)
            .singleElement()
            .extracting(ProductStorePrice::getPrice)
            .isEqualTo(new BigDecimal("10"));
        assertThat(product.getStorePrices())
            .filteredOn(p -> p.getStore().getId() == 104)
            .singleElement()
            .extracting(ProductStorePrice::getPrice)
            .isEqualTo(new BigDecimal("99"));
    }

    @Test
    void removeStorePrice_keepsOtherBranches() {
        Company company = Company.builder().id(55).name("C").build();
        Store store1 = Store.builder().id(48).name("A").company(company).active(true).build();
        Store store2 = Store.builder().id(104).name("B").company(company).active(true).build();
        Product product = Product.builder()
            .company(company)
            .storePrices(new ArrayList<>(List.of(
                ProductStorePrice.builder().store(store1).price(new BigDecimal("10")).build(),
                ProductStorePrice.builder().store(store2).price(new BigDecimal("20")).build()
            )))
            .build();

        applier.removeStorePrice(product, 104);

        assertThat(product.getStorePrices()).hasSize(1);
        assertThat(product.getStorePrices().get(0).getStore().getId()).isEqualTo(48);
    }

    @Test
    void applySellingPriceForStore_createsMissingLine() {
        Company company = Company.builder().id(55).name("C").build();
        Store store2 = Store.builder().id(104).name("B").company(company).active(true).build();
        Product product = Product.builder()
            .company(company)
            .storePrices(new ArrayList<>())
            .build();
        when(storeRepository.findById(104)).thenReturn(Optional.of(store2));

        applier.applySellingPriceForStore(product, 104, new BigDecimal("15"), null);

        assertThat(product.getStorePrices()).hasSize(1);
        assertThat(product.getStorePrices().get(0).getStore().getId()).isEqualTo(104);
        assertThat(product.getStorePrices().get(0).getPrice()).isEqualByComparingTo("15");
    }
}
