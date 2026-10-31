package com.pos.restaurant.report.support;

import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.report.dto.ReceiptExportRequest;
import com.pos.restaurant.report.dto.ReceiptJournalFilter;
import com.pos.restaurant.report.dto.ShiftCashReportResponse;
import com.pos.restaurant.report.dto.ShiftCashReportRow;
import com.pos.restaurant.shift.entity.RestaurantShift;
import com.pos.restaurant.shift.support.ShiftCashMath;
import com.pos.restaurant.shift.support.ShiftCashOpTotalsLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ShiftCashReportHandler extends AbstractStoreReportHandler {

    private final ShiftCashReportLoader shiftCashLoader;
    private final ShiftCashOpTotalsLoader cashOpTotalsLoader;
    private final ShiftCashExcelWriter excelWriter;

    public ShiftCashReportHandler(
        FloorTenantSupport tenantSupport,
        ShiftCashReportLoader shiftCashLoader,
        ShiftCashOpTotalsLoader cashOpTotalsLoader,
        ShiftCashExcelWriter excelWriter
    ) {
        super(tenantSupport);
        this.shiftCashLoader = shiftCashLoader;
        this.cashOpTotalsLoader = cashOpTotalsLoader;
        this.excelWriter = excelWriter;
    }

    @Transactional(readOnly = true)
    public ShiftCashReportResponse shiftCash(Integer storeId, ReceiptJournalFilter filter) {
        if (filter == null) {
            throw new ValidationException("Укажите период отчёта");
        }
        ReportPeriod.assertValid(filter.from(), filter.to());
        List<RestaurantShift> shifts = shiftCashLoader.shifts(
            requireCompanyId(), storeId, filter.from(), filter.to()
        );
        Map<UUID, ShiftCashMath.Drawer> drawers = cashOpTotalsLoader.totals(
            shifts.stream().map(RestaurantShift::getId).toList()
        );
        List<ShiftCashReportRow> rows = shifts.stream()
            .map(shift -> ShiftCashReportAssembler.toRow(
                shift, drawers.getOrDefault(shift.getId(), ShiftCashMath.Drawer.zero())
            ))
            .toList();
        return new ShiftCashReportResponse(rows, ShiftCashReportAssembler.totals(rows));
    }

    @Transactional(readOnly = true)
    public byte[] export(Integer storeId, ReceiptExportRequest request) {
        ShiftCashReportResponse report = shiftCash(storeId, request.filter());
        return excelWriter.write(
            report.rows(),
            report.totals(),
            request.filter().from(),
            request.filter().to(),
            request.userNames(),
            request.labels(),
            resolveZone(request.timeZone())
        );
    }
}
