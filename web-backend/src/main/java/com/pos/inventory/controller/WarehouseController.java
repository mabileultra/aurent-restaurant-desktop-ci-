package com.pos.inventory.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.catalog.dto.product.ProductResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.inventory.dto.warehouse.CreateStockExpenseRequest;
import com.pos.inventory.dto.warehouse.CreateStockInventoryRequest;
import com.pos.inventory.dto.warehouse.CreateStockProductionRequest;
import com.pos.inventory.dto.warehouse.CreateStockReceiptRequest;
import com.pos.inventory.dto.warehouse.CreateStockTransferRequest;
import com.pos.inventory.dto.warehouse.StockExpenseResponse;
import com.pos.inventory.dto.warehouse.StockInventoryResponse;
import com.pos.inventory.dto.warehouse.StockProductionResponse;
import com.pos.inventory.dto.warehouse.StockReceiptResponse;
import com.pos.inventory.dto.warehouse.StockTransferResponse;
import com.pos.inventory.dto.stock.CreateWriteOffRequest;
import com.pos.inventory.dto.stock.WriteOffRowResponse;
import com.pos.inventory.dto.warehouse.WarehouseReceiveRequest;
import com.pos.catalog.service.ProductService;
import com.pos.inventory.service.stock.StockExpenseService;
import com.pos.inventory.service.stock.StockInventoryService;
import com.pos.inventory.service.stock.StockProductionService;
import com.pos.inventory.service.stock.StockReceiptService;
import com.pos.inventory.service.stock.StockTransferService;
import com.pos.inventory.service.stock.StockWriteOffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Складской UI: те же товары и поле {@code stock_quantity}, что и {@code /products}.
 * Отдельный префикс — удобные фильтры (штрихкод, маркировка); БД одна.
 */
@RestController
@RequestMapping("/warehouse")
@RequiredArgsConstructor
@Tag(name = "Warehouse", description = "Складские операции: приход, инвентаризация, перемещения")
@StandardApiResponses
public class WarehouseController {

    private final ProductService productService;
    private final StockReceiptService stockReceiptService;
    private final StockInventoryService stockInventoryService;
    private final StockTransferService stockTransferService;
    private final StockWriteOffService stockWriteOffService;
    private final StockExpenseService stockExpenseService;
    private final StockProductionService stockProductionService;

