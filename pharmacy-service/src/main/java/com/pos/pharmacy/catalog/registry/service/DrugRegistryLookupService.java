package com.pos.pharmacy.catalog.registry.service;

import com.pos.pharmacy.catalog.registry.dto.DrugRegistryHit;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryImport;
import com.pos.pharmacy.catalog.registry.repository.DrugRegistryEntryRepository;
import com.pos.pharmacy.catalog.registry.repository.DrugRegistryImportRepository;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryNameKey;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryUnanimous;
import com.pos.shared.api.FilterText;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DrugRegistryLookupService {

    private static final int SEARCH_LIMIT = 8;

    private final DrugRegistryImportRepository imports;
    private final DrugRegistryEntryRepository entries;

    @Transactional(readOnly = true)
    public List<DrugRegistryHit> search(String query) {
        String q = FilterText.normalizeSearch(query);
        UUID importId = latestId().orElse(null);
        if (q == null || importId == null) {
            return List.of();
        }
        return entries.search(importId, q, PageRequest.of(0, SEARCH_LIMIT)).stream()
            .map(DrugRegistryLookupService::hit)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<DrugRegistryEntry> unanimous(String tradeName) {
        String key = DrugRegistryNameKey.of(tradeName);
        UUID importId = latestId().orElse(null);
        if (key.isBlank() || importId == null) {
            return Optional.empty();
        }
        return DrugRegistryUnanimous.one(entries.findByImportIdAndNameKey(importId, key));
    }

    private Optional<UUID> latestId() {
        return imports.findFirstByStatusOrderByCreatedAtDesc(DrugRegistryImport.STATUS_READY)
            .map(DrugRegistryImport::getId);
    }

    static DrugRegistryHit hit(DrugRegistryEntry entry) {
        return new DrugRegistryHit(
            entry.getId(),
            entry.getTradeName(),
            entry.getRegistrationNumber(),
            entry.getManufacturer(),
            entry.getCountry(),
            entry.getDosageForm(),
            entry.getAtcCode(),
            entry.getPrescriptionRequired()
        );
    }
}
