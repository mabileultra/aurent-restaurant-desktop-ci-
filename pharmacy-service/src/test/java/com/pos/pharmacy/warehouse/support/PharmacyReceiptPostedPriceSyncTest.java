package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.catalog.support.PharmacyPackSupport;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private ProductAttributeService productAttributeService;
    @Mock
    private PharmacyCatalogCacheEvictor catalogCacheEvictor;
    @Mock
    private PharmacyReceiptStockIncrease stockIncrease;
    @Mock
    private PharmacyReceiptStockReversal stockReversal;

    @Test
    void copiesLinePricesBatchAndExpiryToLotAndProduct() {
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
            .unitsInPack(new BigDecimal("10"))
            .batchNumber("B-9")
            .expiryDate(LocalDate.of(2027, 5, 1))
            .build();
        StockLot lot = StockLot.builder()
            .id(UUID.randomUUID())
            .product(product)
            .receiptLine(line)
            .purchasePrice(new BigDecimal("10.00"))
            .unitSellingPrice(new BigDecimal("12.00"))
            .quantity(new BigDecimal("5.000"))
            .build();
        StockReceipt receipt = StockReceipt.builder()
            .status(StockReceiptStatus.POSTED)
            .companyId(3)
            .storeId(7)
            .build();
        when(stockLotRepository.findByReceiptLineIds(List.of(lineId))).thenReturn(List.of(lot));
        when(productRepository.findAllById(any())).thenReturn(List.of(product));

        PharmacyReceiptPostedPriceSync sync = newSync();
        sync.sync(receipt, List.of(line));

        assertEquals(new BigDecimal("100.00"), lot.getPurchasePrice());
        assertEquals(new BigDecimal("140.00"), lot.getUnitSellingPrice());
        assertEquals("B-9", lot.getBatchNumber());
        assertEquals(LocalDate.of(2027, 5, 1), lot.getExpiryDate());
        assertEquals(new BigDecimal("100.00"), product.getCostPrice());
        assertEquals(new BigDecimal("140.00"), product.getSellingPrice());
        assertEquals(true, product.isSoldIndividually());
        assertEquals(true, product.isAllowFraction());
        assertEquals(3, product.getQuantityScale());
        verify(productAttributeService).upsertAttribute(productId, PharmacyPackSupport.ATTR_UNITS_IN_PACK, "10");
        verify(stockLotRepository).saveAll(List.of(lot));
        ArgumentCaptor<List<Product>> products = ArgumentCaptor.captor();
        verify(productRepository).saveAll(products.capture());
        assertEquals(1, products.getValue().size());
        verify(catalogCacheEvictor).onStoreStockChanged(3, 7);
        verify(catalogCacheEvictor).onProductChanged(3);
        verify(stockIncrease, never()).increase(any(), any(), any());
        verify(stockReversal, never()).reverse(any(), any(), any());
    }

    @Test
    void adjustsLotAndStoreStockWhenQuantityChanges() {
        UUID lineId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).name("Аспирин").build();
        StockReceiptLine line = StockReceiptLine.builder()
            .id(lineId)
            .product(product)
            .quantity(new BigDecimal("12.000"))
            .purchasePrice(new BigDecimal("10.00"))
            .unitSellingPrice(new BigDecimal("15.00"))
            .build();
        StockLot lot = StockLot.builder()
            .id(UUID.randomUUID())
            .product(product)
            .receiptLine(line)
            .quantity(new BigDecimal("10.000"))
            .purchasePrice(new BigDecimal("10.00"))
            .unitSellingPrice(new BigDecimal("15.00"))
            .build();
        StockReceipt receipt = StockReceipt.builder()
            .status(StockReceiptStatus.POSTED)
            .companyId(3)
            .storeId(7)
            .build();
        when(stockLotRepository.findByReceiptLineIds(List.of(lineId))).thenReturn(List.of(lot));
        when(productRepository.findAllById(any())).thenReturn(List.of(product));

        newSync().sync(receipt, List.of(line), Map.of(lineId, new BigDecimal("10.000")));

        assertEquals(new BigDecimal("12.000"), lot.getQuantity());
        verify(stockIncrease).increase(eq(7), any(), eq(Map.of(productId, new BigDecimal("2.000"))));
        verify(stockReversal, never()).reverse(any(), any(), any());
    }

    @Test
    void skipsDraftReceipts() {
        StockReceipt receipt = StockReceipt.builder().status(StockReceiptStatus.DRAFT).build();
        PharmacyReceiptPostedPriceSync sync = newSync();
        sync.sync(receipt, List.of(StockReceiptLine.builder().id(UUID.randomUUID()).build()));
        verify(stockLotRepository, never()).findByReceiptLineIds(any());
    }

    private PharmacyReceiptPostedPriceSync newSync() {
        return new PharmacyReceiptPostedPriceSync(
            stockLotRepository,
            productRepository,
            productAttributeService,
            catalogCacheEvictor,
            stockIncrease,
            stockReversal
        );
    }
}
