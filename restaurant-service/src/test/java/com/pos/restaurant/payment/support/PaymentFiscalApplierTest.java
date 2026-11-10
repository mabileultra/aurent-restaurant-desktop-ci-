package com.pos.restaurant.payment.support;

import com.pos.restaurant.payment.dto.PaymentFiscalPayload;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class PaymentFiscalApplierTest {

    private final PaymentFiscalApplier applier = new PaymentFiscalApplier();

    @Test
    void writesProofWithoutQrAndSetsFiscalizedAt() {
        FloorOrderPayment payment = new FloorOrderPayment();
        applier.apply(payment, new PaymentFiscalPayload(
            "fiscalized",
            " 848035748636 ",
            "583",
            "mk-sale-1",
            "UZ190912014310"
        ));

        assertEquals("FISCALIZED", payment.getFiscalStatus());
        assertEquals("848035748636", payment.getFiscalSign());
        assertEquals("583", payment.getFiscalReceiptSeq());
        assertEquals("mk-sale-1", payment.getMultikassaSaleId());
        assertEquals("UZ190912014310", payment.getFiscalTerminalId());
        assertNotNull(payment.getFiscalizedAt());
    }

    @Test
    void ignoresNullPayload() {
        FloorOrderPayment payment = new FloorOrderPayment();
        applier.apply(payment, null);
        assertNull(payment.getFiscalStatus());
    }
}
