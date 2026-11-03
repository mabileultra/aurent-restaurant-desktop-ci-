package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogManagedProductLoader;
import com.pos.domain.StockMovementType;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.inventory.dto.warehouse.StockReceiptLineRequest;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.entity.StockReceiptLine;
import com.pos.inventory.repository.StockMovementRepository;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.shared.log.LogUtil;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Откат остатков / движений и повторное проведение строк прихода.
 * Финансовые проводки (expense/payable) при delete/update не трогаем — идемпотентны по receiptId.
 */
@Component
@RequiredArgsConstructor
public class StockReceiptMutationSupport {

    private final StoreStockService storeStockService;
    private final StockMovementRepository stockMovementRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final CatalogManagedProductLoader catalogManagedProductLoader;
    private final StockDocumentSupport stockDocument;

    public void reverseStockAndMovements(StockReceipt receipt) {
        Store store = receipt.getStore();
        if (store == null) {
            throw PosExceptions.badRequest("У прихода не указан магазин");
        }
        for (StockReceiptLine line : receipt.getLines()) {
            if (line.getProductId() == null) {
                continue;
            }
            Product product = catalogManagedProductLoader.requireById(line.getProductId());
            storeStockService.decrease(product, store, line.getQuantity());
        }
        stockMovementRepository.deleteByReferenceId(receipt.getId());
        LogUtil.info(
            StockReceiptMutationSupport.class,
            "Receipt stock reversed: id={} number={} lines={}",
            receipt.getId(),
            receipt.getReceiptNumber(),
            receipt.getLines().size()
        );
    }

    /**
     * @return [totalQty, totalCost]
     */
    public BigDecimal[] applyLines(
        StockReceipt receipt,
        Store store,
        User user,
        List<StockReceiptLineRequest> lineReqs
    ) {
        UUID receiptId = receipt.getId();
        String receiptNumber = receipt.getReceiptNumber();
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalRetail = BigDecimal.ZERO;
        List<StockReceiptLine> lines = new ArrayList<>();

        for (StockReceiptLineRequest lineReq : lineReqs) {
            Product product = stockDocument.requireActiveGroceryProduct(lineReq.productId());
            BigDecimal q = QuantityUtil.normalize(lineReq.quantity());
            stockDocument.requirePositiveQuantity(q);
            com.pos.util.QuantityValidator.validate(
                com.pos.catalog.service.product.ProductQuantityRulesResolver.fromProduct(product), q);

            BigDecimal purchase = lineReq.purchasePrice() != null ? lineReq.purchasePrice() : BigDecimal.ZERO;
            BigDecimal selling = lineReq.unitSellingPrice() != null ? lineReq.unitSellingPrice() : BigDecimal.ZERO;
            if (purchase.signum() <= 0 && selling.signum() > 0) {
                purchase = selling;
            }

            product.setCostPrice(purchase);
            product.setSellingPrice(selling);
            if (lineReq.vatPercent() != null) {
                product.setTaxRate(ProductValueNormalizer.taxRatePercent(BigDecimal.valueOf(lineReq.vatPercent())));
            }
            if (lineReq.markedProduct() != null) {
                product.setMarkedProduct(lineReq.markedProduct());
            }
            if (StringUtils.hasText(lineReq.storageLocation())) {
                product.setStorageLocation(lineReq.storageLocation().trim());
            }
            catalogManagedProductLoader.saveCard(product);
            storeStockService.increase(product, store, q);

            BigDecimal lineCost = purchase.multiply(q).setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineRetail = selling.multiply(q).setScale(2, RoundingMode.HALF_UP);
            var card = StockLineCatalogSnapshot.Card.of(product);
            lines.add(StockReceiptLine.builder()
                .receipt(receipt)
                .productId(card.productId())
                .productName(card.productName())
                .productSku(card.productSku())
                .quantity(q)
                .purchasePrice(purchase)
                .unitSellingPrice(selling)
                .lineCost(lineCost)
                .lineRetail(lineRetail)
                .unitRetailPrice(selling)
                .build());

            stockMovementPersistence.save(StockLineCatalogSnapshot.apply(StockMovement.builder(), product)
                
                .store(store)
                .movementType(StockMovementType.RESTOCK)
                .quantity(q)
                .referenceId(receiptId)
                .notes("Приход " + receiptNumber)
                .createdBy(user)
                .build(), receiptNumber);

            totalQty = QuantityUtil.add(totalQty, q);
            totalCost = totalCost.add(lineCost);
            totalRetail = totalRetail.add(lineRetail);
        }

        receipt.getLines().clear();
        receipt.getLines().addAll(lines);
        receipt.setTotalQuantity(totalQty);
        receipt.setTotalCost(totalCost);
        receipt.setTotalRetail(totalRetail);
        return new BigDecimal[] { totalQty, totalCost };
    }
}
