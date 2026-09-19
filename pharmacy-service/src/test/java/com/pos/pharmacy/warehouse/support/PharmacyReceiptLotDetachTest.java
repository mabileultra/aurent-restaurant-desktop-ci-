package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.sales.repository.SaleItemLotRepository;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyReceiptLotDetachTest {

    @Mock
    private StockLotRepository stockLotRepository;
    @Mock
    private SaleItemLotRepository saleItemLotRepository;
    @Mock
    private PharmacyReceiptStockReversal stockReversal;
    @Mock
    private PlatformTransactionManager transactionManager;

    @Test
    void reversesStockAndDeletesLots() {
        when(transactionManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());

        UUID lineId = UUID.randomUUID();
        Product product = new Product();
        product.setId(UUID.randomUUID());
        StockReceiptLine line = StockReceiptLine.builder().id(lineId).build();
        StockLot lot = StockLot.builder()
            .id(UUID.randomUUID())
            .product(product)
            .receiptLine(line)
            .quantity(BigDecimal.TEN)
            .build();
        when(stockLotRepository.findByReceiptLineIds(List.of(lineId))).thenReturn(List.of(lot));

        PharmacyReceiptLotDetach detach = new PharmacyReceiptLotDetach(
            stockLotRepository,
            saleItemLotRepository,
            stockReversal,
            transactionManager
        );
        detach.detachLotsForLines(7, List.of(lineId));

        verify(stockReversal).reverse(eq(7), any(), any());
        verify(saleItemLotRepository).detachLots(List.of(lot.getId()));
        verify(stockLotRepository).deleteAll(List.of(lot));
        verify(stockLotRepository).flush();
    }
}
