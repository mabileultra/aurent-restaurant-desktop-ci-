package com.pos.inventory.service.stock.support;

import com.pos.inventory.dto.warehouse.StockReceiptLineResponse;
import com.pos.inventory.entity.StockReceiptLine;
import org.springframework.stereotype.Component;

@Component
public class StockReceiptLineMapper {

    public StockReceiptLineResponse toResponse(StockReceiptLine line) {
        return new StockReceiptLineResponse(
            line.getId(),
            line.getProductId(),
            line.getProductName(),
            line.getProductSku(),
            line.getQuantity(),
            line.getPurchasePrice(),
            line.getUnitSellingPrice(),
            line.getLineCost()
        );
    }
}
