package com.pos.sales.service.sale.support;

import com.pos.sales.entity.Sale;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AUR-21: чек аванса и чек кредита — не окончательная продажа, QR ОФД на них не печатается
 * (только 12-значный фискальный признак). Сервер ставит флаг сам, касса может его не присылать.
 */
class SaleFiscalQrPolicyTest {

    private final SaleFiscalQrPolicy policy = new SaleFiscalQrPolicy();

    @Test
    void advanceAndCreditNeverPrintQrWhateverTheClientSent() {
        for (Sale.ReceiptType type : new Sale.ReceiptType[] {Sale.ReceiptType.ADVANCE, Sale.ReceiptType.CREDIT}) {
            for (Boolean requested : Arrays.asList(null, Boolean.TRUE, Boolean.FALSE)) {
                assertThat(policy.printFiscalQr(type, requested)).as(type + " / " + requested).isFalse();
            }
            assertThat(policy.isQrSuppressed(type)).as(type.name()).isTrue();
        }
    }

    @Test
    void ordinarySaleKeepsCashierChoiceAndDefaultsToQr() {
        assertThat(policy.printFiscalQr(Sale.ReceiptType.SALE, null)).isTrue();
        assertThat(policy.printFiscalQr(Sale.ReceiptType.SALE, Boolean.TRUE)).isTrue();
        assertThat(policy.printFiscalQr(Sale.ReceiptType.SALE, Boolean.FALSE)).isFalse();
        assertThat(policy.isQrSuppressed(Sale.ReceiptType.SALE)).isFalse();
        assertThat(policy.isQrSuppressed(null)).isFalse();
    }
}
