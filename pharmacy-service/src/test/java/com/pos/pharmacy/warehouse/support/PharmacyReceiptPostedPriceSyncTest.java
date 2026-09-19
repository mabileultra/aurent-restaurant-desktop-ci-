package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyReceiptPostedPriceSyncTest {

    @Mock
    private StockLotRepository stockLotRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @Test
    void copiesLinePricesToLotAndProduct() {
        UUID lineId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        Product product = Product.builder()
            .id(productId)
            .costPrice(new BigDecimal("10.00"))
            .sellingPrice(new BigDecimal("12.00"))
            .taxRate(new BigDecimal("12"))
            .build();
        StockReceiptLine line = StockReceiptLine.builder()
            .id(lineId)
            .product(product)
            .purchasePrice(new BigDecimal("100.00"))
            .unitSellingPrice(new BigDecimal("140.00"))
            .retailPrice(new BigDecimal("140.00"))
            .vatPercent(new BigDecimal("12"))
            .build();
        StockLot lot = StockLot.builder()
            .id(UUID.randomUUID())
            .product(product)
            .receiptLine(line)
            .purchasePrice(new BigDecimal("10.00"))
            .unitSellingPrice(new BigDecimal("12.00"))
            .build();
        StockReceipt receipt = StockReceipt.builder()
            .status(StockReceiptStatus.POSTED)
            .companyId(3)
            .storeId(7)
            .build();
        when(stockLotRepository.findByReceiptLineIds(List.of(lineId))).thenReturn(List.of(lot));
        when(productRepository.findAllById(any())).thenReturn(List.of(product));

        PharmacyReceiptPostedPriceSync sync = new PharmacyReceiptPostedPriceSync(
            stockLotRepository, productRepository, catalogCacheEvictor
        );
        sync.sync(receipt, List.of(line));

        assertEquals(new BigDecimal("100.00"), lot.getPurchasePrice());
        assertEquals(new BigDecimal("140.00"), lot.getUnitSellingPrice());
        assertEquals(new BigDecimal("100.00"), product.getCostPrice());
        assertEquals(new BigDecimal("140.00"), product.getSellingPrice());
        verify(stockLotRepository).saveAll(List.of(lot));
        ArgumentCaptor<List<Product>> products = ArgumentCaptor.captor();
        verify(productRepository).saveAll(products.capture());
        assertEquals(1, products.getValue().size());
        verify(catalogCacheEvictor).onStoreStockChanged(3, 7);
        verify(catalogCacheEvictor).onProductChanged(3);
    }

    @Test
    void skipsDraftReceipts() {
        StockReceipt receipt = StockReceipt.builder().status(StockReceiptStatus.DRAFT).build();
        PharmacyReceiptPostedPriceSync sync = new PharmacyReceiptPostedPriceSync(
            stockLotRepository, productRepository, catalogCacheEvictor
        );
        sync.sync(receipt, List.of(StockReceiptLine.builder().id(UUID.randomUUID()).build()));
        verify(stockLotRepository, never()).findByReceiptLineIds(any());
    }
}
