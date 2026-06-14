package com.pos.finance.dto.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ZReportIncomeRequest(
    @NotNull Integer companyId,
    @NotNull Integer storeId,
    @NotNull Long zReportId,
    @NotNull Integer zNumber,
    UUID shiftId,
    @NotNull @DecimalMin("0") BigDecimal cashAmount,
    @NotNull @DecimalMin("0") BigDecimal cardAmount,
    @NotNull @DecimalMin("0") BigDecimal cashlessAmount,
    @NotNull Integer salesCount,
    LocalDate transactionDate,
    UUID createdBy
) {
}
