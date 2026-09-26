package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportMatchSupportTest {

    @Test
    void sameInvoiceNumberOwnsTheDraft() {
        StockReceipt receipt = StockReceipt.builder().invoiceNumber("is-101").build();
        assertTrue(PharmacyImportMatchSupport.receiptOwnsInvoice(receipt, "IS-101"));
    }

    @Test
    void linesFromThisInvoiceOwnTheDraftWhenNumberDiffers() {
        Product product = Product.builder().sku("IS-101-L-1").uzInvoiceDocumentId("IS-101").build();
        StockReceiptLine line = StockReceiptLine.builder().product(product).build();
        StockReceipt receipt = StockReceipt.builder()
            .invoiceNumber("поставщик-9")
            .lines(List.of(line))
            .build();
        assertTrue(PharmacyImportMatchSupport.receiptOwnsInvoice(receipt, "is-101"));
    }

    @Test
    void anotherDraftDoesNotOwnTheInvoice() {
        StockReceipt receipt = StockReceipt.builder().invoiceNumber("другой").lines(List.of()).build();
        assertFalse(PharmacyImportMatchSupport.receiptOwnsInvoice(receipt, "IS-101"));
    }
}
