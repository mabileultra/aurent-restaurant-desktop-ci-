package com.pos.sales.service.sale.support;

import com.pos.sales.entity.Sale;
import org.springframework.stereotype.Component;

/**
 * AUR-21: печатать ли QR-код ОФД на чеке.
 * <p>
 * По правилам налоговой чек аванса и чек кредита — не окончательная продажа: QR на них не печатается,
 * только 12-значный фискальный признак. Сервер ставит флаг сам по типу чека (старые кассы его не присылают).
 * Для обычной продажи флаг задаёт касса (настройка «Fiskal QR»), по умолчанию — печатать.
 */
@Component
public class SaleFiscalQrPolicy {

    public boolean printFiscalQr(Sale.ReceiptType receiptType, Boolean requested) {
        if (isQrSuppressed(receiptType)) {
            return false;
        }
        return requested == null || requested;
    }

    /** Аванс и кредит: QR не печатается, но чек фискализируется как обычно. */
    public boolean isQrSuppressed(Sale.ReceiptType receiptType) {
        return receiptType == Sale.ReceiptType.ADVANCE || receiptType == Sale.ReceiptType.CREDIT;
    }
}
