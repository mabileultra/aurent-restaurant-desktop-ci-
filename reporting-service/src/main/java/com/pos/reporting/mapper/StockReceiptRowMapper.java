package com.pos.reporting.mapper;

import com.pos.reporting.dto.StockReceiptRowResponse;
import com.pos.reporting.entity.StockReceiptFact;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;

@Component
public class StockReceiptRowMapper {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public StockReceiptRowResponse toRow(StockReceiptFact fact) {
        return new StockReceiptRowResponse(
            fact.getReceiptId(),
            fact.getReceiptNumber(),
            resolveCreatedAt(fact),
            fact.getSupplierName(),
            defaultQuantity(fact.getTotalQuantity()),
            fact.getTotalAmount() != null ? fact.getTotalAmount() : BigDecimal.ZERO
        );
    }

    private static Instant resolveCreatedAt(StockReceiptFact fact) {
        if (fact.getCreatedAt() != null) {
            return fact.getCreatedAt();
        }
        if (fact.getTransactionDate() != null) {
            return fact.getTransactionDate().atStartOfDay(ZONE).toInstant();
        }
        return fact.getIngestedAt();
    }

    private static BigDecimal defaultQuantity(BigDecimal quantity) {
        return quantity != null ? quantity : BigDecimal.ZERO;
    }
}
