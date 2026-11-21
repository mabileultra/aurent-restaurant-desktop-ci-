package com.pos.reporting.support;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Date;

/** Shared JDBC Object[] → typed values for reporting native queries. */
public final class ReportingJdbcValues {

    private ReportingJdbcValues() {}

    public static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        return ((Number) value).longValue();
    }

    public static Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        return ((Number) value).intValue();
    }

    public static BigDecimal toMoney(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }

    public static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate d) {
            return d;
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }

    public static Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Timestamp ts) {
            return ts.toInstant();
        }
        if (value instanceof OffsetDateTime odt) {
            return odt.toInstant();
        }
        if (value instanceof Date date) {
            return date.toInstant();
        }
        return Instant.parse(value.toString());
    }
}
