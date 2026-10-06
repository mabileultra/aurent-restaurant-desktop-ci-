package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsFiscalResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsPaymentsResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsStoresResponse;
import com.pos.reporting.export.PlatformAnalyticsExportTemplate;
import com.pos.reporting.export.ReportExcelWriter;
import com.pos.reporting.service.PlatformAnalyticsExportService;
import com.pos.reporting.service.PlatformAnalyticsFiscalService;
import com.pos.reporting.service.PlatformAnalyticsOverviewService;
import com.pos.reporting.service.PlatformAnalyticsPaymentsService;
import com.pos.reporting.service.PlatformAnalyticsProductsService;
import com.pos.reporting.service.PlatformAnalyticsSalesService;
import com.pos.reporting.service.PlatformAnalyticsStoresService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformAnalyticsExportServiceImpl implements PlatformAnalyticsExportService {

    private final PlatformAnalyticsOverviewService overviewService;
    private final PlatformAnalyticsStoresService storesService;
    private final PlatformAnalyticsProductsService productsService;
    private final PlatformAnalyticsSalesService salesService;
    private final PlatformAnalyticsPaymentsService paymentsService;
    private final PlatformAnalyticsFiscalService fiscalService;
    private final ReportExcelWriter reportExcelWriter;

    @Override
    public byte[] export(String view, String period, LocalDate from, LocalDate to) {
        String key = view == null || view.isBlank() ? "overview" : view.trim().toLowerCase(Locale.ROOT);
        return switch (key) {
            case "stores" -> exportStores(period, from, to);
            case "products" -> exportProducts(period, from, to);
            case "sales" -> exportSales(period, from, to);
            case "payments" -> exportPayments(period, from, to);
            case "fiscal" -> exportFiscal(period, from, to);
            default -> exportOverview(period, from, to);
        };
    }

    private byte[] exportOverview(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsOverviewResponse data = overviewService.overview(period, from, to);
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(kpi("turnover", data.kpi().turnover().value(), data.kpi().turnover().deltaPct()));
        rows.add(kpi("profit", data.kpi().profit().value(), data.kpi().profit().deltaPct()));
        rows.add(kpi("salesQty", data.kpi().salesQty().value(), data.kpi().salesQty().deltaPct()));
        rows.add(kpi("receipts", data.kpi().receipts().value(), data.kpi().receipts().deltaPct()));
        rows.add(kpi("avgCheck", data.kpi().avgCheck().value(), data.kpi().avgCheck().deltaPct()));
        rows.add(kpi("returns", data.kpi().returns().value(), data.kpi().returns().deltaPct()));
        rows.add(kpi("activeStores", data.kpi().activeStores().value(), data.kpi().activeStores().deltaPct()));
        return reportExcelWriter.write(PlatformAnalyticsExportTemplate.OVERVIEW_KPI, rows);
    }

    private byte[] exportStores(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsStoresResponse data = storesService.stores(period, from, to);
        List<Map<String, Object>> rows = data.stores().stream()
            .map(s -> mapOf(
                "name", s.name(),
                "turnover", s.turnover(),
                "profit", s.profit(),
                "receipts", s.receipts(),
                "avgCheck", s.avgCheck(),
                "growthPct", s.growthPct()
            ))
            .toList();
        return reportExcelWriter.write(PlatformAnalyticsExportTemplate.STORES, rows);
    }

    private byte[] exportProducts(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsProductsResponse data = productsService.products(period, from, to);
        List<Map<String, Object>> rows = data.products().stream()
            .map(p -> mapOf(
                "name", p.name(),
                "qty", p.qty(),
                "revenue", p.revenue(),
                "cost", p.cost(),
                "profit", p.profit(),
                "marginPct", p.marginPct(),
                "growthPct", p.growthPct()
            ))
            .toList();
        return reportExcelWriter.write(PlatformAnalyticsExportTemplate.PRODUCTS, rows);
    }

    private byte[] exportSales(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsSalesResponse data = salesService.sales(period, from, to);
        List<Map<String, Object>> rows = data.daily().stream()
            .map(d -> mapOf(
                "date", d.date(),
                "turnover", d.turnover(),
                "profit", d.profit(),
                "receipts", d.receipts(),
                "avgCheck", d.avgCheck()
            ))
            .toList();
        return reportExcelWriter.write(PlatformAnalyticsExportTemplate.SALES_DAILY, rows);
    }

    private byte[] exportPayments(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPaymentsResponse data = paymentsService.payments(period, from, to);
        List<Map<String, Object>> rows = data.methods().stream()
            .map(m -> mapOf(
                "id", m.id(),
                "amount", m.amount(),
                "receipts", m.receipts(),
                "sharePct", m.sharePct()
            ))
            .toList();
        return reportExcelWriter.write(PlatformAnalyticsExportTemplate.PAYMENTS, rows);
    }

    private byte[] exportFiscal(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsFiscalResponse data = fiscalService.fiscal(period, from, to);
        List<Map<String, Object>> rows = data.byStore().stream()
            .map(s -> mapOf(
                "name", s.name(),
                "turnover", s.turnover(),
                "receipts", s.receipts(),
                "returnsAmount", s.returnsAmount(),
                "cancelledReceipts", s.cancelledReceipts()
            ))
            .toList();
        return reportExcelWriter.write(PlatformAnalyticsExportTemplate.FISCAL_STORES, rows);
    }

    private static Map<String, Object> kpi(String metric, BigDecimal value, BigDecimal deltaPct) {
        return mapOf("metric", metric, "value", value, "deltaPct", deltaPct);
    }

    private static Map<String, Object> mapOf(Object... kv) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            map.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return map;
    }
}
