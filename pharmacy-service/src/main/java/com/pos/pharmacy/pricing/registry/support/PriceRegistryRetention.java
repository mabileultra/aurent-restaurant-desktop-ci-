package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.pricing.registry.domain.PriceChangeJournalStatus;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistrySnapshot;
import com.pos.pharmacy.pricing.registry.repository.PriceChangeJournalRepository;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistrySnapshotRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Хранит один актуальный снимок реестра и только журнал изменений (PENDING/APPLIED).
 * Старые снимки и SKIPPED/UNMATCHED из БД убирает.
 */
@Component
@RequiredArgsConstructor
public class PriceRegistryRetention {

    private static final List<String> JUNK_STATUSES = List.of(
        PriceChangeJournalStatus.SKIPPED_OK.name(),
        PriceChangeJournalStatus.UNMATCHED.name()
    );

    private final PriceRegistrySnapshotRepository snapshots;
    private final PriceChangeJournalRepository journal;

    @Transactional
    public void keepOnlyLatestSnapshot(UUID keepId) {
        if (keepId == null) {
            return;
        }
        int junk = journal.deleteByStatusIn(JUNK_STATUSES);
        List<PriceRegistrySnapshot> all = snapshots.findAll();
        int removed = 0;
        for (PriceRegistrySnapshot snap : all) {
            if (!keepId.equals(snap.getId())) {
                snapshots.delete(snap);
                removed++;
            }
        }
        if (junk > 0 || removed > 0) {
            LogUtil.info(
                PriceRegistryRetention.class,
                "Price registry retention: droppedSnapshots={} junkJournal={}",
                removed,
                junk
            );
        }
    }
}
