package com.pos.sales.service.sale.impl;

import com.pos.sales.dto.sale.SaleResponse;
import com.pos.entity.Product;
import com.pos.sales.entity.Sale;
import com.pos.domain.StockMovementType;
import com.pos.inventory.entity.StockMovement;
import com.pos.exception.PosExceptions;
import com.pos.sales.mapper.SaleMapper;
import com.pos.repository.ProductRepository;
import com.pos.sales.repository.SaleRepository;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.integrations.finance.service.FinanceReturnIntegrationService;
import com.pos.service.event.PosDomainEventService;
import com.pos.sales.service.sale.SaleAccessPolicy;
import com.pos.sales.service.sale.SaleVoidService;
import com.pos.sales.service.salesledger.SalesLedgerCacheService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.shared.log.LogUtil;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleVoidServiceImpl implements SaleVoidService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SaleAccessPolicy accessPolicy;
    private final StoreStockService storeStockService;
    private final FinanceReturnIntegrationService financeReturnIntegrationService;
    private final PosDomainEventService posDomainEventService;

    @Override
    public SaleResponse voidSale(UUID id, String reason) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> PosExceptions.notFound("Sale"));

        accessPolicy.assertCanVoid(sale);

        if (sale.getStatus() == Sale.SaleStatus.VOIDED) {
            throw PosExceptions.badRequest("Sale already voided");
        }

        String r = reason != null ? reason : "";
        boolean anyRemaining = false;
        UUID returnEventId = UUID.randomUUID();
        BigDecimal refundAmount = BigDecimal.ZERO;

        for (var item : sale.getItems()) {
            BigDecimal remaining = QuantityUtil.subtract(item.getQuantity(), item.getReturnedQuantity());
            if (remaining.signum() <= 0) {
                continue;
            }
            anyRemaining = true;
            Product product = item.getProduct();
            if (sale.getStore() != null) {
                storeStockService.increase(product, sale.getStore(), remaining);
            }
            productRepository.save(product);

            item.setReturnedQuantity(item.getQuantity());
            refundAmount = refundAmount.add(SalePartialReturnServiceImpl.lineReturnAmount(item, remaining));

            stockMovementPersistence.save(StockMovement.builder()
                .product(product)
                .store(sale.getStore())
                .movementType(StockMovementType.RETURN)
                .quantity(remaining)
                .referenceId(sale.getId())
                .createdBy(sale.getCashier())
                .notes("Void: " + r)
                .build());
        }

        if (!anyRemaining && SalePartialReturnServiceImpl.allItemsFullyReturned(sale)) {
            throw PosExceptions.badRequest("Чек уже полностью возвращён");
        }

        sale.setStatus(Sale.SaleStatus.VOIDED);
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | VOID: " + r : "VOID: " + r);

        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
        financeReturnIntegrationService.onRefundCompleted(saved, returnEventId, refundAmount);
        posDomainEventService.publishSaleCompletedAfterCommit(saved);
        LogUtil.info(SaleVoidServiceImpl.class, "Sale voided: id={}, receipt={}", saved.getId(), saved.getReceiptNumber());
        return saleMapper.toResponse(saved);
    }
}
