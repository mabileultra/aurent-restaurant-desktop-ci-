package com.pos.platform.service;

import com.pos.platform.dto.billing.BillingCalendarResponse;
import com.pos.platform.dto.billing.BillingReportsResponse;

import java.time.YearMonth;

public interface BillingReportsService {

    BillingReportsResponse reports(Period methodsPeriod);

    BillingCalendarResponse calendar(YearMonth month);

    enum Period {
        DAY,
        WEEK,
        MONTH,
        YEAR
    }
}
