package com.pos.pharmacy.taxanalytics.service;

import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsDayMoneyDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsVerticalSnapshotDto;

import java.time.LocalDate;
import java.util.List;

public interface TaxAnalyticsVerticalService {

    TaxAnalyticsVerticalSnapshotDto snapshot(
        LocalDate from,
        LocalDate to,
        LocalDate weekFrom,
        LocalDate weekTo,
        LocalDate prevWeekFrom,
        LocalDate prevWeekTo
    );

    List<TaxAnalyticsDayMoneyDto> daily(int companyId, LocalDate from, LocalDate to);
}
