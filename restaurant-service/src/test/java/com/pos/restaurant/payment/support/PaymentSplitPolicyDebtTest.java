package com.pos.restaurant.payment.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PaymentSplitPolicyDebtTest {

    private static final BigDecimal DUE = new BigDecimal("120000.00");

    private final PaymentSplitPolicy policy = new PaymentSplitPolicy();

    private static PayOrderRequest request(PaymentMethod method, String phone, String comment, String advance) {
        return new PayOrderRequest(
            method,
            DUE,
            null,
            null,
            null,
            null,
            null,
            phone,
            comment,
            advance == null ? null : new BigDecimal(advance)
        );
    }

    @Test
    void drawerMethodsHaveNoDebt() {
        assertNull(policy.resolveDebt(request(PaymentMethod.CASH, null, null, null), DUE));
        assertNull(policy.resolveDebt(request(PaymentMethod.CARD, "+998901112233", null, null), DUE));
        assertNull(policy.resolveDebt(request(PaymentMethod.MIXED, null, null, null), DUE));
        assertNull(policy.resolveDebt(request(PaymentMethod.CASHLESS, null, null, null), DUE));
    }

    @Test
    void cashlessTakesTheWholeBillOnCard() {
        PaymentSplitPolicy.Split split = policy.resolve(request(PaymentMethod.CASHLESS, null, null, null), DUE);
        assertEquals(new BigDecimal("0.00"), split.cashAmount());
        assertEquals(DUE, split.cardAmount());
        assertEquals(new BigDecimal("0.00"), split.changeGiven());
    }

    @Test
    void creditKeepsPhoneCommentAndWholeBillAsDebt() {
        PaymentSplitPolicy.Debt debt = policy.resolveDebt(
            request(PaymentMethod.CREDIT, "  +998901112233 ", "  Алишер, вернёт в пятницу ", null),
            DUE
        );

        assertEquals("+998901112233", debt.phone());
        assertEquals("Алишер, вернёт в пятницу", debt.comment());
        assertNull(debt.advancePaid());
        assertEquals(DUE, debt.remaining());
    }

    @Test
    void creditIgnoresAdvanceAmount() {
        PaymentSplitPolicy.Debt debt = policy.resolveDebt(
            request(PaymentMethod.CREDIT, "+998901112233", null, "50000"),
            DUE
        );

        assertNull(debt.advancePaid());
        assertEquals(DUE, debt.remaining());
    }

    @Test
    void blankCommentBecomesNull() {
        PaymentSplitPolicy.Debt debt = policy.resolveDebt(
            request(PaymentMethod.CREDIT, "+998901112233", "   ", null),
            DUE
        );

        assertNull(debt.comment());
    }

    @Test
    void creditAndAdvanceRequirePhone() {
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.CREDIT, null, "note", null), DUE));
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.CREDIT, "   ", "note", null), DUE));
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.ADVANCE, "", null, "50000"), DUE));
    }

    @Test
    void advanceStoresPaidAndRemaining() {
        PaymentSplitPolicy.Debt debt = policy.resolveDebt(
            request(PaymentMethod.ADVANCE, "+998901112233", "банкет", "50000"),
            DUE
        );

        assertEquals(new BigDecimal("50000.00"), debt.advancePaid());
        assertEquals(new BigDecimal("70000.00"), debt.remaining());
        assertEquals("банкет", debt.comment());
    }

    @Test
    void advanceEqualToBillLeavesNothing() {
        PaymentSplitPolicy.Debt debt = policy.resolveDebt(
            request(PaymentMethod.ADVANCE, "+998901112233", null, "120000"),
            DUE
        );

        assertEquals(new BigDecimal("0.00"), debt.remaining());
    }

    @Test
    void advanceMustBePositiveAndNotExceedBill() {
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.ADVANCE, "+998901112233", null, null), DUE));
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.ADVANCE, "+998901112233", null, "0"), DUE));
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.ADVANCE, "+998901112233", null, "-5"), DUE));
        assertThrows(ValidationException.class,
            () -> policy.resolveDebt(request(PaymentMethod.ADVANCE, "+998901112233", null, "120000.01"), DUE));
    }

    @Test
    void creditAndAdvanceSplitKeepsDrawerEmpty() {
        PaymentSplitPolicy.Split split = policy.resolve(
            request(PaymentMethod.ADVANCE, "+998901112233", null, "50000"),
            DUE
        );

        assertEquals(new BigDecimal("0.00"), split.cashAmount());
        assertEquals(new BigDecimal("0.00"), split.cardAmount());
        assertEquals(DUE, split.amountTendered());
    }
}
