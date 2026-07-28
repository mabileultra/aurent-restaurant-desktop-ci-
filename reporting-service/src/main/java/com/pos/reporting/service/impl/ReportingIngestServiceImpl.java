package com.pos.reporting.service.impl;

import com.pos.reporting.service.ReportingIngestService;

import com.pos.reporting.entity.ProductSnapshotFact;
import com.pos.reporting.entity.SaleFact;
import com.pos.reporting.entity.SaleItemFact;
import com.pos.reporting.entity.ShiftClosedFact;
import com.pos.reporting.entity.StockInventoryFact;
import com.pos.reporting.entity.StockMovementFact;
import com.pos.reporting.entity.StockReceiptFact;
import com.pos.reporting.entity.StockTransferFact;
import com.pos.reporting.repository.ProductSnapshotFactRepository;
import com.pos.reporting.repository.SaleFactRepository;
import com.pos.reporting.repository.SaleItemFactRepository;
import com.pos.reporting.repository.ShiftClosedFactRepository;
import com.pos.reporting.repository.StockInventoryFactRepository;
import com.pos.reporting.repository.StockMovementFactRepository;
import com.pos.reporting.repository.StockReceiptFactRepository;
import com.pos.reporting.repository.StockTransferFactRepository;
import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.SaleLineSnapshot;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockInventoryRecordedEvent;
import com.pos.shared.event.StockMovementRecordedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.event.StockTransferRecordedEvent;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportingIngestServiceImpl implements ReportingIngestService {

    private final SaleFactRepository saleFactRepository;
    private final SaleItemFactRepository saleItemFactRepository;
    private final StockReceiptFactRepository stockReceiptFactRepository;
    private final StockMovementFactRepository stockMovementFactRepository;
    private final ProductSnapshotFactRepository productSnapshotFactRepository;
    private final StockInventoryFactRepository stockInventoryFactRepository;
    private final StockTransferFactRepository stockTransferFactRepository;
    private final ShiftClosedFactRepository shiftClosedFactRepository;

    @Transactional
    @Override
    public boolean ingestSale(SaleCompletedEvent event) {
        if (event == null || event.saleId() == null) {
            return false;
        }
        boolean isNew = !saleFactRepository.existsById(event.saleId());
        saleFactRepository.save(SaleFact.builder()
            .saleId(event.saleId())
            .companyId(event.companyId())
            .storeId(event.storeId())
            .storeName(event.storeName())
            .cashierName(event.cashierName())
            .receiptNumber(event.receiptNumber())
            .totalAmount(defaultAmount(event.totalAmount()))
            .cashAmount(defaultAmount(event.cashAmount()))
            .cardAmount(defaultAmount(event.cardAmount()))
            .paymentMethod(event.paymentMethod())
            .transactionDate(event.transactionDate())
            .createdBy(event.createdBy())
            .itemsSold(event.itemsSold())
            .saleStatus(defaultStatus(event.saleStatus()))
            .ingestedAt(Instant.now())
            .build());
        syncLineFacts(event);
        if (isNew) {
            LogUtil.info(ReportingIngestService.class, "Sale fact ingested: saleId={}", event.saleId());
        }
        return isNew;
    }

    private void syncLineFacts(SaleCompletedEvent event) {
        saleItemFactRepository.deleteBySaleId(event.saleId());
        List<SaleLineSnapshot> lines = event.lines() != null ? event.lines() : List.of();
        if (lines.isEmpty()) {
            return;
        }
        Instant ingestedAt = Instant.now();
        for (SaleLineSnapshot line : lines) {
            if (line.productName() == null || line.productName().isBlank()) {
                continue;
            }
            long qty = line.quantity();
            long returned = line.quantityReturned();
            if (qty <= 0 && returned <= 0) {
                continue;
            }
            saleItemFactRepository.save(SaleItemFact.builder()
                .id(UUID.randomUUID())
                .saleId(event.saleId())
                .companyId(event.companyId())
                .storeId(event.storeId())
                .transactionDate(event.transactionDate())
                .productId(line.productId())
                .productName(line.productName())
                .sku(line.sku())
                .barcode(line.barcode())
                .categoryId(line.categoryId())
                .categoryName(line.categoryName())
                .quantity(qty)
                .quantityReturned(returned)
                .revenue(defaultAmount(line.revenue()))
                .costEstimate(defaultAmount(line.costEstimate()))
                .ingestedAt(ingestedAt)
                .build());
        }
    }

    @Transactional
    @Override
    public boolean ingestStock(StockReceivedEvent event) {
        if (event == null || event.receiptId() == null) {
            return false;
        }
        Instant ingestedAt = Instant.now();
        return stockReceiptFactRepository.findById(event.receiptId())
            .map(existing -> enrichStockFact(existing, event, ingestedAt))
            .orElseGet(() -> saveNewStockFact(event, ingestedAt));
    }

    private boolean saveNewStockFact(StockReceivedEvent event, Instant ingestedAt) {
        stockReceiptFactRepository.save(buildStockFact(event, ingestedAt));
        LogUtil.info(ReportingIngestService.class, "Stock receipt fact ingested: receiptId={}", event.receiptId());
        return true;
    }

    private boolean enrichStockFact(StockReceiptFact fact, StockReceivedEvent event, Instant ingestedAt) {
        if (!applyStockEventFields(fact, event)) {
            return false;
        }
        fact.setIngestedAt(ingestedAt);
        stockReceiptFactRepository.save(fact);
        LogUtil.info(ReportingIngestService.class, "Stock receipt fact enriched: receiptId={}", event.receiptId());
        return true;
    }

    private static StockReceiptFact buildStockFact(StockReceivedEvent event, Instant ingestedAt) {
        StockReceiptFact fact = StockReceiptFact.builder()
            .receiptId(event.receiptId())
            .companyId(event.companyId())
            .storeId(event.storeId())
            .supplierId(event.supplierId())
            .totalAmount(defaultAmount(event.totalAmount()))
            .transactionDate(event.transactionDate())
            .createdBy(event.createdBy())
            .ingestedAt(ingestedAt)
            .build();
        applyStockEventFields(fact, event);
        return fact;
    }

    private static boolean applyStockEventFields(StockReceiptFact fact, StockReceivedEvent event) {
        boolean changed = false;
        if (event.receiptNumber() != null && !event.receiptNumber().equals(fact.getReceiptNumber())) {
            fact.setReceiptNumber(event.receiptNumber());
            changed = true;
        }
        if (event.supplierName() != null && !event.supplierName().equals(fact.getSupplierName())) {
            fact.setSupplierName(event.supplierName());
            changed = true;
        }
        if (event.storeName() != null && !event.storeName().equals(fact.getStoreName())) {
            fact.setStoreName(event.storeName());
            changed = true;
        }
        if (event.totalQuantity() != null
            && (fact.getTotalQuantity() == null || fact.getTotalQuantity().compareTo(event.totalQuantity()) != 0)) {
            fact.setTotalQuantity(event.totalQuantity());
            changed = true;
        }
        if (event.createdAt() != null && !event.createdAt().equals(fact.getCreatedAt())) {
            fact.setCreatedAt(event.createdAt());
            changed = true;
        }
        return changed;
    }

    @Transactional
    @Override
    public boolean ingestMovement(StockMovementRecordedEvent event) {
        if (event == null || event.movementId() == null) {
            return false;
        }
        Instant ingestedAt = Instant.now();
        return stockMovementFactRepository.findById(event.movementId())
            .map(existing -> enrichMovementFact(existing, event, ingestedAt))
            .orElseGet(() -> saveNewMovementFact(event, ingestedAt));
    }

    private boolean saveNewMovementFact(StockMovementRecordedEvent event, Instant ingestedAt) {
        stockMovementFactRepository.save(buildMovementFact(event, ingestedAt));
        LogUtil.info(ReportingIngestService.class, "Stock movement fact ingested: movementId={}", event.movementId());
        return true;
    }

    private boolean enrichMovementFact(StockMovementFact fact, StockMovementRecordedEvent event, Instant ingestedAt) {
        if (!applyMovementEventFields(fact, event)) {
            return false;
        }
        fact.setIngestedAt(ingestedAt);
        stockMovementFactRepository.save(fact);
        LogUtil.info(ReportingIngestService.class, "Stock movement fact enriched: movementId={}", event.movementId());
        return true;
    }

    private static StockMovementFact buildMovementFact(StockMovementRecordedEvent event, Instant ingestedAt) {
        StockMovementFact fact = StockMovementFact.builder()
            .movementId(event.movementId())
            .companyId(event.companyId())
            .storeId(event.storeId())
            .productId(event.productId())
            .productName(event.productName() != null ? event.productName() : "—")
            .movementType(event.movementType())
            .quantity(defaultAmount(event.quantity()))
            .unitCostEstimate(defaultAmount(event.unitCostEstimate()))
            .transactionDate(event.transactionDate())
            .createdBy(event.createdBy())
            .createdAt(event.createdAt())
            .ingestedAt(ingestedAt)
            .build();
        applyMovementEventFields(fact, event);
        return fact;
    }

    private static boolean applyMovementEventFields(StockMovementFact fact, StockMovementRecordedEvent event) {
        boolean changed = false;
        if (event.storeName() != null && !event.storeName().equals(fact.getStoreName())) {
            fact.setStoreName(event.storeName());
            changed = true;
        }
        if (event.sku() != null && !event.sku().equals(fact.getSku())) {
            fact.setSku(event.sku());
            changed = true;
        }
        if (event.barcode() != null && !event.barcode().equals(fact.getBarcode())) {
            fact.setBarcode(event.barcode());
            changed = true;
        }
        if (event.writeOffReason() != null && !event.writeOffReason().equals(fact.getWriteOffReason())) {
            fact.setWriteOffReason(event.writeOffReason());
            changed = true;
        }
        if (event.notes() != null && !event.notes().equals(fact.getNotes())) {
            fact.setNotes(event.notes());
            changed = true;
        }
        if (event.referenceNumber() != null && !event.referenceNumber().equals(fact.getReferenceNumber())) {
            fact.setReferenceNumber(event.referenceNumber());
            changed = true;
        }
        if (event.createdByName() != null && !event.createdByName().equals(fact.getCreatedByName())) {
            fact.setCreatedByName(event.createdByName());
            changed = true;
        }
        if (event.unitCostEstimate() != null) {
            BigDecimal incoming = defaultAmount(event.unitCostEstimate());
            if (fact.getUnitCostEstimate() == null || fact.getUnitCostEstimate().compareTo(incoming) != 0) {
                fact.setUnitCostEstimate(incoming);
                changed = true;
            }
        }
        return changed;
    }

    @Transactional
    @Override
    public boolean ingestProduct(ProductSnapshotEvent event) {
        if (event == null || event.productId() == null || event.companyId() == null) {
            return false;
        }
        Instant ingestedAt = Instant.now();
        boolean isNew = !productSnapshotFactRepository.existsById(event.productId());
        productSnapshotFactRepository.save(ProductSnapshotFact.builder()
            .productId(event.productId())
            .companyId(event.companyId())
            .sku(event.sku() != null ? event.sku() : "")
            .productName(event.productName() != null ? event.productName() : "—")
            .barcode(event.barcode())
            .categoryId(event.categoryId())
            .categoryName(event.categoryName())
            .costPrice(defaultAmount(event.costPrice()))
            .sellingPrice(defaultAmount(event.sellingPrice()))
            .lowStockAlert(event.lowStockAlert())
            .active(event.active())
            .updatedAt(event.updatedAt())
            .ingestedAt(ingestedAt)
            .build());
        if (isNew) {
            LogUtil.info(ReportingIngestService.class, "Product snapshot ingested: productId={}", event.productId());
        } else {
            LogUtil.info(ReportingIngestService.class, "Product snapshot updated: productId={}", event.productId());
        }
        return true;
    }

    @Transactional
    @Override
    public boolean ingestInventory(StockInventoryRecordedEvent event) {
        if (event == null || event.inventoryId() == null || event.companyId() == null) {
            return false;
        }
        Instant ingestedAt = Instant.now();
        boolean isNew = !stockInventoryFactRepository.existsById(event.inventoryId());
        stockInventoryFactRepository.save(StockInventoryFact.builder()
            .inventoryId(event.inventoryId())
            .companyId(event.companyId())
            .inventoryNumber(event.inventoryNumber() != null ? event.inventoryNumber() : "")
            .storeId(event.storeId())
            .storeName(event.storeName())
            .status(event.status() != null ? event.status() : "COMPLETED")
            .notes(event.notes())
            .totalLines(event.totalLines())
            .totalDifference(defaultAmount(event.totalDifference()))
            .createdBy(event.createdBy())
            .createdByName(event.createdByName())
            .createdAt(event.createdAt())
            .transactionDate(event.transactionDate())
            .ingestedAt(ingestedAt)
            .build());
        if (isNew) {
            LogUtil.info(ReportingIngestService.class, "Inventory fact ingested: inventoryId={}", event.inventoryId());
        }
        return true;
    }

    @Transactional
    @Override
    public boolean ingestTransfer(StockTransferRecordedEvent event) {
        if (event == null || event.transferId() == null || event.companyId() == null) {
            return false;
        }
        Instant ingestedAt = Instant.now();
        boolean isNew = !stockTransferFactRepository.existsById(event.transferId());
        stockTransferFactRepository.save(StockTransferFact.builder()
            .transferId(event.transferId())
            .companyId(event.companyId())
            .transferNumber(event.transferNumber() != null ? event.transferNumber() : "")
            .fromStoreId(event.fromStoreId())
            .fromStoreName(event.fromStoreName())
            .toStoreId(event.toStoreId())
            .toStoreName(event.toStoreName())
            .notes(event.notes())
            .totalQuantity(defaultAmount(event.totalQuantity()))
            .createdBy(event.createdBy())
            .createdByName(event.createdByName())
            .createdAt(event.createdAt())
            .transactionDate(event.transactionDate())
            .ingestedAt(ingestedAt)
            .build());
        if (isNew) {
            LogUtil.info(ReportingIngestService.class, "Transfer fact ingested: transferId={}", event.transferId());
        }
        return true;
    }

    @Transactional
    @Override
    public boolean ingestShift(ShiftClosedEvent event) {
        if (event == null || event.zReportId() == null || shiftClosedFactRepository.existsById(event.zReportId())) {
            return false;
        }
        shiftClosedFactRepository.save(ShiftClosedFact.builder()
            .zReportId(event.zReportId())
            .shiftId(event.shiftId())
            .companyId(event.companyId())
            .storeId(event.storeId())
            .totalSales(defaultAmount(event.totalSales()))
            .businessDate(event.businessDate())
            .zNumber(event.zNumber())
            .storeName(event.storeName())
            .closedAt(event.closedAt())
            .salesCount(event.salesCount())
            .employeeName(event.employeeName())
            .ingestedAt(Instant.now())
            .build());
        LogUtil.info(ReportingIngestService.class, "Shift closed fact ingested: zReportId={}", event.zReportId());
        return true;
    }

    private static BigDecimal defaultAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static String defaultStatus(String value) {
        return value != null && !value.isBlank() ? value : "COMPLETED";
    }
}
