package com.pos.restaurant.report.support;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.DishSalesReportRow;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.shared.api.PageLimits;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DishSalesReportHandler extends AbstractStoreReportHandler {

    private final SalesReportLoader salesLoader;
    private final DishSalesExcelWriter excelWriter;

    public DishSalesReportHandler(
        FloorTenantSupport tenantSupport,
        SalesReportLoader salesLoader,
        DishSalesExcelWriter excelWriter
    ) {
        super(tenantSupport);
        this.salesLoader = salesLoader;
        this.excelWriter = excelWriter;
    }

    @Transactional(readOnly = true)
    public DishSalesReportResponse dishes(Integer storeId, ReceiptJournalFilter filter) {
        ReceiptJournalCriteria criteria = journalCriteria(storeId, filter);
        List<DishSalesReportRow> rows = salesLoader.dishes(criteria, PageLimits.MAX_SIZE_REPORT);
        BigDecimal qty = BigDecimal.ZERO;
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal refund = BigDecimal.ZERO;
        BigDecimal net = BigDecimal.ZERO;
        for (DishSalesReportRow row : rows) {
            qty = qty.add(row.netQuantity());
            gross = gross.add(row.grossAmount());
            refund = refund.add(row.refundAmount());
            net = net.add(row.netAmount());
        }
        return new DishSalesReportResponse(rows, qty, gross, refund, net);
    }

    @Transactional(readOnly = true)
    public byte[] export(Integer storeId, ReceiptExportRequest request) {
        DishSalesReportResponse report = dishes(storeId, request.filter());
        return excelWriter.write(
            report,
            request.filter().from(),
            request.filter().to(),
            request.labels(),
            resolveZone(request.timeZone())
        );
    }
}
