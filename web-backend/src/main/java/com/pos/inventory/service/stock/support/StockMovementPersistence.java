package com.pos.inventory.service.stock.support;

import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.repository.StockMovementRepository;
import com.pos.service.event.PosDomainEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockMovementPersistence {

    private final StockMovementRepository stockMovementRepository;
    private final PosDomainEventService posDomainEventService;

    public StockMovement save(StockMovement movement) {
        return save(movement, null);
    }

    public StockMovement save(StockMovement movement, String referenceNumber) {
        StockMovement saved = stockMovementRepository.save(movement);
        posDomainEventService.publishStockMovementAfterCommit(saved, referenceNumber);
        return saved;
    }
}
