package com.pos.restaurant.report.support;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Shared scaffolding for store-scoped restaurant reports.
 * Dependencies stay composed; subclasses only implement load/export.
 */
public abstract class AbstractStoreReportHandler {

    private final FloorTenantSupport tenantSupport;

    protected AbstractStoreReportHandler(FloorTenantSupport tenantSupport) {
        this.tenantSupport = tenantSupport;
    }

    protected final Integer requireCompanyId() {
        return tenantSupport.requireCompanyId();
    }

    protected final ReceiptJournalCriteria journalCriteria(Integer storeId, ReceiptJournalFilter filter) {
        return ReceiptJournalCriteria.of(requireCompanyId(), storeId, filter);
    }

    protected static ZoneId resolveZone(String timeZone) {
        if (timeZone == null || timeZone.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(timeZone.trim());
        } catch (DateTimeException e) {
            return ZoneOffset.UTC;
        }
    }
}
