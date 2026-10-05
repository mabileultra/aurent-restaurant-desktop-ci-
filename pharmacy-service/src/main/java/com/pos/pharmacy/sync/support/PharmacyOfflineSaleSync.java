package com.pos.pharmacy.sync.support;

import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.sales.service.PharmacySaleCheckoutService;
import com.pos.pharmacy.sales.support.OfflineSaleContext;
import com.pos.pharmacy.sync.dto.OfflineSaleSyncItem;
import com.pos.pharmacy.sync.dto.OfflineSaleSyncResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Одна офлайн-продажа в своей транзакции. Исключение должно выйти наружу:
 * перехват внутри этой транзакции помечает её rollback-only и роняет весь пакет 500.
 */
@Component
@RequiredArgsConstructor
public class PharmacyOfflineSaleSync {

    private final SaleRepository saleRepository;
    private final PharmacySaleCheckoutService checkoutService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OfflineSaleSyncResult sync(OfflineSaleSyncItem item, UUID cashierId) {
        return saleRepository.findByClientSaleId(item.clientSaleId())
            .map(existing -> new OfflineSaleSyncResult(
                item.clientSaleId(),
                existing.getId(),
                existing.getReceiptNumber(),
                "ALREADY_EXISTS",
                null
            ))
            .orElseGet(() -> create(item, cashierId));
    }

    private OfflineSaleSyncResult create(OfflineSaleSyncItem item, UUID cashierId) {
        OfflineSaleContext offline = new OfflineSaleContext(
            item.clientSaleId(),
            item.offlineDeviceId(),
            item.createdAt()
        );
        SaleResponse created = checkoutService.processSale(item.sale(), cashierId, offline);
        return new OfflineSaleSyncResult(
            item.clientSaleId(),
            created.id(),
            created.receiptNumber(),
            "CREATED",
            null
        );
    }
}
