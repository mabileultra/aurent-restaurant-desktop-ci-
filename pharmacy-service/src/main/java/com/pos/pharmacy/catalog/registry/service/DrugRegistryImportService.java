package com.pos.pharmacy.catalog.registry.service;

import com.pos.pharmacy.catalog.registry.dto.DrugRegistryLatestResponse;
import com.pos.pharmacy.catalog.registry.dto.DrugRegistryParsedRow;
import com.pos.pharmacy.catalog.registry.dto.DrugRegistrySyncResult;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryImport;
import com.pos.pharmacy.catalog.registry.repository.DrugRegistryEntryRepository;
import com.pos.pharmacy.catalog.registry.repository.DrugRegistryImportRepository;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryExcelParser;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryNameKey;
import com.pos.pharmacy.catalog.registry.support.DrugRegistrySourceFile;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyDrugRegistryErrors;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DrugRegistryImportService {

    private static final int BATCH = 400;

    private final DrugRegistrySourceFile sourceFile;
    private final DrugRegistryExcelParser parser;
    private final DrugRegistryImportRepository imports;
    private final DrugRegistryEntryRepository entries;
    private final DrugRegistryBackfillService backfill;

    @Transactional(readOnly = true)
    public DrugRegistryLatestResponse latest() {
        return imports.findFirstByStatusOrderByCreatedAtDesc(DrugRegistryImport.STATUS_READY)
            .map(row -> new DrugRegistryLatestResponse(
                row.getId(),
                row.getFileName(),
                row.getSource(),
                row.getRowCount(),
                row.getCreatedAt()
            ))
            .orElse(null);
    }

    @Transactional
    public DrugRegistrySyncResult sync() {
        if (!sourceFile.configured()) {
            LogUtil.info(DrugRegistryImportService.class, "Drug registry source is not configured");
            return new DrugRegistrySyncResult(null, 0, true, 0);
        }
        DrugRegistrySourceFile.Opened opened = sourceFile.open();
        if (opened == null) {
            return new DrugRegistrySyncResult(null, 0, true, 0);
        }
        try {
            return importOpened(opened);
        } finally {
            opened.close();
        }
    }

    @Transactional
    public DrugRegistrySyncResult upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
                "Файл пустой"
            );
        }
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "drug-registry.xlsx";
        Path temp = null;
        try {
            temp = Files.createTempFile("drug-registry-upload-", suffix(original));
            file.transferTo(temp);
            DrugRegistrySourceFile.Opened opened = sourceFile.openLocal(
                temp,
                Path.of(original).getFileName().toString(),
                "upload:" + original,
                true
            );
            try {
                return importOpened(opened);
            } finally {
                opened.close();
            }
        } catch (com.pos.pharmacy.exception.BusinessException ex) {
            throw ex;
        } catch (Exception e) {
            throw PharmacyErrors.of(
                PharmacyDrugRegistryErrors.PHARM_DRUG_REGISTRY_PARSE_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        } finally {
            if (temp != null) {
                try {
                    Files.deleteIfExists(temp);
                } catch (Exception ignored) {
                    // временный файл
                }
            }
        }
    }

    private DrugRegistrySyncResult importOpened(DrugRegistrySourceFile.Opened opened) {
        String checksum = sha256(opened.path());
        if (imports.existsByChecksumAndStatus(checksum, DrugRegistryImport.STATUS_READY)) {
            return new DrugRegistrySyncResult(null, 0, true, 0);
        }
        List<DrugRegistryParsedRow> rows = parser.parse(opened.path());
        UUID importId = UUID.randomUUID();
        imports.save(DrugRegistryImport.builder()
            .id(importId)
            .source(clip(opened.source(), 1000))
            .fileName(clip(opened.fileName(), 255))
            .checksum(checksum)
            .rowCount(rows.size())
            .status(DrugRegistryImport.STATUS_READY)
            .createdAt(Instant.now())
            .build());
        saveRows(importId, rows);
        int filled = backfill.fillExisting();
        LogUtil.info(
            DrugRegistryImportService.class,
            "Drug registry imported rows={} filledProducts={}",
            rows.size(),
            filled
        );
        return new DrugRegistrySyncResult(importId, rows.size(), false, filled);
    }

    private void saveRows(UUID importId, List<DrugRegistryParsedRow> rows) {
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
                entries.saveAll(batch);
                batch.clear();
            }
        }
        if (!batch.isEmpty()) {
            entries.saveAll(batch);
        }
    }

    private static String suffix(String name) {
        String lower = name == null ? "" : name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".zip")) {
            return ".zip";
        }
        return ".xlsx";
    }

    private static String sha256(Path path) {
        try (InputStream in = Files.newInputStream(path)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) >= 0) {
                digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (Exception e) {
            throw new IllegalStateException("checksum", e);
        }
    }

    private static String clip(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }
}
