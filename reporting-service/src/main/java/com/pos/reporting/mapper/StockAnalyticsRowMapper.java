package com.pos.reporting.mapper;

import com.pos.reporting.dto.stock.pos.PosDeadStockRow;
import com.pos.reporting.dto.stock.pos.PosLowStockRow;
import com.pos.reporting.dto.stock.pos.PosStockBalanceRow;
import com.pos.reporting.dto.stock.pos.PosStockTurnoverRow;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.UUID;

@Component
public class StockAnalyticsRowMapper {

    public PosStockBalanceRow toBalanceRow(Object[] row) {
        return new PosStockBalanceRow(
            UUID.fromString((String) row[0]),
            (String) row[1],
            (String) row[2],
            (String) row[3],
            (String) row[4],
            toBigDecimal(row[5]),
            intVal(row[6]),
            toBigDecimal(row[7]).setScale(2, RoundingMode.HALF_UP),
            toBigDecimal(row[8]).setScale(2, RoundingMode.HALF_UP)
        );
    }

    public PosStockTurnoverRow toTurnoverRow(Object[] row) {
        return new PosStockTurnoverRow(
            UUID.fromString((String) row[0]),
            (String) row[1],
            (String) row[2],
            (String) row[3],
            longVal(row[4]),
            longVal(row[5]),
            longVal(row[6]),
            longVal(row[7]),
            longVal(row[8]),
            longVal(row[9]),
            longVal(row[10]),
            toBigDecimal(row[11]).setScale(2, RoundingMode.HALF_UP)
        );
    }

    public PosDeadStockRow toDeadStockRow(Object[] row) {
        return new PosDeadStockRow(
            UUID.fromString((String) row[0]),
            (String) row[1],
            (String) row[2],
            (String) row[3],
            (String) row[4],
            toBigDecimal(row[5]),
            toBigDecimal(row[6]).setScale(2, RoundingMode.HALF_UP),
            toLocalDate(row[7]),
            intVal(row[8])
        );
    }

    public PosLowStockRow toLowStockRow(Object[] row) {
        return new PosLowStockRow(
            UUID.fromString((String) row[0]),
            (String) row[1],
            (String) row[2],
            (String) row[3],
            toBigDecimal(row[4]),
            intVal(row[5]),
            toBigDecimal(row[6]).setScale(3, RoundingMode.HALF_UP),
            toBigDecimal(row[7]).setScale(2, RoundingMode.HALF_UP),
            toBigDecimal(row[8]).setScale(2, RoundingMode.HALF_UP)
        );
    }

    private static long longVal(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.setScale(0, RoundingMode.HALF_UP).longValue();
        }
        return ((Number) value).longValue();
    }

    private static int intVal(Object value) {
        if (value == null) {
            return 0;
        }
        return ((Number) value).intValue();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate date) {
            return date;
        }
        if (value instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }
}
