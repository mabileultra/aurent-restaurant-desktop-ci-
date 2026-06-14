package com.pos.finance.controller;

import com.pos.finance.dto.executive.ExecutivePeriod;
import com.pos.finance.dto.executive.ExecutiveSummaryDto;
import com.pos.finance.service.ExecutiveSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/finance/executive")
@RequiredArgsConstructor
@Tag(name = "Finance Executive", description = "Сводка для мобильного приложения руководителя")
public class ExecutiveSummaryController {

    private final ExecutiveSummaryService executiveSummaryService;

    @GetMapping("/summary")
    @Operation(summary = "Сводка для руководителя")
    public ResponseEntity<ExecutiveSummaryDto> summary(
        @RequestParam(defaultValue = "TODAY") ExecutivePeriod period,
        @RequestParam(required = false) Integer storeId
    ) {
        return ResponseEntity.ok(executiveSummaryService.getSummary(period, storeId));
    }
}
