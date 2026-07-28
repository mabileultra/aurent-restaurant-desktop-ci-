package com.pos.integrations.finance.service;

import com.pos.sales.entity.CashierShift;
import com.pos.sales.entity.ZReport;

public interface FinanceZReportIntegrationService {

    void onZReportCreated(ZReport zReport, CashierShift shift);
}
