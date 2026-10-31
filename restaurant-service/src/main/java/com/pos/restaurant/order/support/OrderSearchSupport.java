package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.shared.api.DateRangeLimits;
import com.pos.shared.api.FilterText;
import com.pos.shared.api.FilterValidationException;
import com.pos.shared.api.InstantRange;
import com.pos.shared.api.PageLimits;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.Instant;

/** Shared page/filter/period rules for order channel search. */
public final class OrderSearchSupport {

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "openedAt");

    private OrderSearchSupport() {
    }

    public static Pageable pageable(Pageable pageable) {
        int page = PageLimits.normalizePage(pageable == null ? 0 : pageable.getPageNumber());
        int size = PageLimits.normalizeSize(pageable == null ? 0 : pageable.getPageSize());
        Sort sort = pageable == null || pageable.getSort().isUnsorted() ? DEFAULT_SORT : pageable.getSort();
        return PageRequest.of(page, size, sort);
    }

    public static String searchTerm(String raw) {
        return FilterText.normalizeSearch(raw);
    }

    /**
     * When both bounds are set — ops max span. One-sided filters stay as-is.
     */
    public static InstantRange requirePeriodIfComplete(Instant from, Instant to) {
        if (from == null && to == null) {
            return null;
        }
        if (from == null || to == null) {
            return new InstantRange(from, to);
        }
        try {
            return DateRangeLimits.requireOps(from, to);
        } catch (FilterValidationException ex) {
            throw new ValidationException(ex.getMessage());
        }
    }
}
