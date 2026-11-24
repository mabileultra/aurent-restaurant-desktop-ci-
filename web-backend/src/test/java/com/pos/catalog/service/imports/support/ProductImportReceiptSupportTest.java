package com.pos.catalog.service.imports.support;

import com.pos.inventory.dto.warehouse.CreateStockReceiptRequest;
import com.pos.inventory.dto.warehouse.StockReceiptLineRequest;
import com.pos.inventory.dto.warehouse.StockReceiptResponse;
import com.pos.inventory.service.stock.StockReceiptService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductImportReceiptSupportTest {

    @Mock
    private StockReceiptService stockReceiptService;

    @InjectMocks
    private ProductImportReceiptSupport support;

    @Test
    void postReceipt_writesInvoiceAndContractToRequestNotOnlyNotes() {
        UUID supplierId = UUID.randomUUID();
        List<StockReceiptLineRequest> lines = List.of(
            new StockReceiptLineRequest(
                UUID.randomUUID(), BigDecimal.ONE, BigDecimal.TEN, BigDecimal.TEN, 12, false, null
            )
        );
        when(stockReceiptService.create(any())).thenReturn(
            new StockReceiptResponse(
                UUID.randomUUID(), "REC-1", supplierId, "S", 1, "Store",
                "IS-1", null, "481", "CASH", "notes",
                BigDecimal.ONE, BigDecimal.TEN, "User", null, List.of()
            )
        );

        List<String> errors = new ArrayList<>();
        String number = support.postReceipt(
            1, supplierId, "CASH", null, "IS-00008429", null, "481", lines, 1, errors
        );

        assertEquals("REC-1", number);
        assertEquals(0, errors.size());
        ArgumentCaptor<CreateStockReceiptRequest> captor = ArgumentCaptor.forClass(CreateStockReceiptRequest.class);
        verify(stockReceiptService).create(captor.capture());
        CreateStockReceiptRequest req = captor.getValue();
        assertEquals("IS-00008429", req.invoiceNumber());
        assertEquals("481", req.contractNumber());
        assertEquals("Импорт IS-00008429", req.notes());
    }

    @Test
    void postReceipt_passesInvoiceDate() {
        List<StockReceiptLineRequest> lines = List.of(
            new StockReceiptLineRequest(
                UUID.randomUUID(), BigDecimal.ONE, BigDecimal.TEN, BigDecimal.TEN, 12, false, null
            )
        );
        when(stockReceiptService.create(any())).thenReturn(
            new StockReceiptResponse(
                UUID.randomUUID(), "REC-2", null, null, 1, "Store",
                "IS-2", LocalDate.of(2026, 3, 15), null, "CASH", "n",
                BigDecimal.ONE, BigDecimal.TEN, "User", null, List.of()
            )
        );
        List<String> errors = new ArrayList<>();
        support.postReceipt(
            1, null, "CASH", "n", "IS-2", LocalDate.of(2026, 3, 15), null, lines, 1, errors
        );
        ArgumentCaptor<CreateStockReceiptRequest> captor = ArgumentCaptor.forClass(CreateStockReceiptRequest.class);
        verify(stockReceiptService).create(captor.capture());
        assertEquals(LocalDate.of(2026, 3, 15), captor.getValue().invoiceDate());
    }

    @Test
    void postReceipt_emptyLines_returnsNull() {
        List<String> errors = new ArrayList<>();
        assertNull(support.postReceipt(1, null, "CASH", null, "IS-1", null, null, List.of(), 0, errors));
    }
}
