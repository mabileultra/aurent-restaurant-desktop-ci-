package com.pos.reporting.service.impl;

import com.pos.reporting.service.InventoryFactsBackfillService;
import com.pos.reporting.service.MovementFactsBackfillService;
import com.pos.reporting.service.ProductFactsBackfillService;
import com.pos.reporting.service.StockFactsBackfillService;
import com.pos.reporting.service.TransferFactsBackfillService;

import com.pos.reporting.service.ShiftFactsBackfillService;

import com.pos.reporting.service.SaleFactsBackfillService;

import com.pos.reporting.service.ReportingBackfillService;

import com.pos.reporting.dto.FactsBackfillResult;
import com.pos.reporting.dto.ReportingBackfillResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportingBackfillServiceImpl implements ReportingBackfillService {

    private static final FactsBackfillResult EMPTY = new FactsBackfillResult(0L, 0L, 0L);

    private final SaleFactsBackfillService saleFactsBackfillService;
    private final StockFactsBackfillService stockFactsBackfillService;
    private final MovementFactsBackfillService movementFactsBackfillService;
    private final ShiftFactsBackfillService shiftFactsBackfillService;
    private final ProductFactsBackfillService productFactsBackfillService;
    private final InventoryFactsBackfillService inventoryFactsBackfillService;
    private final TransferFactsBackfillService transferFactsBackfillService;

    @Override
    public ReportingBackfillResponse backfill(LocalDate from, LocalDate to, String types) {
        Set<String> typeSet = parseTypes(types);
        FactsBackfillResult sales = typeSet.contains("sales")
            ? saleFactsBackfillService.backfill(from, to)
            : EMPTY;
        FactsBackfillResult stock = typeSet.contains("stock")
            ? stockFactsBackfillService.backfill(from, to)
            : EMPTY;
        FactsBackfillResult movements = typeSet.contains("movements")
            ? movementFactsBackfillService.backfill(from, to)
            : EMPTY;
        FactsBackfillResult shifts = typeSet.contains("shifts")
            ? shiftFactsBackfillService.backfill(from, to)
            : EMPTY;
        FactsBackfillResult products = typeSet.contains("products")
            ? productFactsBackfillService.backfill()
            : EMPTY;
        FactsBackfillResult inventories = typeSet.contains("inventories")
            ? inventoryFactsBackfillService.backfill(from, to)
            : EMPTY;
        FactsBackfillResult transfers = typeSet.contains("transfers")
            ? transferFactsBackfillService.backfill(from, to)
            : EMPTY;
        return new ReportingBackfillResponse(sales, stock, movements, shifts, products, inventories, transfers);
    }

    private static Set<String> parseTypes(String types) {
        if (types == null || types.isBlank()) {
            return Set.of("sales", "stock", "movements", "shifts", "products", "inventories", "transfers");
        }
        return Arrays.stream(types.split(","))
            .map(value -> value.trim().toLowerCase(Locale.ROOT))
            .filter(value -> !value.isBlank())
            .collect(Collectors.toSet());
    }
}
