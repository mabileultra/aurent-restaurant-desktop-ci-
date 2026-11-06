package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyTransferErrors;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.domain.StockReceiptStatus;
import com.pos.pharmacy.warehouse.dto.CreatePharmacyTransferFromReceiptRequest;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.entity.StockTransfer;
import com.pos.pharmacy.warehouse.entity.StockTransferLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import com.pos.pharmacy.warehouse.repository.StockTransferRepository;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Перенос остатка проведённого прихода на другой филиал:
 * store_stock + партиии (lots) + марки прихода.
 */
@Component
@RequiredArgsConstructor
public class PharmacyTransferFromReceiptWriter {

    private final StockReceiptRepository stockReceiptRepository;
    private final StockLotRepository stockLotRepository;
    private final StockTransferRepository stockTransferRepository;
    private final StockMarkRepository stockMarkRepository;
    private final StoreStockService storeStockService;
    private final PharmacyReceiptStockIncrease stockIncrease;
    private final PharmacyTransferNumberAllocator numberAllocator;

    @Transactional
    public StockTransfer create(Integer companyId, UUID userId, CreatePharmacyTransferFromReceiptRequest request) {
        if (request.toStoreId() == null) {
            throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_TO_STORE_REQUIRED);
        }
        StockReceipt receipt = stockReceiptRepository.findDetailedById(request.receiptId())
            .orElseThrow(() -> PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_NOT_FOUND, request.receiptId()));
        if (!companyId.equals(receipt.getCompanyId())) {
            throw PharmacyErrors.notFound(PharmacyReceiptErrors.PHARM_RECEIPT_NOT_FOUND, request.receiptId());
        }
        if (!StockReceiptStatus.POSTED.equalsIgnoreCase(receipt.getStatus())) {
            throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_RECEIPT_NOT_POSTED);
        }
        Integer fromStoreId = receipt.getStoreId();
        Integer toStoreId = request.toStoreId();
        if (fromStoreId.equals(toStoreId)) {
            throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_SAME_STORE);
        }

        List<UUID> lineIds = receipt.getLines().stream()
            .map(StockReceiptLine::getId)
            .filter(id -> id != null)
            .toList();
        List<StockLot> lots = lineIds.isEmpty()
            ? List.of()
            : stockLotRepository.findByReceiptLineIds(lineIds).stream()
                .filter(lot -> fromStoreId.equals(lot.getStoreId()))
                .filter(lot -> QuantityUtil.normalize(lot.getQuantity()).signum() > 0)
                .toList();
        if (lots.isEmpty()) {
            throw PharmacyErrors.of(PharmacyTransferErrors.PHARM_TRANSFER_EMPTY);
        }

        Map<UUID, BigDecimal> qtyByProduct = new LinkedHashMap<>();
        Map<UUID, Product> products = new HashMap<>();
        Map<UUID, String> names = new HashMap<>();
        Map<UUID, String> skus = new HashMap<>();
        for (StockLot lot : lots) {
            Product product = lot.getProduct();
            UUID productId = product.getId();
            qtyByProduct.merge(productId, QuantityUtil.normalize(lot.getQuantity()), QuantityUtil::add);
            products.put(productId, product);
            names.putIfAbsent(productId, product.getName());
            skus.putIfAbsent(productId, product.getSku());
        }

        storeStockService.decreaseAll(fromStoreId, products, qtyByProduct);
        stockIncrease.increase(toStoreId, products, qtyByProduct);

        for (StockLot lot : lots) {
            lot.setStoreId(toStoreId);
        }
        stockLotRepository.saveAll(lots);

        List<StockMark> marks = stockMarkRepository.findByReceiptIdAndStoreId(receipt.getId(), fromStoreId);
        List<StockMark> movableMarks = marks.stream()
            .filter(mark -> mark.getStatus() == StockMarkStatus.IN_STOCK || mark.getStatus() == null)
            .collect(Collectors.toCollection(ArrayList::new));
        for (StockMark mark : movableMarks) {
            mark.setStoreId(toStoreId);
        }
        if (!movableMarks.isEmpty()) {
            stockMarkRepository.saveAll(movableMarks);
        }

        BigDecimal totalQty = qtyByProduct.values().stream()
            .reduce(BigDecimal.ZERO, QuantityUtil::add);

        StockTransfer transfer = StockTransfer.builder()
            .companyId(companyId)
            .transferNumber(numberAllocator.next())
            .fromStoreId(fromStoreId)
            .toStoreId(toStoreId)
            .fromStoreName(blankToNull(request.fromStoreName()))
            .toStoreName(blankToNull(request.toStoreName()))
            .sourceReceiptId(receipt.getId())
            .sourceReceiptNumber(receipt.getReceiptNumber())
            .notes(blankToNull(request.notes()))
            .totalQuantity(totalQty)
            .createdBy(userId)
            .build();

        List<StockTransferLine> lines = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : qtyByProduct.entrySet()) {
            lines.add(StockTransferLine.builder()
                .transfer(transfer)
                .productId(entry.getKey())
                .productName(names.get(entry.getKey()))
                .productSku(skus.get(entry.getKey()))
                .quantity(entry.getValue())
                .build());
        }
        transfer.setLines(lines);
        return stockTransferRepository.save(transfer);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
