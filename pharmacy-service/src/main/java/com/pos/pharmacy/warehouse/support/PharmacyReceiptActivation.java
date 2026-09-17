package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.PharmacyException;
import com.pos.pharmacy.util.QuantityUtil;
import com.pos.pharmacy.warehouse.entity.StockLot;
import com.pos.pharmacy.warehouse.entity.StockReceipt;
import com.pos.pharmacy.warehouse.entity.StockReceiptLine;
import com.pos.pharmacy.warehouse.repository.StockLotRepository;
import com.pos.pharmacy.warehouse.repository.StockReceiptLineRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;

/** Проводит строки фактуры пачками в нескольких потоках. Повтор не удваивает остаток. */
@Component
public class PharmacyReceiptActivation {

    private final PharmacyMassExecutor massExecutor;
    private final PharmacyReceiptStockIncrease stockIncrease;
    private final ProductRepository productRepository;
    private final StockLotRepository stockLotRepository;
    private final StockReceiptLineRepository lineRepository;
    private final TransactionTemplate transactionTemplate;

    public PharmacyReceiptActivation(
        PharmacyMassExecutor massExecutor,
        PharmacyReceiptStockIncrease stockIncrease,
        ProductRepository productRepository,
        StockLotRepository stockLotRepository,
        StockReceiptLineRepository lineRepository,
        PlatformTransactionManager transactionManager
    ) {
        this.massExecutor = massExecutor;
        this.stockIncrease = stockIncrease;
        this.productRepository = productRepository;
        this.stockLotRepository = stockLotRepository;
        this.lineRepository = lineRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
    }

    public void post(StockReceipt receipt) {
        List<List<PostLine>> buckets = buckets(receipt);
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (List<PostLine> bucket : buckets) {
            futures.add(CompletableFuture.runAsync(
                () -> transactionTemplate.executeWithoutResult(status -> postBucket(receipt.getStoreId(), bucket)),
                massExecutor.executor()
            ));
        }
        for (int i = 0; i < futures.size(); i++) {
            try {
                futures.get(i).join();
            } catch (CompletionException ex) {
                futures.forEach(future -> future.cancel(true));
                Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                if (cause instanceof PharmacyException pharmacyException) {
                    throw pharmacyException;
                }
                if (cause instanceof RuntimeException runtimeException) {
                    throw runtimeException;
                }
                throw new IllegalStateException(cause);
            }
        }
    }

    private void postBucket(Integer storeId, List<PostLine> bucket) {
        List<UUID> lineIds = bucket.stream().map(PostLine::lineId).toList();
        Set<UUID> alreadyPosted = stockLotRepository.findReceiptLineIdsWithLots(lineIds);
        List<PostLine> pending = bucket.stream()
            .filter(line -> !alreadyPosted.contains(line.lineId()))
            .toList();
        if (pending.isEmpty()) {
            return;
        }
        Map<UUID, Product> products = productRepository.findAllById(
            pending.stream().map(PostLine::productId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Product::getId, product -> product));
        Map<UUID, BigDecimal> quantities = new HashMap<>();
        for (PostLine line : pending) {
            Product product = products.get(line.productId());
            if (product == null) {
                throw PharmacyErrors.notFound("Product", line.productId());
            }
            product.setCostPrice(line.purchasePrice());
            product.setSellingPrice(line.sellingPrice());
            if (line.vatPercent() != null) {
                product.setTaxRate(line.vatPercent());
            }
            quantities.merge(product.getId(), line.quantity(), QuantityUtil::add);
        }
        stockIncrease.increase(storeId, products, quantities);
        List<StockLot> lots = new ArrayList<>();
        for (PostLine line : pending) {
            lots.add(StockLot.builder()
                .product(products.get(line.productId()))
                .storeId(storeId)
                .receiptLine(lineRepository.getReferenceById(line.lineId()))
                .batchNumber(line.batchNumber())
                .expiryDate(line.expiryDate())
                .quantity(line.quantity())
                .purchasePrice(line.purchasePrice())
                .unitSellingPrice(line.sellingPrice())
                .build());
        }
        stockLotRepository.saveAll(lots);
    }

    private static List<List<PostLine>> buckets(StockReceipt receipt) {
        Map<UUID, List<PostLine>> byProduct = new HashMap<>();
        for (StockReceiptLine line : receipt.getLines()) {
            if (line.getId() == null || line.getProduct() == null) {
                continue;
            }
            byProduct.computeIfAbsent(line.getProduct().getId(), ignored -> new ArrayList<>())
                .add(PostLine.from(line));
        }
        List<List<PostLine>> buckets = new ArrayList<>();
        for (int i = 0; i < PharmacyMassExecutor.THREADS; i++) {
            buckets.add(new ArrayList<>());
        }
        int index = 0;
        for (List<PostLine> group : byProduct.values()) {
            buckets.get(index % PharmacyMassExecutor.THREADS).addAll(group);
            index++;
        }
        buckets.removeIf(List::isEmpty);
        return buckets;
    }

    private record PostLine(
        UUID lineId,
        UUID productId,
        BigDecimal quantity,
        BigDecimal purchasePrice,
        BigDecimal sellingPrice,
        BigDecimal vatPercent,
        String batchNumber,
        LocalDate expiryDate
    ) {
        private static PostLine from(StockReceiptLine line) {
            return new PostLine(
                line.getId(),
                line.getProduct().getId(),
                QuantityUtil.normalize(line.getQuantity()),
                line.getPurchasePrice(),
                line.getUnitSellingPrice(),
                line.getVatPercent(),
                line.getBatchNumber(),
                line.getExpiryDate()
            );
        }
    }
}
