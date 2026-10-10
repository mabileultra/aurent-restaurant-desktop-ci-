package com.pos.platform.service;

import com.pos.platform.domain.BillingPaymentMethod;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.BillingCollectionsOverviewResponse;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Экран супер-админа «Платежи и должники»: KPI и строки компаний с вычисленным состоянием оплаты. */
public interface BillingCollectionsService {

    BillingCollectionsOverviewResponse overview();

    List<CompanyPaymentRowResponse> list(Filter filter);

    record Filter(
        BillingPaymentState state,
        boolean newOnly,
        UUID planId,
        BillingPaymentMethod method,
        String search,
        DateField dateField,
        LocalDate from,
        LocalDate to,
        Set<Integer> companyIds,
        String regionCode,
        String districtCode
    ) {
        public static Filter all() {
            return new Filter(null, false, null, null, null, null, null, null, null, null, null);
        }
    }

    enum DateField {
        NEXT_CHARGE,
        LAST_PAYMENT,
        CREATED
    }
}
