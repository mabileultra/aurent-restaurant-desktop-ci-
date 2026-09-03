package com.pos.service.event.support;

import com.pos.sales.entity.CashierShift;
import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.PharmacyPackSupport;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.inventory.entity.StockInventory;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.entity.StockTransfer;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.sales.entity.ZReport;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.event.SaleLineSnapshot;
import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.event.ShiftClosedEvent;
import com.pos.shared.event.StockInventoryRecordedEvent;
import com.pos.shared.event.StockMovementRecordedEvent;
import com.pos.shared.event.StockReceivedEvent;
import com.pos.shared.event.StockTransferRecordedEvent;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class DomainEventMappers {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Tashkent");

    private DomainEventMappers() {
    }

    public static SaleCompletedEvent toSaleCompleted(Sale sale) {
        return toSaleCompleted(sale, Map.of());
    }

    public static SaleCompletedEvent toSaleCompleted(
        Sale sale,
        Map<UUID, Map<String, String>> attributesByProductId
    ) {
        if (sale == null || sale.getId() == null) {
            return null;
        }
        Map<UUID, Map<String, String>> attrs = attributesByProductId != null
            ? attributesByProductId
            : Map.of();
        Integer companyId = sale.getCompany() != null
            ? sale.getCompany().getId()
            : sale.getStore() != null && sale.getStore().getCompany() != null
                ? sale.getStore().getCompany().getId()
                : null;
        Integer storeId = sale.getStore() != null ? sale.getStore().getId() : null;
        UUID createdBy = sale.getCashier() != null ? sale.getCashier().getId() : null;
        String storeName = sale.getStore() != null ? sale.getStore().getName() : null;
        String cashierName = sale.getCashier() != null ? sale.getCashier().getFullName() : null;
        LocalDate transactionDate = sale.getCreatedAt() != null
            ? sale.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        return new SaleCompletedEvent(
            companyId,
            storeId,
            sale.getId(),
            sale.getReceiptNumber(),
            sale.getTotalAmount(),
            sale.getCashAmount(),
            sale.getCardAmount(),
            sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : null,
            transactionDate,
            createdBy,
            sumItemsSold(sale, attrs),
            storeName,
            cashierName,
            sale.getStatus() != null ? sale.getStatus().name() : "COMPLETED",
            mapLines(sale, attrs)
        );
    }

    private static List<SaleLineSnapshot> mapLines(Sale sale, Map<UUID, Map<String, String>> attrs) {
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            return List.of();
        }
        List<SaleLineSnapshot> lines = new ArrayList<>();
        for (SaleItem item : sale.getItems()) {
            if (item.getProductName() == null || item.getProductName().isBlank()) {
                continue;
            }
            BigDecimal itemQty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            BigDecimal returnedQty = item.getReturnedQuantity() != null ? item.getReturnedQuantity() : BigDecimal.ZERO;
            BigDecimal netQty = itemQty.subtract(returnedQty);
            if (netQty.signum() < 0) {
                netQty = BigDecimal.ZERO;
            }
            Product product = item.getProduct();
            Map<String, String> productAttrs = productAttrs(product, attrs);
            long quantity = PharmacyPackSupport.reportableUnits(
                product, item.getUnitPrice(), itemQty, productAttrs
            );
            long quantityReturned = PharmacyPackSupport.reportableUnits(
                product, item.getUnitPrice(), returnedQty, productAttrs
            );
            BigDecimal revenue = proportionalRevenue(item, netQty);
            BigDecimal costEstimate = PharmacyPackSupport.costEstimate(
                product, item.getUnitPrice(), netQty, productAttrs
            );
            UUID productId = product != null ? product.getId() : null;
            String sku = product != null ? product.getSku() : null;
            String barcode = product != null ? product.getBarcode() : null;
            Integer categoryId = product != null && product.getCategory() != null
                ? product.getCategory().getId()
                : null;
            String categoryName = product != null && product.getCategory() != null
                ? product.getCategory().getName()
                : "";
            lines.add(new SaleLineSnapshot(
                productId,
                item.getProductName(),
                sku,
                barcode,
                categoryId,
                categoryName,
                quantity,
                quantityReturned,
                revenue,
                costEstimate
            ));
        }
        return lines;
    }

    private static Map<String, String> productAttrs(Product product, Map<UUID, Map<String, String>> attrs) {
        if (product == null || product.getId() == null || attrs == null) {
            return Map.of();
        }
        return attrs.getOrDefault(product.getId(), Map.of());
    }

    private static BigDecimal proportionalRevenue(SaleItem item, BigDecimal netQty) {
        if (item.getLineTotal() == null || item.getQuantity() == null || item.getQuantity().signum() == 0) {
            return BigDecimal.ZERO;
        }
        return item.getLineTotal()
            .multiply(netQty)
            .divide(item.getQuantity(), 2, RoundingMode.HALF_UP);
    }

    private static long sumItemsSold(Sale sale, Map<UUID, Map<String, String>> attrs) {
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            return 0L;
        }
        long total = 0L;
        for (SaleItem item : sale.getItems()) {
            if (item.getQuantity() == null) {
                continue;
            }
            Product product = item.getProduct();
            total += PharmacyPackSupport.reportableUnits(
                product, item.getUnitPrice(), item.getQuantity(), productAttrs(product, attrs)
            );
        }
        return total;
    }

    public static StockReceivedEvent toStockReceived(StockReceipt receipt) {
        if (receipt == null || receipt.getId() == null) {
            return null;
        }
        Integer companyId = receipt.getStore() != null && receipt.getStore().getCompany() != null
            ? receipt.getStore().getCompany().getId()
            : null;
        Integer storeId = receipt.getStore() != null ? receipt.getStore().getId() : null;
        UUID supplierId = receipt.getSupplier() != null ? receipt.getSupplier().getId() : null;
        UUID createdBy = receipt.getCreatedBy() != null ? receipt.getCreatedBy().getId() : null;
        LocalDate transactionDate = receipt.getCreatedAt() != null
            ? receipt.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        String receiptNumber = receipt.getReceiptNumber();
        String supplierName = receipt.getSupplier() != null ? receipt.getSupplier().getName() : null;
        String storeName = receipt.getStore() != null ? receipt.getStore().getName() : null;
        return new StockReceivedEvent(
            companyId,
            storeId,
            receipt.getId(),
            supplierId,
            receipt.getTotalCost(),
            transactionDate,
            createdBy,
            receiptNumber,
            supplierName,
            storeName,
            receipt.getTotalQuantity(),
            receipt.getCreatedAt()
        );
    }

    public static StockMovementRecordedEvent toStockMovementRecorded(StockMovement movement, String referenceNumber) {
        if (movement == null || movement.getId() == null) {
            return null;
        }
        Product product = movement.getProduct();
        Store store = movement.getStore();
        User createdBy = movement.getCreatedBy();
        Integer companyId = store != null && store.getCompany() != null ? store.getCompany().getId() : null;
        Integer storeId = store != null ? store.getId() : null;
        String storeName = store != null ? store.getName() : null;
        UUID productId = product != null ? product.getId() : null;
        String productName = product != null ? product.getName() : "—";
        String sku = product != null ? product.getSku() : null;
        String barcode = product != null ? product.getBarcode() : null;
        LocalDate transactionDate = movement.getCreatedAt() != null
            ? movement.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        BigDecimal unitCostEstimate = product != null && product.getCostPrice() != null
            ? product.getCostPrice()
            : BigDecimal.ZERO;
        return new StockMovementRecordedEvent(
            movement.getId(),
            companyId,
            storeId,
            storeName,
            productId,
            productName,
            sku,
            barcode,
            movement.getMovementType(),
            movement.getWriteOffReason(),
            movement.getQuantity(),
            movement.getNotes(),
            movement.getReferenceId(),
            referenceNumber,
            createdBy != null ? createdBy.getId() : null,
            createdBy != null ? createdBy.getFullName() : null,
            movement.getCreatedAt(),
            transactionDate,
            unitCostEstimate
        );
    }

    public static StockInventoryRecordedEvent toStockInventoryRecorded(StockInventory inventory) {
        if (inventory == null || inventory.getId() == null) {
            return null;
        }
        Store store = inventory.getStore();
        User createdBy = inventory.getCreatedBy();
        Integer companyId = store != null && store.getCompany() != null ? store.getCompany().getId() : null;
        LocalDate transactionDate = inventory.getCreatedAt() != null
            ? inventory.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        return new StockInventoryRecordedEvent(
            inventory.getId(),
            companyId,
            inventory.getInventoryNumber(),
            store != null ? store.getId() : null,
            store != null ? store.getName() : null,
            inventory.getStatus(),
            inventory.getNotes(),
            inventory.getTotalLines(),
            inventory.getTotalDifference(),
            createdBy != null ? createdBy.getId() : null,
            createdBy != null ? createdBy.getFullName() : null,
            inventory.getCreatedAt(),
            transactionDate
        );
    }

    public static StockTransferRecordedEvent toStockTransferRecorded(StockTransfer transfer) {
        if (transfer == null || transfer.getId() == null) {
            return null;
        }
        Store fromStore = transfer.getFromStore();
        Store toStore = transfer.getToStore();
        User createdBy = transfer.getCreatedBy();
        Integer companyId = fromStore != null && fromStore.getCompany() != null
            ? fromStore.getCompany().getId()
            : null;
        LocalDate transactionDate = transfer.getCreatedAt() != null
            ? transfer.getCreatedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        return new StockTransferRecordedEvent(
            transfer.getId(),
            companyId,
            transfer.getTransferNumber(),
            fromStore != null ? fromStore.getId() : null,
            fromStore != null ? fromStore.getName() : null,
            toStore != null ? toStore.getId() : null,
            toStore != null ? toStore.getName() : null,
            transfer.getNotes(),
            transfer.getTotalQuantity(),
            createdBy != null ? createdBy.getId() : null,
            createdBy != null ? createdBy.getFullName() : null,
            transfer.getCreatedAt(),
            transactionDate
        );
    }

    public static ProductSnapshotEvent toProductSnapshot(Product product) {
        if (product == null || product.getId() == null) {
            return null;
        }
        Integer companyId = product.getCompany() != null ? product.getCompany().getId() : null;
        Integer categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;
        return new ProductSnapshotEvent(
            product.getId(),
            companyId,
            product.getSku(),
            product.getName(),
            product.getBarcode(),
            categoryId,
            categoryName,
            product.getCostPrice(),
            product.getSellingPrice(),
            product.getLowStockAlert(),
            product.isActive(),
            product.getUpdatedAt() != null ? product.getUpdatedAt() : Instant.now()
        );
    }

    public static ShiftClosedEvent toShiftClosed(ZReport zReport, CashierShift shift) {
        if (zReport == null || shift == null || shift.getId() == null) {
            return null;
        }
        Integer companyId = shift.getStore() != null && shift.getStore().getCompany() != null
            ? shift.getStore().getCompany().getId()
            : null;
        Integer storeId = shift.getStore() != null ? shift.getStore().getId() : null;
        LocalDate businessDate = zReport.getClosedAt() != null
            ? zReport.getClosedAt().atZone(DEFAULT_ZONE).toLocalDate()
            : LocalDate.now(DEFAULT_ZONE);
        return new ShiftClosedEvent(
            companyId,
            storeId,
            shift.getId(),
            zReport.getId(),
            zReport.getTotalAmount(),
            businessDate,
            zReport.getZNumber(),
            shift.getStore() != null ? shift.getStore().getName() : null,
            zReport.getClosedAt(),
            zReport.getSalesCount(),
            zReport.getEmployeeName()
        );
    }

    public static String saleKey(Sale sale) {
        return sale.getId().toString();
    }

    public static String stockKey(StockReceipt receipt) {
        return receipt.getId().toString();
    }

    public static String movementKey(StockMovement movement) {
        return movement.getId().toString();
    }

    public static String inventoryKey(StockInventory inventory) {
        return inventory.getId().toString();
    }

    public static String transferKey(StockTransfer transfer) {
        return transfer.getId().toString();
    }

    public static String productKey(Product product) {
        return product.getId().toString();
    }

    public static String shiftKey(ZReport zReport, CashierShift shift) {
        return shift.getId() + ":" + zReport.getId();
    }
}
