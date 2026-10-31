package com.pos.restaurant.report.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ReceiptJournalResponse;
import com.pos.restaurant.report.dto.ReceiptJournalRow;
import com.pos.restaurant.report.dto.ReceiptJournalTotals;
import com.pos.shared.api.PageLimits;
import com.pos.shared.api.PageResponse;
import com.pos.shared.log.LogUtil;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class ReceiptJournalReportHandler extends AbstractStoreReportHandler {

    static final int MAX_EXPORT_ROWS = 50_000;

    private final ReceiptJournalLoader loader;
    private final ReceiptJournalAssembler assembler;
    private final ReceiptJournalExcelWriter excelWriter;

    public ReceiptJournalReportHandler(
        FloorTenantSupport tenantSupport,
        ReceiptJournalLoader loader,
        ReceiptJournalAssembler assembler,
        ReceiptJournalExcelWriter excelWriter
    ) {
        super(tenantSupport);
        this.loader = loader;
        this.assembler = assembler;
        this.excelWriter = excelWriter;
    }

    @Transactional(readOnly = true)
    public ReceiptJournalResponse page(Integer storeId, ReceiptJournalFilter filter, int page, int size) {
        ReceiptJournalCriteria criteria = journalCriteria(storeId, filter);
        int safeSize = PageLimits.normalizeReportSize(size);
        int safePage = PageLimits.normalizePage(page);
        long total = loader.count(criteria);
        List<ReceiptJournalRow> rows = total == 0
            ? List.of()
            : assembler.toRows(loader.page(criteria, safePage * safeSize, safeSize));
        ReceiptJournalTotals totals = loader.totals(criteria);
        return ReceiptJournalResponse.of(PageResponse.of(rows, safePage, safeSize, total), totals);
    }

    @Transactional(readOnly = true)
    public byte[] export(Integer storeId, ReceiptExportRequest request) {
        ReceiptJournalFilter filter = request.filter();
        ReceiptJournalCriteria criteria = journalCriteria(storeId, filter);
        long total = loader.count(criteria);
        if (total > MAX_EXPORT_ROWS) {
            throw new ValidationException(
                "Слишком много чеков для выгрузки (" + total + "). Сузьте период или фильтры"
            );
        }
        List<ReceiptJournalRow> rows = total == 0
            ? List.of()
            : assembler.toRows(loader.page(criteria, 0, MAX_EXPORT_ROWS));
        ReceiptJournalTotals totals = loader.totals(criteria);
        LogUtil.info(ReceiptJournalReportHandler.class, "Receipt journal export storeId={} rows={}", storeId, rows.size());
        return excelWriter.write(
            rows,
            totals,
            filter.from(),
            filter.to(),
            request.userNames(),
            request.labels(),
            resolveZone(request.timeZone())
        );
    }
}
