package com.pos.restaurant.taxanalytics.service;

import com.pos.restaurant.taxanalytics.dto.TaxAnalyticsDayMoneyDto;
import com.pos.restaurant.taxanalytics.dto.TaxAnalyticsVerticalSnapshotDto;

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
