package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockReceiptLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Цены карточки → строки черновиков прихода (имя уже из join product). */
@Component
@RequiredArgsConstructor
public class PharmacyProductDraftReceiptSync {

    private final StockReceiptLineRepository stockReceiptLineRepository;

    @Transactional
    public int syncPrices(UUID productId, BigDecimal costPrice, BigDecimal sellingPrice) {
        if (productId == null) {
            return 0;
        }
        List<StockReceiptLine> lines = stockReceiptLineRepository
            .findByProductIdAndReceiptStatus(productId, StockReceiptStatus.DRAFT);
        if (lines.isEmpty()) {
            return 0;
        }
        int changed = 0;
        for (StockReceiptLine line : lines) {
            boolean touch = false;
            if (costPrice != null && (line.getPurchasePrice() == null || line.getPurchasePrice().compareTo(costPrice) != 0)) {
                line.setPurchasePrice(costPrice);
                touch = true;
            }
            if (sellingPrice != null) {
                if (line.getRetailPrice() == null || line.getRetailPrice().compareTo(sellingPrice) != 0) {
                    line.setRetailPrice(sellingPrice);
                    touch = true;
                }
                if (line.getUnitSellingPrice() == null || line.getUnitSellingPrice().compareTo(sellingPrice) != 0) {
                    line.setUnitSellingPrice(sellingPrice);
                    touch = true;
                }
            }
            if (touch) {
                stockReceiptLineRepository.save(line);
                changed++;
            }
        }
        return changed;
    }
}
