package com.pos.integrations.finance.service;

import com.pos.entity.CashierShift;
import com.pos.entity.ZReport;

public interface FinanceZReportIntegrationService {

    void onZReportCreated(ZReport zReport, CashierShift shift);
}
