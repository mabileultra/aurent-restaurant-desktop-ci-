package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryImport;
import com.pos.pharmacy.catalog.registry.repository.DrugRegistryEntryRepository;
import com.pos.pharmacy.catalog.registry.repository.DrugRegistryImportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Короткие TX на мета-импорт и батч строк (для параллельной записи). */
@Component
@RequiredArgsConstructor
public class DrugRegistryEntryPersister {

    private final DrugRegistryImportRepository imports;
    private final DrugRegistryEntryRepository entries;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveImport(
        UUID importId,
        String source,
        String fileName,
        String checksum,
        int rowCount
    ) {
        imports.save(DrugRegistryImport.builder()
            .id(importId)
            .source(source)
            .fileName(fileName)
            .checksum(checksum)
            .rowCount(rowCount)
            .status(DrugRegistryImport.STATUS_READY)
            .createdAt(Instant.now())
            .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveBatch(List<DrugRegistryEntry> batch) {
        if (batch == null || batch.isEmpty()) {
            return;
        }
        entries.saveAll(batch);
    }
}
