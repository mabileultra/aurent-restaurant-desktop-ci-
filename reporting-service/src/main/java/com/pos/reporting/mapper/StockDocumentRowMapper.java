package com.pos.reporting.mapper;

import com.pos.reporting.dto.stock.pos.PosStockInventoryRow;
import com.pos.reporting.dto.stock.pos.PosStockTransferRow;
import com.pos.reporting.entity.StockInventoryFact;
import com.pos.reporting.entity.StockTransferFact;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;

@Component
public class StockDocumentRowMapper {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    public PosStockInventoryRow toInventoryRow(StockInventoryFact fact) {
        return new PosStockInventoryRow(
            fact.getInventoryId(),
            fact.getInventoryNumber(),
            fact.getStoreId(),
            fact.getStoreName(),
            fact.getStatus(),
            fact.getNotes(),
            fact.getTotalLines(),
            fact.getTotalDifference(),
            fact.getCreatedByName(),
            resolveCreatedAt(fact.getCreatedAt(), fact.getTransactionDate(), fact.getIngestedAt())
        );
    }

    public PosStockTransferRow toTransferRow(StockTransferFact fact) {
        return new PosStockTransferRow(
            fact.getTransferId(),
            fact.getTransferNumber(),
            fact.getFromStoreId(),
            fact.getFromStoreName(),
            fact.getToStoreId(),
            fact.getToStoreName(),
            fact.getNotes(),
            fact.getTotalQuantity(),
            fact.getCreatedByName(),
            resolveCreatedAt(fact.getCreatedAt(), fact.getTransactionDate(), fact.getIngestedAt())
        );
    }

    private static Instant resolveCreatedAt(Instant createdAt, java.time.LocalDate transactionDate, Instant ingestedAt) {
        if (createdAt != null) {
            return createdAt;
        }
        if (transactionDate != null) {
            return transactionDate.atStartOfDay(ZONE).toInstant();
        }
        return ingestedAt;
    }
}
