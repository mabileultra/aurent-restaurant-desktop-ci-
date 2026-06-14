package com.pos.finance.service;

import com.pos.finance.dto.integration.ZReportIncomeRequest;

public interface ZReportIntegrationService {

    void recordZReportIncome(ZReportIncomeRequest request);
}
