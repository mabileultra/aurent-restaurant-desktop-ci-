package com.pos.pharmacy.revenue.support;

import com.pos.pharmacy.revenue.service.PharmacyRevenuePublicationService;
import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RefundedSaleFactsRepublisher {

    private static final int PAGE_SIZE = 100;

    private final SaleRepository saleRepository;
    private final PharmacyRevenuePublicationService revenuePublicationService;

    @EventListener(ApplicationReadyEvent.class)
    public void republish() {
        int page = 0;
        long published = 0;
        Page<Sale> batch;
        do {
            batch = saleRepository.findByStatusIn(
                List.of(SaleEnums.SaleStatus.REFUNDED, SaleEnums.SaleStatus.VOIDED),
                PageRequest.of(page, PAGE_SIZE)
            );
            for (Sale sale : batch.getContent()) {
                revenuePublicationService.onSaleCompleted(sale, Map.of(), null);
                published++;
            }
            page++;
        } while (batch.hasNext());
        if (published > 0) {
            LogUtil.info(
                RefundedSaleFactsRepublisher.class,
                "Republished refunded pharmacy sales so reports use net amounts: count={}",
                published
            );
        }
    }
}
