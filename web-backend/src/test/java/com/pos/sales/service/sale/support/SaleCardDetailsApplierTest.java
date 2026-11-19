package com.pos.sales.service.sale.support;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.pos.exception.BadRequestException;
import com.pos.sales.dto.sale.CreateSaleRequest;
import com.pos.sales.entity.Sale;
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
 * Касса отправляет продажу уже после пробития чека: 400 только на полный номер соцкарты
 * (касса его никогда не шлёт), остальное — продажа сохраняется, неверное поле обнуляется, WARN без значений.
 */
class SaleCardDetailsApplierTest {

    private static final String FULL_NUMBER = "8600555566661234";
    private static final String RRN = "123456789012";

    private final SaleCardDetailsApplier applier = new SaleCardDetailsApplier();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(SaleCardDetailsApplier.class);

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
        Sale sale = sale(Sale.PaymentMethod.CARD, "100.00", Sale.ReceiptType.SALE);

        applier.apply(sale, request("social", "1234-5678-9012", "8600********1234"));

        assertThat(sale.getCardCategory()).isEqualTo(CardCategory.SOCIAL);
        assertThat(sale.getRrn()).isEqualTo(RRN);
        assertThat(sale.getSocialCardNumber()).isEqualTo("8600********1234");
        assertThat(logs.list).isEmpty();
    }

    @Test
    void fullSocialCardNumberIs400WithoutTheNumber() {
        Sale sale = sale(Sale.PaymentMethod.CARD, "100.00", Sale.ReceiptType.SALE);

        BadRequestException ex = catchThrowableOfType(
            () -> applier.apply(sale, request("SOCIAL", RRN, FULL_NUMBER)),
            BadRequestException.class
        );

        assertThat(ex.getMessage()).doesNotContain(FULL_NUMBER).doesNotContain("55556666");
        assertThat(ex.context()).isEqualTo(Map.of(
            "reasonCode", "CARD_DETAILS_SOCIAL_NUMBER_UNMASKED", "field", "socialCardNumber"));
        assertThat(sale.getSocialCardNumber()).isNull();
    }

    @Test
    void mixedSaleWithoutCardShareIsSavedWithoutCardDetails() {
        Sale sale = sale(Sale.PaymentMethod.MIXED, "0.00", Sale.ReceiptType.SALE);

        applier.apply(sale, request("SOCIAL", RRN, "8600********1234"));

        assertNoCardDetails(sale);
        assertThat(warnings()).contains("NOT_CARD_PAYMENT").doesNotContain(RRN).doesNotContain("8600");
    }

    @Test
    void creditAndNonCardMethodsAreSavedWithoutCardDetails() {
        List<Sale> sales = List.of(
            sale(Sale.PaymentMethod.CARD, "0.00", Sale.ReceiptType.CREDIT),
            sale(Sale.PaymentMethod.CASH, "0.00", Sale.ReceiptType.SALE),
            sale(Sale.PaymentMethod.CASHLESS, "100.00", Sale.ReceiptType.SALE),
            sale(Sale.PaymentMethod.MPESA, "100.00", Sale.ReceiptType.SALE)
        );
        for (Sale sale : sales) {
            applier.apply(sale, request("PERSONAL", RRN, null));

            assertNoCardDetails(sale);
        }
    }

    @Test
    void badFieldIsDroppedAndTheRestKept() {
        Sale sale = sale(Sale.PaymentMethod.MIXED, "40.00", Sale.ReceiptType.SALE);

        applier.apply(sale, request("PERSONAL", "12345", null));

        assertThat(sale.getCardCategory()).isEqualTo(CardCategory.PERSONAL);
        assertThat(sale.getRrn()).isNull();
        assertThat(warnings()).contains("RRN_FORMAT").doesNotContain("12345");
    }

    @Test
    void offlineSaleWithFullNumberIsKeptWithoutIt() {
        Sale sale = sale(Sale.PaymentMethod.CARD, "100.00", Sale.ReceiptType.SALE);

        applier.applyOffline(sale, request("SOCIAL", RRN, FULL_NUMBER));

        assertThat(sale.getCardCategory()).isEqualTo(CardCategory.SOCIAL);
        assertThat(sale.getRrn()).isEqualTo(RRN);
        assertThat(sale.getSocialCardNumber()).isNull();
        assertThat(warnings()).contains("SOCIAL_NUMBER_UNMASKED").doesNotContain("55556666");
    }

    private String warnings() {
        return logs.list.stream().map(ILoggingEvent::getFormattedMessage).collect(Collectors.joining("\n"));
    }

    private static void assertNoCardDetails(Sale sale) {
        assertThat(sale.getCardCategory()).isNull();
        assertThat(sale.getRrn()).isNull();
        assertThat(sale.getSocialCardNumber()).isNull();
    }

    private static Sale sale(Sale.PaymentMethod method, String cardAmount, Sale.ReceiptType receiptType) {
        return Sale.builder()
            .receiptNumber("R-1")
            .paymentMethod(method)
            .cardAmount(new BigDecimal(cardAmount))
            .receiptType(receiptType)
            .build();
    }

    private static CreateSaleRequest request(String category, String rrn, String socialNumber) {
        return new CreateSaleRequest(
            List.of(), "CARD", null, null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, category, rrn, socialNumber
        );
    }
}
