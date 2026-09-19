package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.sales.repository.SaleItemLotRepository;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Снимает партии, уже записанные отдельной транзакцией (проведение упало после post).
 * Своя транзакция — откат внешнего activate не возвращает партии обратно.
 */
@Component
public class PharmacyReceiptLotDetach {

    private final StockLotRepository stockLotRepository;
    private final SaleItemLotRepository saleItemLotRepository;
    private final PharmacyReceiptStockReversal stockReversal;
    private final TransactionTemplate transactionTemplate;

    public PharmacyReceiptLotDetach(
        StockLotRepository stockLotRepository,
        SaleItemLotRepository saleItemLotRepository,
        PharmacyReceiptStockReversal stockReversal,
        PlatformTransactionManager transactionManager
    ) {
        this.stockLotRepository = stockLotRepository;
        this.saleItemLotRepository = saleItemLotRepository;
        this.stockReversal = stockReversal;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void detachLotsForLines(Integer storeId, Collection<UUID> lineIds) {
        if (storeId == null || lineIds == null || lineIds.isEmpty()) {
            return;
        }
        transactionTemplate.executeWithoutResult(status -> doDetach(storeId, lineIds));
    }

    private void doDetach(Integer storeId, Collection<UUID> lineIds) {
        List<StockLot> lots = stockLotRepository.findByReceiptLineIds(lineIds);
        if (lots.isEmpty()) {
            return;
        }
        Map<UUID, Product> products = new HashMap<>();
        Map<UUID, BigDecimal> quantities = new HashMap<>();
        for (StockLot lot : lots) {
            Product product = lot.getProduct();
            if (product == null || product.getId() == null) {
                continue;
            }
            products.putIfAbsent(product.getId(), product);
            quantities.merge(product.getId(), QuantityUtil.normalize(lot.getQuantity()), QuantityUtil::add);
        }
        stockReversal.reverse(storeId, products, quantities);
        List<UUID> lotIds = lots.stream().map(StockLot::getId).toList();
        saleItemLotRepository.detachLots(lotIds);
        stockLotRepository.deleteAll(lots);
        stockLotRepository.flush();
    }
}
