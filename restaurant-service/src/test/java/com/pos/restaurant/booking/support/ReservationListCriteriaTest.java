package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.dto.ReservationListFilter;
import com.pos.restaurant.exception.ValidationException;
import com.pos.shared.api.DateRangeLimits;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReservationListCriteriaTest {

    private static final Instant FROM = Instant.parse("2026-10-01T00:00:00Z");
    private static final Instant TO = Instant.parse("2026-10-10T00:00:00Z");

    @Test
    void periodListScopesTenantAndRange() {
        ReservationListCriteria criteria = ReservationListCriteria.of(
            7, 9, new ReservationListFilter(FROM, TO, false, null, null)
        );

        assertThat(criteria.params())
            .containsEntry("companyId", 7)
            .containsEntry("storeId", 9)
            .containsEntry("from", FROM)
            .containsEntry("to", TO);
        assertThat(criteria.where()).contains("reservedAt").doesNotContain("searchLike");
        assertThat(criteria.statsWhere()).isEqualTo(criteria.where());
    }

    @Test
    void activeOnlyUsesActiveStatusesWithoutPeriod() {
        ReservationListCriteria criteria = ReservationListCriteria.of(
            1, 2, new ReservationListFilter(null, null, true, null, null)
        );

        assertThat(criteria.params()).containsKey("activeStatuses").doesNotContainKeys("from", "to");
        assertThat(criteria.where()).contains("r.status in :activeStatuses");
    }

    @Test
    void statusAndSearchNarrowListButNotStats() {
        ReservationListCriteria criteria = ReservationListCriteria.of(
            1, 1, new ReservationListFilter(FROM, TO, false, ReservationStatus.CONFIRMED, "  Ali% ")
        );

        assertThat(criteria.params())
            .containsEntry("status", ReservationStatus.CONFIRMED)
            .containsEntry("searchLike", "%ali\\%%");
        assertThat(criteria.where()).contains("r.status = :status").contains("searchLike");
        assertThat(criteria.statsWhere()).doesNotContain("searchLike").doesNotContain(":status");
        assertThat(criteria.statsParams()).doesNotContainKeys("status", "searchLike");
    }

    @Test
    void rejectsOpsRangeOverLimit() {
        Instant end = FROM.plus(Duration.ofDays(DateRangeLimits.MAX_DAYS_OPS)).plusSeconds(1);
        assertThatThrownBy(() -> ReservationListCriteria.of(
            1, 1, new ReservationListFilter(FROM, end, false, null, null)
        )).isInstanceOf(ValidationException.class);
    }
}
