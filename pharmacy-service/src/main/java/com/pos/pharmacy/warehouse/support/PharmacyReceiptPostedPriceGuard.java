package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import org.springframework.stereotype.Component;

/** На проведённом приходе разрешены только цены, не остаток и не серия. */
@Component
public class PharmacyReceiptPostedPriceGuard {

    public void requireMassField(StockReceipt receipt, PharmacyReceiptMassField field) {
        if (receipt == null || field == null) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_MASS_FIELD_REQUIRED);
        }
        if (StockReceiptStatus.DRAFT.equals(receipt.getStatus())) {
            return;
        }
        if (!StockReceiptStatus.POSTED.equals(receipt.getStatus())) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_DRAFT_ONLY);
        }
        if (field.locksStock()) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_POSTED_FIELD_LOCKED);
        }
    }
}
