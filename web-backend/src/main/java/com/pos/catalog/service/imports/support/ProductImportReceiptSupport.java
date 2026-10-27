package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.inventory.dto.warehouse.CreateStockReceiptRequest;
import com.pos.inventory.dto.warehouse.StockReceiptLineRequest;
import com.pos.inventory.dto.warehouse.StockReceiptResponse;
import com.pos.inventory.service.stock.StockReceiptService;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Сборка строк и проведение прихода после импорта. */
@Component
@RequiredArgsConstructor
public class ProductImportReceiptSupport {

    private final StockReceiptService stockReceiptService;

    public StockReceiptLineRequest toLine(
        UUID productId,
        ProductImportPreviewRow row,
        ProductImportConfirmRequest.ImportRowConfirm rowOpts
    ) {
        BigDecimal qty = QuantityUtil.normalize(row.quantity());
        BigDecimal purchase = row.costPrice() != null && row.costPrice().signum() >= 0
            ? row.costPrice()
            : BigDecimal.ZERO;
        BigDecimal selling = row.fileSellingPrice();
        if (rowOpts != null && rowOpts.sellingPrice() != null) {
            selling = rowOpts.sellingPrice();
        }
        if (selling == null || selling.signum() < 0) {
            selling = BigDecimal.ZERO;
        }
        Integer vat = row.taxRatePercent() != null ? row.taxRatePercent().intValue() : null;
        Boolean marked = rowOpts != null ? rowOpts.markedProduct() : null;
        String location = rowOpts != null && StringUtils.hasText(rowOpts.storageLocation())
            ? rowOpts.storageLocation().trim()
            : row.storageLocation();
        return new StockReceiptLineRequest(productId, qty, purchase, selling, vat, marked, location);
    }

    /**
     * @return номер прихода или {@code null}, если строк нет / приход не удался
     *         (ошибка пишется в {@code errors}; товары к этому моменту уже созданы).
     */
    public String postReceipt(
        Integer storeId,
        UUID supplierId,
        String paymentType,
        String receiptNotes,
        String invoiceDocumentId,
        List<StockReceiptLineRequest> lines,
        int createdCount,
        List<String> errors
    ) {
        if (lines == null || lines.isEmpty()) {
            return null;
        }
        String pay = StringUtils.hasText(paymentType) ? paymentType.trim().toUpperCase() : "CASH";
        if (!"CASH".equals(pay) && !"CREDIT".equals(pay)) {
            pay = "CASH";
        }
        if ("CREDIT".equals(pay) && supplierId == null) {
            errors.add("Товары созданы (" + createdCount
                + "), но приход не проведён: для долга укажите поставщика");
            return null;
        }
        String notes = StringUtils.hasText(receiptNotes)
            ? receiptNotes.trim()
            : (StringUtils.hasText(invoiceDocumentId)
                ? "Импорт " + invoiceDocumentId.trim()
                : "Импорт товаров");
        try {
            StockReceiptResponse receipt = stockReceiptService.create(new CreateStockReceiptRequest(
                supplierId,
                storeId,
                notes,
                pay,
                lines
            ));
            return receipt.receiptNumber();
        } catch (BadRequestException | ResourceNotFoundException ex) {
            errors.add("Товары созданы (" + createdCount + "), но приход не проведён: " + ex.getMessage());
            return null;
        } catch (RuntimeException ex) {
            errors.add("Товары созданы (" + createdCount + "), но приход не проведён: "
                + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()));
            return null;
        }
    }
}
