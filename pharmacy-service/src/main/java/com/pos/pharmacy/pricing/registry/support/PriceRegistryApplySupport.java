package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.pricing.registry.domain.PriceChangeJournalStatus;
import com.pos.pharmacy.pricing.registry.entity.PriceChangeJournalEntry;
import com.pos.pharmacy.pricing.registry.repository.PriceChangeJournalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Применяет PENDING: снижает selling_price до предела и помечает APPLIED. */
@Component
@RequiredArgsConstructor
public class PriceRegistryApplySupport {

    private final PriceChangeJournalRepository journalRepository;
    private final ProductRepository productRepository;

    @Transactional
    public int applyPending(Integer companyId, UUID snapshotId, String appliedBy) {
        List<PriceChangeJournalEntry> pending = snapshotId != null
            ? journalRepository.findByCompanyIdAndSnapshotIdAndStatus(
                companyId, snapshotId, PriceChangeJournalStatus.PENDING.name())
            : journalRepository.findByCompanyIdAndStatus(
                companyId, PriceChangeJournalStatus.PENDING.name());
        Instant now = Instant.now();
        int applied = 0;
        for (PriceChangeJournalEntry entry : pending) {
            if (entry.getProductId() == null || entry.getLimitPrice() == null) {
                continue;
            }
            Product product = productRepository.findById(entry.getProductId()).orElse(null);
            if (product == null || !companyId.equals(product.getCompanyId())) {
                continue;
            }
            BigDecimal limit = entry.getLimitPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal old = product.getSellingPrice();
            product.setSellingPrice(limit);
            productRepository.save(product);
            entry.setOldSellingPrice(old);
            entry.setNewSellingPrice(limit);
            entry.setStatus(PriceChangeJournalStatus.APPLIED.name());
            entry.setAppliedBy(appliedBy);
            entry.setAppliedAt(now);
            applied++;
        }
        journalRepository.saveAll(pending);
        return applied;
    }
}
