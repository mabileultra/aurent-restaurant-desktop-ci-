package com.pos.finance.service;

import com.pos.finance.dto.executive.ExecutivePeriod;
import com.pos.finance.dto.executive.ExecutiveSummaryDto;

public interface ExecutiveSummaryService {

    ExecutiveSummaryDto getSummary(ExecutivePeriod period, Integer storeId);
}
