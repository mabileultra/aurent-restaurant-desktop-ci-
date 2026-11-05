package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.pricing.registry.domain.PriceChangeJournalStatus;
import com.pos.pharmacy.pricing.registry.domain.PriceRegistryMatchBy;
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
import java.util.Set;
import java.util.UUID;

/** Сохраняет строки реестра и строит журнал «было / предел / станет». */
@Component
@RequiredArgsConstructor
public class PriceRegistryReconciler {

    private final PriceRegistryRowRepository rowRepository;
    private final PriceChangeJournalRepository journalRepository;
    private final PriceRegistryProductMatcher matcher;

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
        List<PriceChangeJournalEntry> journal = new ArrayList<>();
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
                journal.add(baseEntry(snapshotId, companyId, regRow, p, now)
                    .productId(null)
                    .productName(p.tradeName())
                    .matchedBy(PriceRegistryMatchBy.NONE.name())
                    .oldSellingPrice(null)
                    .newSellingPrice(null)
                    .status(PriceChangeJournalStatus.UNMATCHED.name())
                    .build());
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
            boolean over = our.compareTo(limit) > 0;
            if (over) {
                pending++;
                journal.add(baseEntry(snapshotId, companyId, regRow, p, now)
                    .productId(product.getId())
                    .productName(product.getName())
                    .matchedBy(match.matchedBy().name())
                    .oldSellingPrice(our)
                    .newSellingPrice(limit)
                    .status(PriceChangeJournalStatus.PENDING.name())
                    .build());
            } else {
                skipped++;
                journal.add(baseEntry(snapshotId, companyId, regRow, p, now)
                    .productId(product.getId())
                    .productName(product.getName())
                    .matchedBy(match.matchedBy().name())
                    .oldSellingPrice(our)
                    .newSellingPrice(our)
                    .status(PriceChangeJournalStatus.SKIPPED_OK.name())
                    .build());
            }
        }
        journalRepository.saveAll(journal);
        return new Counts(pending, skipped, unmatched);
    }

    private static PriceChangeJournalEntry.PriceChangeJournalEntryBuilder baseEntry(
        UUID snapshotId,
        Integer companyId,
        PriceRegistryRow regRow,
        RegistryParsedRow p,
        Instant now
    ) {
        return PriceChangeJournalEntry.builder()
            .id(UUID.randomUUID())
            .companyId(companyId)
            .snapshotId(snapshotId)
            .registryRowId(regRow.getId())
            .barcode(p.barcode())
            .pharmId(p.pharmId())
            .limitPrice(p.limitPriceVat())
            .createdAt(now);
    }
}
