package com.pos.restaurant.payment.support;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.shared.payment.CardCategory;
import com.pos.shared.payment.CardDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

/**
 * Чек пробивается до /pay: 400 только на полный номер соцкарты (касса его не шлёт),
 * остальное — оплата сохраняется, неверное поле обнуляется, WARN без значений.
 */
class PaymentCardDetailsPolicyTest {

    private static final String FULL_NUMBER = "8600555566661234";
    private static final String RRN = "123456789012";
    private static final BigDecimal CARD_SHARE = new BigDecimal("50000.00");
    private static final UUID ORDER = UUID.randomUUID();

    private final PaymentCardDetailsPolicy policy = new PaymentCardDetailsPolicy();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(PaymentCardDetailsPolicy.class);

    @BeforeEach
    void captureLogs() {
        logs.start();
        logger.addAppender(logs);
    }

    @AfterEach
    void releaseLogs() {
        logger.detachAppender(logs);
    }

    @Test
    void cardPaymentKeepsNormalizedDetails() {
        CardDetails details = policy.resolve(ORDER, request(PaymentMethod.CARD, "social", "1234 5678 9012", "8600********1234"), CARD_SHARE);

        assertThat(details).isEqualTo(new CardDetails(CardCategory.SOCIAL, RRN, "8600********1234"));
        assertThat(logs.list).isEmpty();
    }

    @Test
    void fullSocialCardNumberIs400WithoutTheNumber() {
        BusinessException ex = catchThrowableOfType(
            () -> policy.resolve(ORDER, request(PaymentMethod.CARD, "SOCIAL", RRN, FULL_NUMBER), CARD_SHARE),
            BusinessException.class
        );

        assertThat(ex.getStatus().value()).isEqualTo(400);
        assertThat(ex.getMessage()).doesNotContain(FULL_NUMBER).doesNotContain("55556666");
    }

    @Test
    void nonCardMethodsAndMixedWithoutCardShareAreSavedWithoutCardDetails() {
        List<PaymentMethod> methods = List.of(
            PaymentMethod.CASH, PaymentMethod.CASHLESS, PaymentMethod.MIXED, PaymentMethod.CREDIT, PaymentMethod.ADVANCE);
        for (PaymentMethod method : methods) {
            assertThat(policy.resolve(ORDER, request(method, "SOCIAL", RRN, "8600********1234"), BigDecimal.ZERO))
                .as(method.name())
                .isEqualTo(CardDetails.EMPTY);
        }
        assertThat(warnings()).contains("NOT_CARD_PAYMENT").contains(ORDER.toString()).doesNotContain(RRN);
    }

    @Test
    void badFieldIsDroppedAndTheRestKept() {
        CardDetails details = policy.resolve(ORDER, request(PaymentMethod.MIXED, "PERSONAL", "12345", null), CARD_SHARE);

        assertThat(details).isEqualTo(new CardDetails(CardCategory.PERSONAL, null, null));
        assertThat(warnings()).contains("RRN_FORMAT").doesNotContain("12345");
    }

    private String warnings() {
        return logs.list.stream().map(ILoggingEvent::getFormattedMessage).collect(Collectors.joining("\n"));
    }

    private static PayOrderRequest request(PaymentMethod method, String category, String rrn, String socialNumber) {
        return new PayOrderRequest(
            method, CARD_SHARE, null, null, null, null, null, null, null, null, category, rrn, socialNumber
        );
    }
}
