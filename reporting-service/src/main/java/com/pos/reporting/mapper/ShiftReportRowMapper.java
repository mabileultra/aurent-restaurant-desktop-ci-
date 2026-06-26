package com.pos.reporting.mapper;

import com.pos.reporting.dto.shift.ShiftReportRowResponse;
import com.pos.reporting.entity.ShiftClosedFact;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ShiftReportRowMapper {

    public ShiftReportRowResponse toRow(ShiftClosedFact fact) {
        return new ShiftReportRowResponse(
            fact.getZReportId(),
            fact.getZNumber(),
            fact.getStoreId(),
            fact.getStoreName(),
            fact.getClosedAt(),
            fact.getTotalSales() != null ? fact.getTotalSales() : BigDecimal.ZERO,
            fact.getSalesCount(),
            fact.getEmployeeName()
        );
    }
}
