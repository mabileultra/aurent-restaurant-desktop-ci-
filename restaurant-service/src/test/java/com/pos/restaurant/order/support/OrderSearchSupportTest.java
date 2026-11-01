package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.shared.api.DateRangeLimits;
import com.pos.shared.api.PageLimits;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderSearchSupportTest {

    @Test
    void pageableCapsSize() {
        var pageable = OrderSearchSupport.pageable(PageRequest.of(2, 500));
        assertThat(pageable.getPageNumber()).isEqualTo(2);
        assertThat(pageable.getPageSize()).isEqualTo(PageLimits.MAX_SIZE);
    }

    @Test
    void searchTermUsesFilterText() {
        assertThat(OrderSearchSupport.searchTerm("  ")).isNull();
        assertThat(OrderSearchSupport.searchTerm("  Ali  ")).isEqualTo("Ali");
    }

    @Test
    void completePeriodUsesOpsLimit() {
        Instant from = Instant.parse("2026-01-01T00:00:00Z");
        Instant to = from.plus(Duration.ofDays(30));
        assertThat(OrderSearchSupport.requirePeriodIfComplete(from, to).from()).isEqualTo(from);

        Instant over = from.plus(Duration.ofDays(DateRangeLimits.MAX_DAYS_OPS)).plusSeconds(1);
        assertThatThrownBy(() -> OrderSearchSupport.requirePeriodIfComplete(from, over))
            .isInstanceOf(ValidationException.class);
    }

    @Test
    void oneSidedPeriodAllowed() {
        Instant from = Instant.parse("2026-01-01T00:00:00Z");
        assertThat(OrderSearchSupport.requirePeriodIfComplete(from, null).from()).isEqualTo(from);
        assertThat(OrderSearchSupport.requirePeriodIfComplete(from, null).to()).isNull();
    }
}
