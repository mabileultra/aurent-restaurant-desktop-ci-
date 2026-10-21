package com.pos.restaurant.edge.controller;

import com.pos.restaurant.edge.warehouse.EdgeWhDocumentQueryService;
import com.pos.restaurant.edge.warehouse.EdgeWhExpenseService;
import com.pos.restaurant.edge.warehouse.EdgeWhInventoryService;
import com.pos.restaurant.edge.warehouse.EdgeWhProductQueryService;
import com.pos.restaurant.edge.warehouse.EdgeWhProductionService;
import com.pos.restaurant.edge.warehouse.EdgeWhReceiptService;
import com.pos.restaurant.edge.warehouse.EdgeWhTransferService;
import com.pos.restaurant.edge.warehouse.EdgeWhWriteOffService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** Edge warehouse HTTP adapter — delegates to one use-case service per document type. */
@RestController
@RequestMapping("/warehouse")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWarehouseController {

    private final EdgeWhProductQueryService products;
    private final EdgeWhDocumentQueryService documents;
    private final EdgeWhReceiptService receipts;
    private final EdgeWhInventoryService inventories;
    private final EdgeWhTransferService transfers;
    private final EdgeWhWriteOffService writeOffs;
    private final EdgeWhExpenseService expenses;
    private final EdgeWhProductionService productions;

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> listProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String barcode,
        @RequestParam(required = false) Boolean markedProduct,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(products.list(search, barcode, markedProduct, storeId, pageable));
    }

    @PostMapping("/receipt")
    public ResponseEntity<Map<String, Object>> quickReceive(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(receipts.quickReceive(body));
    }

    @PostMapping("/receipts")
    public ResponseEntity<Map<String, Object>> createReceipt(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(receipts.create(body));
    }

    @GetMapping("/receipts")
    public ResponseEntity<Map<String, Object>> listReceipts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(documents.list("RECEIPT", from, to, storeId, pageable));
    }

    @GetMapping("/receipts/{id}")
    public ResponseEntity<Map<String, Object>> getReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(documents.get(id));
    }

    @PostMapping("/inventories")
    public ResponseEntity<Map<String, Object>> createInventory(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(inventories.create(body));
    }

    @GetMapping("/inventories")
    public ResponseEntity<Map<String, Object>> listInventories(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(documents.list("INVENTORY", from, to, storeId, pageable));
    }

    @GetMapping("/inventories/{id}")
    public ResponseEntity<Map<String, Object>> getInventory(@PathVariable UUID id) {
        return ResponseEntity.ok(documents.get(id));
    }

    @PostMapping("/transfers")
    public ResponseEntity<Map<String, Object>> createTransfer(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(transfers.create(body));
    }

    @GetMapping("/transfers")
    public ResponseEntity<Map<String, Object>> listTransfers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer fromStoreId,
        @RequestParam(required = false) Integer toStoreId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(documents.listTransfers(from, to, fromStoreId, toStoreId, pageable));
    }

    @GetMapping("/transfers/{id}")
    public ResponseEntity<Map<String, Object>> getTransfer(@PathVariable UUID id) {
        return ResponseEntity.ok(documents.get(id));
    }

    @PostMapping("/write-offs")
    public ResponseEntity<Map<String, Object>> createWriteOff(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(writeOffs.create(body));
    }

    @PostMapping("/expenses")
    public ResponseEntity<Map<String, Object>> createExpense(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenses.create(body));
    }

    @GetMapping("/expenses")
    public ResponseEntity<Map<String, Object>> listExpenses(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(documents.list("EXPENSE", from, to, storeId, pageable));
    }

    @GetMapping("/expenses/{id}")
    public ResponseEntity<Map<String, Object>> getExpense(@PathVariable UUID id) {
        return ResponseEntity.ok(documents.get(id));
    }

    @PostMapping("/productions")
    public ResponseEntity<Map<String, Object>> createProduction(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productions.create(body));
    }

    @GetMapping("/productions")
    public ResponseEntity<Map<String, Object>> listProductions(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) Integer storeId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(documents.list("PRODUCTION", from, to, storeId, pageable));
    }

    @GetMapping("/productions/{id}")
    public ResponseEntity<Map<String, Object>> getProduction(@PathVariable UUID id) {
        return ResponseEntity.ok(documents.get(id));
    }
}
