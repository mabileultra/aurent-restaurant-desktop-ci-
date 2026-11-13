package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.dto.DrugRegistryParsedRow;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import com.pos.pharmacy.support.PharmacyParallelTasks;
import com.pos.pharmacy.warehouse.support.PharmacyMassExecutor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

/** Параллельная запись строк реестра короткими батчами. */
@Component
@RequiredArgsConstructor
public class DrugRegistryEntryBatchWriter {

    private static final int BATCH = 400;

    private final DrugRegistryEntryPersister persister;
    private final PharmacyMassExecutor massExecutor;

    public void saveAll(UUID importId, List<DrugRegistryParsedRow> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }
        List<List<DrugRegistryEntry>> chunks = chunks(importId, rows);
        if (chunks.isEmpty()) {
            return;
        }
        List<Supplier<Void>> tasks = new ArrayList<>(chunks.size());
        for (List<DrugRegistryEntry> chunk : chunks) {
            tasks.add(() -> {
                persister.saveBatch(chunk);
                return null;
            });
        }
        PharmacyParallelTasks.supplyAll(tasks, massExecutor.executor());
    }

    private static List<List<DrugRegistryEntry>> chunks(UUID importId, List<DrugRegistryParsedRow> rows) {
        List<List<DrugRegistryEntry>> out = new ArrayList<>();
        List<DrugRegistryEntry> batch = new ArrayList<>(BATCH);
        for (DrugRegistryParsedRow row : rows) {
            String name = clip(row.tradeName(), 500);
            if (name == null) {
                continue;
            }
            batch.add(DrugRegistryEntry.builder()
                .id(UUID.randomUUID())
                .importId(importId)
                .tradeName(name)
                .nameKey(clip(DrugRegistryNameKey.of(name), 500))
                .registrationNumber(clip(row.registrationNumber(), 128))
                .inn(clip(row.inn(), 500))
                .dosageForm(clip(row.dosageForm(), 255))
                .manufacturer(clip(row.manufacturer(), 500))
                .country(clip(row.country(), 255))
                .atcCode(clip(row.atcCode(), 32))
                .prescriptionRequired(row.prescriptionRequired())
                .build());
            if (batch.size() >= BATCH) {
                out.add(batch);
                batch = new ArrayList<>(BATCH);
            }
        }
        if (!batch.isEmpty()) {
            out.add(batch);
        }
        return out;
    }

    private static String clip(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }
}
