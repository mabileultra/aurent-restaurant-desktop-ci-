package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyImportMatchSupportProductsTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private PharmacyImportMatchSupport support;

    @Test
    void savedInvoiceProductsMapsSkuToCard() {
        Product product = Product.builder()
            .id(UUID.randomUUID())
            .sku("128273-L-2")
            .name("Naftizin")
            .build();
        when(productRepository.findByCompanyIdAndSkuIn(eq(1), any()))
            .thenReturn(List.of(product));

        Map<String, Product> map = support.savedInvoiceProducts(1, "128273", 3);
        assertEquals(product.getId(), map.get("128273-L-2").getId());
        assertEquals(1, map.size());
    }

    @Test
    void productIdsOnReceiptCollectsLineProducts() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).build();
        StockReceiptLine line = StockReceiptLine.builder().product(product).build();
        StockReceipt receipt = StockReceipt.builder().lines(List.of(line)).build();

        Set<UUID> ids = support.productIdsOnReceipt(receipt);
        assertTrue(ids.contains(id));
    }
}
