package com.pos.restaurant.edge.warehouse.support;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.entity.EdgeWhDocument;
import com.pos.restaurant.edge.entity.EdgeWhLine;
import com.pos.restaurant.edge.repository.EdgeWhDocumentRepository;
import com.pos.restaurant.edge.repository.EdgeWhLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhDocWriter {

    private final EdgeWhDocumentRepository docRepository;
    private final EdgeWhLineRepository lineRepository;

    public EdgeWhDocument create(Integer companyId, String type, String prefix, Integer storeId) {
        EdgeWhDocument doc = EdgeWhDocument.builder()
            .id(UUID.randomUUID())
            .companyId(companyId)
            .docType(type)
            .docNumber(nextNumber(prefix))
            .storeId(storeId)
            .createdAt(Instant.now())
            .createdByName("edge")
            .totalQty(BigDecimal.ZERO)
            .totalCost(BigDecimal.ZERO)
            .totalDiff(BigDecimal.ZERO)
            .totalLines(0)
            .build();
        return docRepository.save(doc);
    }

    public EdgeWhDocument save(EdgeWhDocument doc) {
        return docRepository.save(doc);
    }

    public EdgeWhLine saveLine(
        UUID docId,
        EdgeProduct p,
        BigDecimal qty,
        BigDecimal purchase,
        BigDecimal sell,
        BigDecimal lineCost,
        Integer vat,
        Boolean marked,
        String storage,
        BigDecimal unitCost
    ) {
        EdgeWhLine line = EdgeWhLine.builder()
            .id(UUID.randomUUID())
            .docId(docId)
            .productId(p.getId())
            .productName(p.getName())
            .sku(p.getSku())
            .quantity(qty)
            .purchasePrice(purchase)
            .unitSellingPrice(sell)
            .lineCost(lineCost)
            .vatPercent(vat)
            .markedProduct(marked)
            .storageLocation(storage)
            .unitCost(unitCost)
            .build();
        return lineRepository.save(line);
    }

    public EdgeWhLine save(EdgeWhLine line) {
        return lineRepository.save(line);
    }

    private static String nextNumber(String prefix) {
        String ts = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(ZoneOffset.UTC).format(Instant.now());
        int r = ThreadLocalRandom.current().nextInt(1000, 9999);
        return prefix + "-" + ts + "-" + r;
    }
}
