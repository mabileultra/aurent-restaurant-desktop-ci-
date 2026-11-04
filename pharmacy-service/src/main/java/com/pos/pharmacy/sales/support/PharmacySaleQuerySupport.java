package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.shared.api.PageLimits;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Shared parsing / paging helpers for pharmacy sales list queries.
 */
public final class PharmacySaleQuerySupport {

    public static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Tashkent");

    private PharmacySaleQuerySupport() {
    }

    /**
     * PostgreSQL cannot type-check {@code :instant IS NULL OR createdAt >= :instant}.
     * Always bind concrete bounds (same pattern as grocery SalesQuerySupport).
     */
    public static Instant startOfDay(LocalDate date) {
        if (date == null) {
            return Instant.EPOCH;
        }
        return date.atStartOfDay(REPORT_ZONE).toInstant();
    }

    public static Instant startOfNextDay(LocalDate date) {
        if (date == null) {
            return Instant.now().plus(3650, ChronoUnit.DAYS);
        }
        return date.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();
    }

    public static Pageable boundedPage(Pageable pageable) {
        return PageRequest.of(
            PageLimits.normalizePage(pageable.getPageNumber()),
            PageLimits.normalizeSize(pageable.getPageSize()),
            pageable.getSort()
        );
    }

    public static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    public static UUID parseUuid(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    public static SaleEnums.PaymentMethod parsePayment(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return SaleEnums.PaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    public static SaleEnums.SaleStatus parseStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return SaleEnums.SaleStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    public static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    public static String extractReturnReason(String notes) {
        if (!StringUtils.hasText(notes)) {
            return null;
        }
        String text = notes.trim();
        int voidAt = text.toUpperCase().lastIndexOf("VOID:");
        if (voidAt >= 0) {
            return text.substring(voidAt + 5).trim();
        }
        int partialAt = text.toUpperCase().lastIndexOf("PARTIAL_RETURN:");
        if (partialAt >= 0) {
            return text.substring(partialAt + 15).trim();
        }
        return text;
    }
}
