package com.pos.pharmacy.sales.support;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.dto.CreateSaleRequest;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.shared.payment.CardCategory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

/**
 * Касса отправляет продажу уже после пробития чека: 400 только на полный номер соцкарты,
 * остальное — продажа сохраняется, неверное поле обнуляется, WARN без значений.
 */
class PharmacySaleCardDetailsApplierTest {

    private static final String FULL_NUMBER = "8600555566661234";
    private static final String RRN = "123456789012";

    private final PharmacySaleCardDetailsApplier applier = new PharmacySaleCardDetailsApplier();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(PharmacySaleCardDetailsApplier.class);

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
    void cardSaleKeepsNormalizedCardDetails() {
        Sale sale = sale(SaleEnums.PaymentMethod.CARD, "100.00");

        applier.apply(sale, request("SOCIAL", RRN, "8600********1234"), false);

        assertThat(sale.getCardCategory()).isEqualTo(CardCategory.SOCIAL);
        assertThat(sale.getRrn()).isEqualTo(RRN);
        assertThat(sale.getSocialCardNumber()).isEqualTo("8600********1234");
        assertThat(logs.list).isEmpty();
    }

    @Test
    void fullSocialCardNumberIs400WithPharmacyCodeAndNoNumber() {
        Sale sale = sale(SaleEnums.PaymentMethod.CARD, "100.00");

        BusinessException ex = catchThrowableOfType(
            () -> applier.apply(sale, request("SOCIAL", RRN, FULL_NUMBER), false),
            BusinessException.class
        );

        assertThat(ex.getCode()).isEqualTo(PharmacySaleErrors.PHARM_SALE_CARD_SOCIAL_NUMBER_UNMASKED.name());
        assertThat(ex.getStatus().value()).isEqualTo(400);
        assertThat(ex.getMessage()).doesNotContain(FULL_NUMBER).doesNotContain("55556666");
        assertThat(ex.getContext()).isEqualTo(Map.of("field", "socialCardNumber"));
    }

    @Test
    void mixedWithoutCardShareAndCashlessAreSavedWithoutCardDetails() {
        for (Sale sale : List.of(sale(SaleEnums.PaymentMethod.MIXED, "0.00"), sale(SaleEnums.PaymentMethod.CASHLESS, "100.00"))) {
            applier.apply(sale, request("PERSONAL", RRN, null), false);

            assertThat(sale.getCardCategory()).isNull();
            assertThat(sale.getRrn()).isNull();
        }
        assertThat(warnings()).contains("NOT_CARD_PAYMENT").doesNotContain(RRN);
    }

    @Test
    void badFieldIsDroppedAndTheRestKept() {
        Sale sale = sale(SaleEnums.PaymentMethod.MIXED, "40.00");

        applier.apply(sale, request("PERSONAL", "12345", null), false);

        assertThat(sale.getCardCategory()).isEqualTo(CardCategory.PERSONAL);
        assertThat(sale.getRrn()).isNull();
        assertThat(warnings()).contains("RRN_FORMAT").doesNotContain("12345");
    }

    @Test
    void offlineSaleWithFullNumberIsKeptWithoutIt() {
        Sale sale = sale(SaleEnums.PaymentMethod.CARD, "100.00");

        applier.apply(sale, request("SOCIAL", RRN, FULL_NUMBER), true);

        assertThat(sale.getRrn()).isEqualTo(RRN);
        assertThat(sale.getSocialCardNumber()).isNull();
        assertThat(warnings()).contains("SOCIAL_NUMBER_UNMASKED").doesNotContain("55556666");
    }

    private String warnings() {
        return logs.list.stream().map(ILoggingEvent::getFormattedMessage).collect(Collectors.joining("\n"));
    }

    private static Sale sale(SaleEnums.PaymentMethod method, String cardAmount) {
        return Sale.builder().paymentMethod(method).cardAmount(new BigDecimal(cardAmount)).build();
    }

    private static CreateSaleRequest request(String category, String rrn, String socialNumber) {
        return new CreateSaleRequest(
            List.of(), "CARD", 1, null, null, null, null, null, null, null, null, null, "SALE", null,
            null, null, null, null, null, category, rrn, socialNumber
        );
    }
}