    @GetMapping("/products")
    @Operation(
        summary = "Товары склада",
        description = "Список товаров с фильтрами для складского интерфейса. "
            + "При storeId остаток (stockQuantity) считается по филиалу; без storeId — сумма по компании."
    )
    @ApiResponse(responseCode = "200", description = "Список товаров")
    public ResponseEntity<PageResponse<ProductResponse>> listWarehouseProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String barcode,
        @RequestParam(required = false) Boolean markedProduct,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(
            productService.getWarehouseProducts(search, barcode, markedProduct, null, storeId, pageable)
        );
    }

    @PostMapping("/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Быстрый приход", description = "Приём товара на склад одной операцией")
    @ApiResponse(responseCode = "200", description = "Товар принят")
    public ResponseEntity<ProductResponse> receiveStock(@Valid @RequestBody WarehouseReceiveRequest request) {
        return ResponseEntity.ok(productService.receiveWarehouseStock(request));
    }

    /** Приход на несколько строк (документ REC-…). */
    @PostMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать приход", description = "Оформление документа прихода на несколько позиций")
    @ApiResponse(responseCode = "200", description = "Документ прихода создан")
    public ResponseEntity<StockReceiptResponse> createReceipt(@Valid @RequestBody CreateStockReceiptRequest request) {
        return ResponseEntity.ok(stockReceiptService.create(request));
    }

    @GetMapping("/receipts")
    @Operation(summary = "Список приходов", description = "Документы прихода за период (оперативный список склада)")
    @ApiResponse(responseCode = "200", description = "Страница приходов")
    public ResponseEntity<PageResponse<StockReceiptResponse>> listReceipts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockReceiptService.list(from, to, storeId, pageable));
    }

    @GetMapping("/receipts/{id}")
    @Operation(summary = "Приход по ID", description = "Получение документа прихода")
    @ApiResponse(responseCode = "200", description = "Данные прихода")
    public ResponseEntity<StockReceiptResponse> getReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(stockReceiptService.getById(id));
    }

    @PostMapping("/inventories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать инвентаризацию", description = "Оформление документа инвентаризации")
    @ApiResponse(responseCode = "200", description = "Инвентаризация создана")
    public ResponseEntity<StockInventoryResponse> createInventory(
        @Valid @RequestBody CreateStockInventoryRequest request
    ) {
        return ResponseEntity.ok(stockInventoryService.create(request));
    }

    @GetMapping("/inventories")
    @Operation(summary = "Список инвентаризаций")
    @ApiResponse(responseCode = "200", description = "Страница инвентаризаций")
    public ResponseEntity<PageResponse<StockInventoryResponse>> listInventories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockInventoryService.list(from, to, storeId, pageable));
    }

    @GetMapping("/inventories/{id}")
    @Operation(summary = "Инвентаризация по ID", description = "Получение документа инвентаризации")
    @ApiResponse(responseCode = "200", description = "Данные инвентаризации")
    public ResponseEntity<StockInventoryResponse> getInventory(@PathVariable UUID id) {
        return ResponseEntity.ok(stockInventoryService.getById(id));
    }

    @PostMapping("/transfers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать перемещение", description = "Перемещение товара между складами/магазинами")
    @ApiResponse(responseCode = "200", description = "Перемещение создано")
    public ResponseEntity<StockTransferResponse> createTransfer(
        @Valid @RequestBody CreateStockTransferRequest request
    ) {
        return ResponseEntity.ok(stockTransferService.create(request));
    }

    @GetMapping("/transfers")
    @Operation(summary = "Список перемещений")
    @ApiResponse(responseCode = "200", description = "Страница перемещений")
    public ResponseEntity<PageResponse<StockTransferResponse>> listTransfers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer fromStoreId,
        @RequestParam(required = false) Integer toStoreId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockTransferService.list(from, to, fromStoreId, toStoreId, pageable));
    }

    @GetMapping("/transfers/{id}")
    @Operation(summary = "Перемещение по ID", description = "Получение документа перемещения")
    @ApiResponse(responseCode = "200", description = "Данные перемещения")
    public ResponseEntity<StockTransferResponse> getTransfer(@PathVariable UUID id) {
        return ResponseEntity.ok(stockTransferService.getById(id));
    }

    @PostMapping("/write-offs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать списание", description = "Оформление списания товара со склада")
    @ApiResponse(responseCode = "201", description = "Списание создано")
    public ResponseEntity<WriteOffRowResponse> createWriteOff(@Valid @RequestBody CreateWriteOffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(stockWriteOffService.create(request));
    }

    @PostMapping("/expenses")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать расход", description = "Внутренний расход со склада (не брак)")
    @ApiResponse(responseCode = "201", description = "Расход создан")
    public ResponseEntity<StockExpenseResponse> createExpense(@Valid @RequestBody CreateStockExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockExpenseService.create(request));
    }

    @GetMapping("/expenses/{id}")
    @Operation(summary = "Расход по ID")
    @ApiResponse(responseCode = "200", description = "Документ расхода")
    public ResponseEntity<StockExpenseResponse> getExpense(@PathVariable UUID id) {
        return ResponseEntity.ok(stockExpenseService.getById(id));
    }

    @GetMapping("/expenses")
    @Operation(summary = "Список расходов")
    @ApiResponse(responseCode = "200", description = "Страница расходов")
    public ResponseEntity<PageResponse<StockExpenseResponse>> listExpenses(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockExpenseService.list(from, to, storeId, pageable));
    }

    @PostMapping("/productions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать производство", description = "Списание ингредиентов и приход полуфабриката")
    @ApiResponse(responseCode = "201", description = "Производство создано")
    public ResponseEntity<StockProductionResponse> createProduction(
        @Valid @RequestBody CreateStockProductionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockProductionService.create(request));
    }

    @GetMapping("/productions/{id}")
    @Operation(summary = "Производство по ID")
    @ApiResponse(responseCode = "200", description = "Документ производства")
    public ResponseEntity<StockProductionResponse> getProduction(@PathVariable UUID id) {
        return ResponseEntity.ok(stockProductionService.getById(id));
    }

    @GetMapping("/productions")
    @Operation(summary = "Список производств")
    @ApiResponse(responseCode = "200", description = "Страница производств")
    public ResponseEntity<PageResponse<StockProductionResponse>> listProductions(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(stockProductionService.list(from, to, storeId, pageable));
    }
}
