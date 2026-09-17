package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.sales.repository.SaleItemLotRepository;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Списывает остаток проведённой фактуры и удаляет документ вместе с партиями. */
@Component
public class PharmacyReceiptDeletion {

    private final StockLotRepository stockLotRepository;
    private final SaleItemLotRepository saleItemLotRepository;
    private final StoreStockService storeStockService;
    private final StockReceiptRepository stockReceiptRepository;

    public PharmacyReceiptDeletion(
        StockLotRepository stockLotRepository,
        SaleItemLotRepository saleItemLotRepository,
        StoreStockService storeStockService,
        StockReceiptRepository stockReceiptRepository
    ) {
        this.stockLotRepository = stockLotRepository;
        this.saleItemLotRepository = saleItemLotRepository;
        this.storeStockService = storeStockService;
        this.stockReceiptRepository = stockReceiptRepository;
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
        for (StockLot lot : lots) {
            storeStockService.decrease(lot.getProduct(), lot.getStoreId(), lot.getQuantity());
            if (lot.getReceiptLine() != null) {
                covered.add(lot.getReceiptLine().getId());
            }
        }
        for (StockReceiptLine line : receipt.getLines()) {
            if (line.getId() != null && !covered.contains(line.getId())) {
                storeStockService.decrease(line.getProduct(), receipt.getStoreId(), line.getQuantity());
            }
        }
        List<UUID> lotIds = lots.stream().map(StockLot::getId).toList();
        if (lotIds.isEmpty()) {
            return;
        }
        saleItemLotRepository.detachLots(lotIds);
        stockLotRepository.deleteAll(lots);
        stockLotRepository.flush();
    }
}
