package com.pos.restaurant.report.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.report.domain.ReceiptStatus;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReceiptJournalCriteriaTest {

    private static final Instant FROM = Instant.parse("2026-10-01T00:00:00Z");
    private static final Instant TO = Instant.parse("2026-10-02T00:00:00Z");

    @Test
    void requiresValidPeriod() {
        assertThatThrownBy(() -> ReceiptJournalCriteria.of(1, 1, null))
            .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> ReceiptJournalCriteria.of(1, 1, filter(TO, FROM, null, null)))
            .isInstanceOf(ValidationException.class);
        assertThatThrownBy(() -> ReceiptJournalCriteria.of(
            1, 1, filter(FROM, FROM.plus(ReceiptJournalCriteria.MAX_RANGE).plusSeconds(1), null, null)))
            .isInstanceOf(ValidationException.class);
    }

    @Test
    void scopesToTenantAndLatestPayment() {
        ReceiptJournalCriteria criteria = ReceiptJournalCriteria.of(7, 9, filter(FROM, TO, null, null));

        assertThat(criteria.params()).containsEntry("companyId", 7).containsEntry("storeId", 9);
        assertThat(criteria.where()).contains("max(p2.paidAt)").doesNotContain(":searchLike");
    }

    @Test
    void statusMapsToOrderStatus() {
        assertThat(ReceiptJournalCriteria.of(1, 1, filter(FROM, TO, ReceiptStatus.REFUNDED, null)).params())
            .containsEntry("receiptStatus", OrderStatus.REFUNDED);
        ReceiptJournalCriteria partial = ReceiptJournalCriteria.of(1, 1, filter(FROM, TO, ReceiptStatus.PARTIAL_REFUND, null));
        assertThat(partial.params()).containsEntry("receiptStatus", OrderStatus.CLOSED);
        assertThat(partial.where()).contains("and exists");
        assertThat(ReceiptJournalCriteria.of(1, 1, filter(FROM, TO, ReceiptStatus.PAID, null)).where())
            .contains("and not exists");
    }

    @Test
    void searchEscapesWildcardsAndDetectsOrderNumber() {
        ReceiptJournalCriteria text = ReceiptJournalCriteria.of(1, 1, filter(FROM, TO, null, " 50%_Off "));
        assertThat(text.params()).containsEntry("searchLike", "%50\\%\\_off%").doesNotContainKey("searchNo");

        ReceiptJournalCriteria number = ReceiptJournalCriteria.of(1, 1, filter(FROM, TO, null, "№ 42"));
        assertThat(number.params()).containsEntry("searchNo", 42);
    }

    @Test
    void periodLimitIsOneYear() {
        assertThat(ReceiptJournalCriteria.MAX_RANGE).isEqualTo(Duration.ofDays(366));
    }

    private static ReceiptJournalFilter filter(Instant from, Instant to, ReceiptStatus status, String search) {
        return new ReceiptJournalFilter(from, to, null, status, null, null, null, null, search);
    }
}
