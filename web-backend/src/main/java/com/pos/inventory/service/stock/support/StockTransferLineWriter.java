package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.ProductQuantityRulesResolver;
import com.pos.inventory.dto.warehouse.StockTransferLineRequest;
import com.pos.inventory.entity.StockTransfer;
import com.pos.inventory.entity.StockTransferLine;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.QuantityUtil;
import com.pos.util.QuantityValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Пишет строки черновика перемещения без движения склада. */
@Component
@RequiredArgsConstructor
public class StockTransferLineWriter {

    private final StockDocumentSupport stockDocument;
    private final TenantAccessSupport tenantAccess;

    public BigDecimal replaceLines(StockTransfer transfer, List<StockTransferLineRequest> lineReqs) {
        stockDocument.requireLines(lineReqs);
        BigDecimal totalQty = BigDecimal.ZERO;
        List<StockTransferLine> lines = new ArrayList<>();
        for (StockTransferLineRequest lineReq : lineReqs) {
            Product product = stockDocument.requireActiveGroceryProduct(lineReq.productId());
            tenantAccess.assertProductBelongsToTenant(product);
            BigDecimal q = QuantityUtil.normalize(lineReq.quantity());
            stockDocument.requirePositiveQuantity(q);
            QuantityValidator.validate(ProductQuantityRulesResolver.fromProduct(product), q);
            var card = StockLineCatalogSnapshot.Card.of(product);
            lines.add(StockTransferLine.builder()
                .transfer(transfer)
                .productId(card.productId())
                .productName(card.productName())
                .productSku(card.productSku())
                .quantity(q)
                .build());
            totalQty = QuantityUtil.add(totalQty, q);
        }
        transfer.getLines().clear();
        transfer.getLines().addAll(lines);
        transfer.setTotalQuantity(totalQty);
        return totalQty;
    }
}
