package com.pos.inventory.service.stock.support;

import com.pos.dto.shared.PageResponse;
import com.pos.exception.PosExceptions;
import com.pos.inventory.dto.warehouse.StockReceiptLineResponse;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.repository.StockReceiptLineRepository;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.api.PageLimits;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class StockReceiptLineQuerySupport {

    private final StockReceiptRepository stockReceiptRepository;
    private final StockReceiptLineRepository stockReceiptLineRepository;
    private final StockReceiptLineMapper lineMapper;
    private final TenantAccessSupport tenantAccess;

    public PageResponse<StockReceiptLineResponse> listLines(UUID receiptId, Pageable pageable) {
        requireAccessibleHeader(receiptId);
        Pageable bounded = PageRequest.of(
            PageLimits.normalizePage(pageable.getPageNumber()),
            PageLimits.normalizeSize(pageable.getPageSize()),
            pageable.getSort()
        );
        return PageResponse.from(
            stockReceiptLineRepository.findPageByReceiptId(receiptId, bounded).map(lineMapper::toResponse)
        );
    }

    private StockReceipt requireAccessibleHeader(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findHeaderById(id)
            .orElseThrow(() -> PosExceptions.notFound("Receipt"));
        if (receipt.getStore() != null) {
            tenantAccess.assertCanAccessStore(receipt.getStore());
        }
        return receipt;
    }
}
