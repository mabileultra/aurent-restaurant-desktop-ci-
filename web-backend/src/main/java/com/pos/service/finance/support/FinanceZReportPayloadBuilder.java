package com.pos.service.finance.support;

import com.pos.entity.CashierShift;
import com.pos.entity.Store;
import com.pos.entity.ZReport;
import com.pos.util.LogUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class FinanceZReportPayloadBuilder {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private FinanceZReportPayloadBuilder() {
    }

    public static Map<String, Object> build(ZReport zReport, CashierShift shift) {
        Store store = zReport.getStore();
        if (store == null || store.getCompany() == null) {
            LogUtil.warn(
                FinanceZReportPayloadBuilder.class,
                "Finance Z-report sync skipped: missing store/company zReport={}",
                zReport.getId()
            );
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", store.getCompany().getId());
        payload.put("storeId", store.getId());
        payload.put("zReportId", zReport.getId());
        payload.put("zNumber", zReport.getZNumber());
        if (shift != null) {
            payload.put("shiftId", shift.getId());
            if (shift.getCashier() != null) {
                payload.put("createdBy", shift.getCashier().getId());
            }
        }
        payload.put("cashAmount", nullSafe(zReport.getCashTotal()));
        payload.put("cardAmount", nullSafe(zReport.getCardTotal()));
        payload.put("cashlessAmount", nullSafe(zReport.getCashlessTotal()));
        payload.put("salesCount", zReport.getSalesCount() != null ? zReport.getSalesCount() : 0);
        payload.put("transactionDate", LocalDate.ofInstant(zReport.getClosedAt(), ZONE));
        return payload;
    }

    private static BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
