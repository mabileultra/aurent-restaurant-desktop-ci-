package com.pos.pharmacy.pricing.registry.service;

import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyPriceRegistryErrors;
import com.pos.pharmacy.pricing.registry.dto.PriceChangeJournalResponse;
import com.pos.pharmacy.pricing.registry.dto.PriceRegistrySnapshotResponse;
import com.pos.pharmacy.pricing.registry.dto.PriceRegistrySyncResult;
import com.pos.pharmacy.pricing.registry.dto.RegistryParsedRow;
import com.pos.pharmacy.pricing.registry.entity.PriceChangeJournalEntry;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistryRow;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistrySnapshot;
import com.pos.pharmacy.pricing.registry.repository.PriceChangeJournalRepository;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistrySnapshotRepository;
import com.pos.pharmacy.pricing.registry.support.PriceLimitSaleValidator;
import com.pos.pharmacy.pricing.registry.support.PriceRegistryApplySupport;
import com.pos.pharmacy.pricing.registry.support.PriceRegistryExcelFetcher;
import com.pos.pharmacy.pricing.registry.support.PriceRegistryExcelParser;
import com.pos.pharmacy.pricing.registry.support.PriceRegistryReconciler;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyPriceRegistryService {

    private final TenantSupport tenant;
    private final ProductRepository productRepository;
    private final PriceRegistryExcelFetcher fetcher;
    private final PriceRegistryExcelParser parser;
    private final PriceRegistryReconciler reconciler;
    private final PriceRegistryApplySupport applySupport;
    private final PriceLimitSaleValidator saleValidator;
    private final PriceRegistrySnapshotRepository snapshotRepository;
    private final PriceChangeJournalRepository journalRepository;

    @Value("${app.pharmacy.price-registry.auto-apply:false}")
    private boolean autoApply;

    /** Ручной sync для текущей компании (или cron по всем). */
    public PriceRegistrySyncResult syncForCompany(Integer companyId) {
        PriceRegistryExcelFetcher.FetchedExcel fetched = null;
        try {
            fetched = fetcher.fetchLatest();
            List<RegistryParsedRow> parsed = parser.parse(fetched.path());
            return persistSnapshotAndReconcile(fetched, parsed, List.of(companyId));
        } finally {
            if (fetched != null) {
                try {
                    Files.deleteIfExists(fetched.path());
                } catch (Exception e) {
                    LogUtil.warn(PharmacyPriceRegistryService.class, "Temp file cleanup failed: {}", e.toString());
                }
            }
        }
    }

    /** Cron: один скачиваемый файл → журнал по всем company_id из каталога. */
    public PriceRegistrySyncResult syncAllCompanies() {
        List<Integer> companies = productRepository.findDistinctCompanyIds();
        if (companies.isEmpty()) {
            LogUtil.info(PharmacyPriceRegistryService.class, "Price registry cron: no companies");
            return new PriceRegistrySyncResult(null, 0, 0, 0, 0, 0, null);
        }
        PriceRegistryExcelFetcher.FetchedExcel fetched = null;
        try {
            fetched = fetcher.fetchLatest();
            List<RegistryParsedRow> parsed = parser.parse(fetched.path());
            return persistSnapshotAndReconcile(fetched, parsed, companies);
        } finally {
            if (fetched != null) {
                try {
                    Files.deleteIfExists(fetched.path());
                } catch (Exception e) {
                    LogUtil.warn(PharmacyPriceRegistryService.class, "Temp file cleanup failed: {}", e.toString());
                }
            }
        }
    }

    private PriceRegistrySyncResult persistSnapshotAndReconcile(
        PriceRegistryExcelFetcher.FetchedExcel fetched,
        List<RegistryParsedRow> parsed,
        List<Integer> companies
    ) {
        UUID snapshotId = UUID.randomUUID();
        PriceRegistrySnapshot snap = PriceRegistrySnapshot.builder()
            .id(snapshotId)
            .sourceUrl(fetched.sourceUrl())
            .fileName(fetched.fileName())
            .registryDate(LocalDate.now())
            .rowCount(parsed.size())
            .status("READY")
            .createdAt(Instant.now())
            .build();
        snapshotRepository.save(snap);

        List<PriceRegistryRow> stored = reconciler.persistRows(snapshotId, parsed);
        int pending = 0;
        int skipped = 0;
        int unmatched = 0;
        int applied = 0;
        for (Integer companyId : companies) {
            PriceRegistryReconciler.Counts counts = reconciler.buildJournal(
                snapshotId, companyId, parsed, stored
            );
            pending += counts.pending();
            skipped += counts.skippedOk();
            unmatched += counts.unmatched();
            if (autoApply && counts.pending() > 0) {
                applied += applySupport.applyPending(companyId, snapshotId, "SYSTEM");
            }
        }
        LogUtil.info(
            PharmacyPriceRegistryService.class,
            "Price registry snapshot {} rows={} pending={} skipped={} unmatched={} applied={}",
            snapshotId, parsed.size(), pending, skipped, unmatched, applied
        );
        return new PriceRegistrySyncResult(
            snapshotId,
            parsed.size(),
            pending,
            skipped,
            unmatched,
            applied,
            fetched.sourceUrl()
        );
    }

    @Transactional
    public int applyPending(UUID snapshotId) {
        Integer companyId = tenant.requireCompanyId();
        return applySupport.applyPending(companyId, snapshotId, "USER");
    }

    public boolean checkPriceBeforeSale(UUID productId, BigDecimal salePrice) {
        return saleValidator.checkPriceBeforeSale(productId, salePrice);
    }

    @Transactional(readOnly = true)
    public PageResponse<PriceChangeJournalResponse> journal(String status, Pageable pageable) {
        Integer companyId = tenant.requireCompanyId();
        Page<PriceChangeJournalEntry> page = status == null || status.isBlank()
            ? journalRepository.findByCompanyId(companyId, pageable)
            : journalRepository.findByCompanyIdAndStatus(companyId, status, pageable);
        return PageResponse.from(page.map(this::toJournalDto));
    }

    @Transactional(readOnly = true)
    public PriceRegistrySnapshotResponse latestSnapshot() {
        return snapshotRepository.findFirstByStatusOrderByCreatedAtDesc("READY")
            .map(this::toSnapDto)
            .orElseThrow(() -> PharmacyErrors.notFound(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_SNAPSHOT_MISSING
            ));
    }

    private PriceChangeJournalResponse toJournalDto(PriceChangeJournalEntry e) {
        return new PriceChangeJournalResponse(
            e.getId(),
            e.getSnapshotId(),
            e.getProductId(),
            e.getProductName(),
            e.getBarcode(),
            e.getPharmId(),
            e.getMatchedBy(),
            e.getOldSellingPrice(),
            e.getLimitPrice(),
            e.getNewSellingPrice(),
            e.getStatus(),
            e.getAppliedBy(),
            e.getAppliedAt(),
            e.getCreatedAt()
        );
    }

    private PriceRegistrySnapshotResponse toSnapDto(PriceRegistrySnapshot s) {
        return new PriceRegistrySnapshotResponse(
            s.getId(),
            s.getSourceUrl(),
            s.getFileName(),
            s.getRegistryDate(),
            s.getRowCount(),
            s.getStatus(),
            s.getCreatedAt()
        );
    }
}
