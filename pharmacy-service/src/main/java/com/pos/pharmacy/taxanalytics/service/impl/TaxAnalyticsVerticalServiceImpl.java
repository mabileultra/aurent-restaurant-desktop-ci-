package com.pos.pharmacy.taxanalytics.service.impl;

import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsCompanyMoneyDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsDayMoneyDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsVerticalSnapshotDto;
import com.pos.pharmacy.taxanalytics.repository.TaxAnalyticsVerticalQueryRepository;
import com.pos.pharmacy.taxanalytics.service.TaxAnalyticsVerticalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxAnalyticsVerticalServiceImpl implements TaxAnalyticsVerticalService {

    private final TaxAnalyticsVerticalQueryRepository repository;

    @Override
    public TaxAnalyticsVerticalSnapshotDto snapshot(
        LocalDate from,
        LocalDate to,
        LocalDate weekFrom,
        LocalDate weekTo,
        LocalDate prevWeekFrom,
        LocalDate prevWeekTo
    ) {
        List<TaxAnalyticsCompanyMoneyDto> companies = new ArrayList<>();
        BigDecimal fiscalTotal = BigDecimal.ZERO;
        BigDecimal nonFiscalTotal = BigDecimal.ZERO;
        for (Map<String, Object> row : repository.companyTurnover(
            from, to.plusDays(1), weekFrom, weekTo.plusDays(1), prevWeekFrom, prevWeekTo.plusDays(1)
        )) {
            BigDecimal fiscal = decimal(row.get("fiscal_turnover"));
            BigDecimal nonFiscal = decimal(row.get("non_fiscal_turnover"));
            fiscalTotal = fiscalTotal.add(fiscal);
            nonFiscalTotal = nonFiscalTotal.add(nonFiscal);
            companies.add(new TaxAnalyticsCompanyMoneyDto(
                ((Number) row.get("company_id")).intValue(),
                fiscal,
                nonFiscal,
                decimal(row.get("week_turnover")),
                decimal(row.get("prev_week_turnover"))
            ));
        }
        return new TaxAnalyticsVerticalSnapshotDto(
            companies,
            repository.connectedCompanyIds(),
            fiscalTotal,
            nonFiscalTotal
        );
    }

    @Override
    public List<TaxAnalyticsDayMoneyDto> daily(int companyId, LocalDate from, LocalDate to) {
        List<TaxAnalyticsDayMoneyDto> days = new ArrayList<>();
        for (Map<String, Object> row : repository.dailyTurnover(companyId, from, to.plusDays(1))) {
            days.add(new TaxAnalyticsDayMoneyDto(
                String.valueOf(row.get("sale_date")).substring(0, 10),
                decimal(row.get("fiscal_turnover")),
                decimal(row.get("non_fiscal_turnover"))
            ));
        }
        return days;
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
    }
}
