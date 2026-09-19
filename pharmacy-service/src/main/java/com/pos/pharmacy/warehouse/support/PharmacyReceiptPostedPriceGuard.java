package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.warehouse.domain.PharmacyReceiptMassField;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import org.springframework.stereotype.Component;

/** На проведённом приходе разрешены только цены, не остаток и не серия. */
@Component
public class PharmacyReceiptPostedPriceGuard {

    public void requireMassField(StockReceipt receipt, PharmacyReceiptMassField field) {
        if (receipt == null || field == null) {
            throw PharmacyErrors.badRequest("Mass field is required");
        }
        if (StockReceiptStatus.DRAFT.equals(receipt.getStatus())) {
            return;
        }
        if (!StockReceiptStatus.POSTED.equals(receipt.getStatus())) {
            throw PharmacyErrors.badRequest("Only draft pharmacy receipts can be edited");
        }
        if (field.locksStock()) {
            throw PharmacyErrors.badRequest(
                "После проведения можно менять только цены. Количество, серия и срок нельзя."
            );
        }
    }
}
