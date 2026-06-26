package com.pos.reporting.mapper;

import com.pos.reporting.dto.stock.pos.PosStockMovementRow;
import com.pos.reporting.dto.stock.pos.PosWriteOffRow;
import com.pos.reporting.entity.StockMovementFact;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;

@Component
public class StockMovementRowMapper {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public PosStockMovementRow toMovementRow(StockMovementFact fact) {
        return new PosStockMovementRow(
            fact.getMovementId(),
            resolveCreatedAt(fact),
            fact.getMovementType(),
            fact.getProductId(),
            fact.getProductName(),
            fact.getSku(),
            fact.getQuantity(),
            fact.getNotes(),
            fact.getWriteOffReason(),
            fact.getStoreId(),
            fact.getStoreName(),
            fact.getCreatedByName(),
            fact.getReferenceId(),
            fact.getReferenceNumber()
        );
    }

    public PosWriteOffRow toWriteOffRow(StockMovementFact fact) {
        BigDecimal units = absQuantity(fact.getQuantity());
        return new PosWriteOffRow(
            fact.getMovementId(),
            resolveCreatedAt(fact),
            fact.getProductId(),
            fact.getProductName(),
            fact.getSku(),
            units,
            fact.getWriteOffReason() != null ? fact.getWriteOffReason() : "OTHER",
            fact.getNotes(),
            fact.getStoreId(),
            fact.getStoreName(),
            fact.getCreatedByName(),
            lossAmount(units, fact.getUnitCostEstimate())
        );
    }

    private static Instant resolveCreatedAt(StockMovementFact fact) {
        if (fact.getCreatedAt() != null) {
            return fact.getCreatedAt();
        }
        if (fact.getTransactionDate() != null) {
            return fact.getTransactionDate().atStartOfDay(ZONE).toInstant();
        }
        return fact.getIngestedAt();
    }

    private static BigDecimal absQuantity(BigDecimal quantity) {
        if (quantity == null) {
            return BigDecimal.ZERO;
        }
        return quantity.signum() < 0 ? quantity.negate() : quantity.setScale(3, RoundingMode.HALF_UP);
    }

    private static BigDecimal lossAmount(BigDecimal units, BigDecimal unitCostEstimate) {
        if (units == null || unitCostEstimate == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return units.multiply(unitCostEstimate).setScale(2, RoundingMode.HALF_UP);
    }
}
