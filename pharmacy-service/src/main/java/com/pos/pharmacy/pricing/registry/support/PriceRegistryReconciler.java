package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.pricing.registry.domain.PriceChangeJournalStatus;
import com.pos.pharmacy.pricing.registry.dto.RegistryParsedRow;
import com.pos.pharmacy.pricing.registry.entity.PriceChangeJournalEntry;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistryRow;
import com.pos.pharmacy.pricing.registry.repository.PriceChangeJournalRepository;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistryRowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Сохраняет строки актуального снимка и в журнал — только превышения предела (PENDING).
 * SKIPPED/UNMATCHED в БД не пишем.
 */
@Component
@RequiredArgsConstructor
public class PriceRegistryReconciler {

    private final PriceRegistryRowRepository rowRepository;
    private final PriceChangeJournalRepository journalRepository;
    private final PriceRegistryProductMatcher matcher;
    private final ProductRepository productRepository;

    public record Counts(int pending, int skippedOk, int unmatched) {}

    @Transactional
    public List<PriceRegistryRow> persistRows(UUID snapshotId, List<RegistryParsedRow> parsed) {
        List<PriceRegistryRow> stored = new ArrayList<>(parsed.size());
        for (RegistryParsedRow p : parsed) {
            stored.add(PriceRegistryRow.builder()
                .id(UUID.randomUUID())
                .snapshotId(snapshotId)
                .pharmId(p.pharmId())
                .barcode(p.barcode())
                .tradeName(p.tradeName())
                .limitPriceVat(p.limitPriceVat())
                .build());
        }
        return rowRepository.saveAll(stored);
    }

    @Transactional
    public Counts buildJournal(
        UUID snapshotId,
        Integer companyId,
        List<RegistryParsedRow> parsed,
        List<PriceRegistryRow> stored
    ) {
        Instant now = Instant.now();
        List<PriceChangeJournalEntry> toSave = new ArrayList<>();
        Set<UUID> seenProducts = new HashSet<>();
        int pending = 0;
        int skipped = 0;
        int unmatched = 0;

        for (int i = 0; i < parsed.size(); i++) {
            RegistryParsedRow p = parsed.get(i);
            PriceRegistryRow regRow = stored.get(i);
            PriceRegistryProductMatcher.MatchResult match = matcher.match(companyId, p);
            if (match.product() == null) {
                unmatched++;
                continue;
            }
            Product product = match.product();
            if (!seenProducts.add(product.getId())) {
                continue;
            }
            BigDecimal our = product.getSellingPrice() != null
                ? product.getSellingPrice()
                : BigDecimal.ZERO;
            BigDecimal limit = p.limitPriceVat();
            if (limit != null) {
                product.setReferencePrice(limit);
                productRepository.save(product);
            }
            boolean over = limit != null && our.compareTo(limit) > 0;
            if (!over) {
                skipped++;
                journalRepository.deleteByCompanyIdAndProductIdAndStatus(
                    companyId,
                    product.getId(),
                    PriceChangeJournalStatus.PENDING.name()
                );
                continue;
            }
            pending++;
            Optional<PriceChangeJournalEntry> existing = journalRepository
                .findFirstByCompanyIdAndProductIdAndStatus(
                    companyId,
                    product.getId(),
                    PriceChangeJournalStatus.PENDING.name()
                );
            if (existing.isPresent()) {
                PriceChangeJournalEntry entry = existing.get();
                entry.setSnapshotId(snapshotId);
                entry.setRegistryRowId(regRow.getId());
                entry.setBarcode(p.barcode());
                entry.setPharmId(p.pharmId());
                entry.setMatchedBy(match.matchedBy().name());
                entry.setProductName(product.getName());
                entry.setOldSellingPrice(our);
                entry.setLimitPrice(limit);
                entry.setNewSellingPrice(limit);
                toSave.add(entry);
                continue;
            }
            toSave.add(PriceChangeJournalEntry.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .snapshotId(snapshotId)
                .registryRowId(regRow.getId())
                .productId(product.getId())
                .productName(product.getName())
                .barcode(p.barcode())
                .pharmId(p.pharmId())
                .matchedBy(match.matchedBy().name())
                .oldSellingPrice(our)
                .limitPrice(limit)
                .newSellingPrice(limit)
                .status(PriceChangeJournalStatus.PENDING.name())
                .createdAt(now)
                .build());
        }
        if (!toSave.isEmpty()) {
            journalRepository.saveAll(toSave);
        }
        return new Counts(pending, skipped, unmatched);
    }
}
