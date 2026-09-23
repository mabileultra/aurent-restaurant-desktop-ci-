package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PharmacyReceiptPostedPriceGuardTest {

    private final PharmacyReceiptPostedPriceGuard guard = new PharmacyReceiptPostedPriceGuard();

    @Test
    void allowsPriceFieldsOnPostedReceipt() {
        StockReceipt posted = StockReceipt.builder().status(StockReceiptStatus.POSTED).build();
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.RETAIL));
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.VAT));
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.PURCHASE));
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.MARKUP));
    }

    @Test
    void allowsStockFieldsOnPostedReceipt() {
        StockReceipt posted = StockReceipt.builder().status(StockReceiptStatus.POSTED).build();
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.QUANTITY));
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.BATCH));
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.EXPIRY));
        assertDoesNotThrow(() -> guard.requireMassField(posted, PharmacyReceiptMassField.UNITS_IN_PACK));
    }

    @Test
    void allowsAnyFieldOnDraft() {
        StockReceipt draft = StockReceipt.builder().status(StockReceiptStatus.DRAFT).build();
        assertDoesNotThrow(() -> guard.requireMassField(draft, PharmacyReceiptMassField.QUANTITY));
        assertDoesNotThrow(() -> guard.requireMassField(draft, PharmacyReceiptMassField.UNITS_IN_PACK));
        assertDoesNotThrow(() -> guard.requireMassField(draft, PharmacyReceiptMassField.BATCH));
    }

    @Test
    void rejectsUnknownStatus() {
        StockReceipt other = StockReceipt.builder().status("ARCHIVED").build();
        assertThrows(BusinessException.class, () -> guard.requireMassField(other, PharmacyReceiptMassField.RETAIL));
    }
}
