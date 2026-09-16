package com.pos.sales.service.report.support;

import com.pos.sales.entity.Sale;
import com.pos.sales.repository.SaleRepository;
import com.pos.service.event.PosDomainEventService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RefundedSaleFactsRepublisher {

    private static final int PAGE_SIZE = 100;

    private final SaleRepository saleRepository;
    private final PosDomainEventService posDomainEventService;

    @EventListener(ApplicationReadyEvent.class)
    public void republish() {
        int page = 0;
        long published = 0;
        Page<Sale> batch;
        do {
            batch = saleRepository.findByStatusIn(
                List.of(Sale.SaleStatus.REFUNDED, Sale.SaleStatus.VOIDED),
                PageRequest.of(page, PAGE_SIZE)
            );
            for (Sale sale : batch.getContent()) {
                posDomainEventService.publishSaleCompletedAfterCommit(sale);
                published++;
            }
            page++;
        } while (batch.hasNext());
        if (published > 0) {
            LogUtil.info(
                RefundedSaleFactsRepublisher.class,
                "Republished refunded sales so reports use net amounts: count={}",
                published
            );
        }
    }
}
