package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.inventory.domain.StockTransferStatus;
import com.pos.inventory.entity.StockTransfer;
import com.pos.inventory.entity.StockTransferLine;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.event.PosDomainEventService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockTransferPostSupportTest {

    @Mock CatalogManagedProductLoader catalogManagedProductLoader;
    @Mock StoreStockService storeStockService;
    @Mock StockMovementPersistence stockMovementPersistence;
    @Mock PosDomainEventService posDomainEventService;
    @InjectMocks StockTransferPostSupport postSupport;

    @Test
    void post_movesStockAndSetsPosted() {
        Store from = Store.builder().id(1).name("A").build();
        Store to = Store.builder().id(2).name("B").build();
        Product product = Product.builder().id(UUID.randomUUID()).name("Milk").build();
        StockTransfer transfer = StockTransfer.builder()
            .id(UUID.randomUUID())
            .transferNumber("TRF-1")
            .status(StockTransferStatus.DRAFT)
            .fromStore(from)
            .toStore(to)
            .build();
        transfer.getLines().add(StockTransferLine.builder()
            .transfer(transfer)
            .productId(product.getId())
            .quantity(new BigDecimal("2"))
            .build());
        when(catalogManagedProductLoader.requireById(product.getId())).thenReturn(product);
        when(stockMovementPersistence.save(any())).thenAnswer(inv -> inv.getArgument(0));

        postSupport.post(transfer, User.builder().id(UUID.randomUUID()).build());

        assertEquals(StockTransferStatus.POSTED, transfer.getStatus());
        verify(storeStockService).requireAvailable(product, from, new BigDecimal("2"));
        verify(storeStockService).decrease(product, from, new BigDecimal("2"));
        verify(storeStockService).increase(product, to, new BigDecimal("2"));
        verify(posDomainEventService).publishStockTransferAfterCommit(transfer);
    }

    @Test
    void post_rejectsPostedTransfer() {
        StockTransfer transfer = StockTransfer.builder()
            .status(StockTransferStatus.POSTED)
            .fromStore(Store.builder().id(1).build())
            .toStore(Store.builder().id(2).build())
            .build();
        assertThrows(BadRequestException.class, () ->
            postSupport.post(transfer, User.builder().id(UUID.randomUUID()).build()));
        verify(storeStockService, never()).decrease(any(), any(), any());
    }

    @Test
    void post_propagatesInsufficientStock() {
        Store from = Store.builder().id(1).name("A").build();
        Store to = Store.builder().id(2).name("B").build();
        Product product = Product.builder().id(UUID.randomUUID()).name("Milk").build();
        StockTransfer transfer = StockTransfer.builder()
            .id(UUID.randomUUID())
            .transferNumber("TRF-1")
            .status(StockTransferStatus.DRAFT)
            .fromStore(from)
            .toStore(to)
            .build();
        transfer.getLines().add(StockTransferLine.builder()
            .transfer(transfer)
            .productId(product.getId())
            .quantity(new BigDecimal("5"))
            .build());
        when(catalogManagedProductLoader.requireById(product.getId())).thenReturn(product);
        doThrow(new BadRequestException("Insufficient stock"))
            .when(storeStockService).requireAvailable(eq(product), eq(from), any());

        assertThrows(BadRequestException.class, () ->
            postSupport.post(transfer, User.builder().id(UUID.randomUUID()).build()));
        verify(storeStockService, never()).decrease(any(), any(), any());
        assertEquals(StockTransferStatus.DRAFT, transfer.getStatus());
    }
}
