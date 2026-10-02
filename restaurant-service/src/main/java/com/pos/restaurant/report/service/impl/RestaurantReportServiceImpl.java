package com.pos.restaurant.report.service.impl;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.report.dto.DishSalesReportResponse;
import com.pos.restaurant.report.dto.DishSalesReportRow;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.SalesSummaryResponse;
import com.pos.restaurant.report.support.DishSalesExcelWriter;
import com.pos.restaurant.report.support.SalesReportLoader;
import com.pos.restaurant.report.support.SalesTimeBuckets;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ReceiptJournalResponse;
import com.pos.restaurant.report.dto.ReceiptJournalRow;
import com.pos.restaurant.report.dto.ReceiptJournalTotals;
import com.pos.restaurant.report.service.RestaurantReportService;
import com.pos.restaurant.report.support.ReceiptJournalCriteria;
import com.pos.restaurant.report.support.ReceiptJournalExcelWriter;
import com.pos.restaurant.report.support.ReceiptJournalLoader;
import com.pos.restaurant.report.support.ReceiptJournalRowMapper;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RestaurantReportServiceImpl implements RestaurantReportService {

    static final int MAX_PAGE_SIZE = 200;
    static final int MAX_EXPORT_ROWS = 50_000;

    private final FloorTenantSupport tenantSupport;
    private final ReceiptJournalLoader loader;
    private final ReceiptJournalExcelWriter excelWriter;
    private final SalesReportLoader salesLoader;
    private final DishSalesExcelWriter dishExcelWriter;

    @Override
    @Transactional(readOnly = true)
    public ReceiptJournalResponse receipts(Integer storeId, ReceiptJournalFilter filter, int page, int size) {
        ReceiptJournalCriteria criteria = ReceiptJournalCriteria.of(tenantSupport.requireCompanyId(), storeId, filter);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        long total = loader.count(criteria);
        List<ReceiptJournalRow> rows = total == 0
            ? List.of()
            : toRows(loader.page(criteria, safePage * safeSize, safeSize));
        ReceiptJournalTotals totals = loader.totals(criteria);
        return new ReceiptJournalResponse(rows, safePage, safeSize, total, totals);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportReceipts(Integer storeId, ReceiptExportRequest request) {
        ReceiptJournalFilter filter = request.filter();
        ReceiptJournalCriteria criteria = ReceiptJournalCriteria.of(tenantSupport.requireCompanyId(), storeId, filter);
        long total = loader.count(criteria);
        if (total > MAX_EXPORT_ROWS) {
            throw new ValidationException(
                "Слишком много чеков для выгрузки (" + total + "). Сузьте период или фильтры"
            );
        }
        List<ReceiptJournalRow> rows = total == 0 ? List.of() : toRows(loader.page(criteria, 0, MAX_EXPORT_ROWS));
        ReceiptJournalTotals totals = loader.totals(criteria);
        LogUtil.info(RestaurantReportServiceImpl.class, "Receipt journal export storeId={} rows={}", storeId, rows.size());
        return excelWriter.write(
            rows,
            totals,
            filter.from(),
            filter.to(),
            request.userNames(),
            request.labels(),
            zone(request.timeZone())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SalesSummaryResponse salesSummary(Integer storeId, ReceiptJournalFilter filter, String timeZone) {
        ReceiptJournalCriteria criteria = ReceiptJournalCriteria.of(tenantSupport.requireCompanyId(), storeId, filter);
        ZoneId zone = zone(timeZone);
        List<SalesTimeBuckets.Payment> payments = salesLoader.payments(criteria);
        return new SalesSummaryResponse(
            loader.totals(criteria),
            salesLoader.byMethod(criteria),
            salesLoader.byCardType(criteria),
            salesLoader.byChannel(criteria),
            salesLoader.byHall(criteria),
            SalesTimeBuckets.byHour(payments, zone),
            SalesTimeBuckets.byDay(payments, zone)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DishSalesReportResponse dishSales(Integer storeId, ReceiptJournalFilter filter) {
        ReceiptJournalCriteria criteria = ReceiptJournalCriteria.of(tenantSupport.requireCompanyId(), storeId, filter);
        List<DishSalesReportRow> rows = salesLoader.dishes(criteria);
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

    @Override
    @Transactional(readOnly = true)
    public byte[] exportDishSales(Integer storeId, ReceiptExportRequest request) {
        DishSalesReportResponse report = dishSales(storeId, request.filter());
        return dishExcelWriter.write(
            report,
            request.filter().from(),
            request.filter().to(),
            request.labels(),
            zone(request.timeZone())
        );
    }

    private List<ReceiptJournalRow> toRows(List<FloorOrderPayment> payments) {
        List<UUID> ids = payments.stream().map(p -> p.getOrder().getId()).toList();
        Map<UUID, BigDecimal> returned = loader.returnedAmounts(ids);
        return payments.stream()
            .map(p -> ReceiptJournalRowMapper.toRow(p, returned.get(p.getOrder().getId())))
            .toList();
    }

    static ZoneId zone(String timeZone) {
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
