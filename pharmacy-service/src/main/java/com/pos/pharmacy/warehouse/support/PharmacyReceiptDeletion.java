package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.sales.repository.SaleItemLotRepository;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Списывает остаток проведённой фактуры и удаляет документ вместе с партиями. */
@Component
public class PharmacyReceiptDeletion {

    private final StockLotRepository stockLotRepository;
    private final SaleItemLotRepository saleItemLotRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final PharmacyReceiptStockReversal stockReversal;

    public PharmacyReceiptDeletion(
        StockLotRepository stockLotRepository,
        SaleItemLotRepository saleItemLotRepository,
        StockReceiptRepository stockReceiptRepository,
        PharmacyReceiptStockReversal stockReversal
    ) {
        this.stockLotRepository = stockLotRepository;
        this.saleItemLotRepository = saleItemLotRepository;
        this.stockReceiptRepository = stockReceiptRepository;
        this.stockReversal = stockReversal;
    }

    public void delete(StockReceipt receipt) {
        if (StockReceiptStatus.POSTED.equals(receipt.getStatus())) {
            reversePostedStock(receipt);
        }
        receipt.getLines().clear();
        stockReceiptRepository.delete(receipt);
    }

    private void reversePostedStock(StockReceipt receipt) {
        List<UUID> lineIds = receipt.getLines().stream()
            .map(StockReceiptLine::getId)
            .filter(id -> id != null)
            .toList();
        if (lineIds.isEmpty()) {
            return;
        }
        List<StockLot> lots = stockLotRepository.findByReceiptLineIds(lineIds);
        Set<UUID> covered = new HashSet<>();
        Map<UUID, Product> products = new HashMap<>();
        Map<UUID, BigDecimal> quantities = new HashMap<>();
        for (StockLot lot : lots) {
            addQuantity(products, quantities, lot.getProduct(), lot.getQuantity());
            if (lot.getReceiptLine() != null) {
                covered.add(lot.getReceiptLine().getId());
            }
        }
        for (StockReceiptLine line : receipt.getLines()) {
            if (line.getId() != null && !covered.contains(line.getId())) {
                addQuantity(products, quantities, line.getProduct(), line.getQuantity());
            }
        }
        stockReversal.reverse(receipt.getStoreId(), products, quantities);
        List<UUID> lotIds = lots.stream().map(StockLot::getId).toList();
        if (lotIds.isEmpty()) {
            return;
        }
        saleItemLotRepository.detachLots(lotIds);
        stockLotRepository.deleteAll(lots);
        stockLotRepository.flush();
    }

    private static void addQuantity(
        Map<UUID, Product> products,
        Map<UUID, BigDecimal> quantities,
        Product product,
        BigDecimal quantity
    ) {
        if (product == null || product.getId() == null) {
            return;
        }
        products.putIfAbsent(product.getId(), product);
        quantities.merge(product.getId(), QuantityUtil.normalize(quantity), QuantityUtil::add);
    }
}
