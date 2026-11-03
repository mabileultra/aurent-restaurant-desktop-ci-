package com.pos.pharmacy.taxanalytics.controller;

import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsDayMoneyDto;
import com.pos.pharmacy.taxanalytics.dto.TaxAnalyticsVerticalSnapshotDto;
import com.pos.pharmacy.taxanalytics.service.TaxAnalyticsVerticalService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@Hidden
@RestController
@RequestMapping("/internal/pharmacy/tax-analytics")
@RequiredArgsConstructor
public class InternalTaxAnalyticsController {

    private final TaxAnalyticsVerticalService service;

    @GetMapping("/snapshot")
    public TaxAnalyticsVerticalSnapshotDto snapshot(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekFrom,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekTo,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate prevWeekFrom,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate prevWeekTo
    ) {
        return service.snapshot(from, to, weekFrom, weekTo, prevWeekFrom, prevWeekTo);
    }

    @GetMapping("/companies/{companyId}/daily")
    public List<TaxAnalyticsDayMoneyDto> daily(
        @PathVariable int companyId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.daily(companyId, from, to);
    }
}
