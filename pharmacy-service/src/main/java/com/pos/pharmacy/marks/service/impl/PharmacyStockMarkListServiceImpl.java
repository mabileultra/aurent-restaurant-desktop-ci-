package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.common.PageResponse;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.marks.dto.StockMarkListItemResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.service.PharmacyStockMarkListService;
import com.pos.pharmacy.marks.support.StockMarkMonitorAttention;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyStockMarkListServiceImpl implements PharmacyStockMarkListService {

    private final StockMarkRepository stockMarkRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockMarkListItemResponse> list(
        Integer storeId,
        StockMarkStatus status,
        UUID shiftId,
        Instant soldFrom,
        Instant soldTo,
        String search,
        boolean problemsOnly,
        Pageable pageable
    ) {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        if (companyId == null) {
            throw PharmacyErrors.badRequest("Компания не определена");
        }

        String q = StringUtils.hasText(search) ? search.trim() : null;
        Pageable page = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<StockMark> result = stockMarkRepository.searchForMonitor(
            companyId,
            storeId,
            status,
            shiftId,
            soldFrom,
            soldTo,
            q,
            problemsOnly,
            page
        );

        Map<UUID, String> productNames = loadProductNames(result.getContent());
        Map<UUID, String> receiptNumbers = loadReceiptNumbers(companyId, result.getContent());

        List<StockMarkListItemResponse> content = result.getContent().stream()
            .map(row -> toItem(row, productNames, receiptNumbers))
            .toList();

        long attention = content.stream().filter(StockMarkListItemResponse::needsAttention).count();
        LogUtil.info(
            PharmacyStockMarkListServiceImpl.class,
            "ASL monitor list companyId={} storeId={} status={} shiftId={} problemsOnly={} page={}/{} total={} attentionOnPage={}",
            companyId,
            storeId,
            status,
            shiftId,
            problemsOnly,
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            attention
        );

        return new PageResponse<>(
            content,
            result.getTotalPages(),
            result.getTotalElements(),
            result.getSize(),
            result.getNumber()
        );
    }

    private Map<UUID, String> loadProductNames(List<StockMark> rows) {
        Set<UUID> ids = rows.stream().map(StockMark::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> out = new HashMap<>();
        for (Product product : productRepository.findAllById(ids)) {
            out.put(product.getId(), product.getName());
        }
        return out;
    }

    private Map<UUID, String> loadReceiptNumbers(Integer companyId, List<StockMark> rows) {
        Set<UUID> saleIds = rows.stream().map(StockMark::getSaleId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (saleIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> out = new HashMap<>();
        for (Sale sale : saleRepository.findAllById(saleIds)) {
            if (companyId.equals(sale.getCompanyId()) && sale.getReceiptNumber() != null) {
                out.put(sale.getId(), sale.getReceiptNumber());
            }
        }
        return out;
    }

    private static StockMarkListItemResponse toItem(
        StockMark row,
        Map<UUID, String> productNames,
        Map<UUID, String> receiptNumbers
    ) {
        boolean needsAttention = StockMarkMonitorAttention.needsAttention(row);
        return new StockMarkListItemResponse(
            row.getId(),
            row.getStoreId(),
            row.getProductId(),
            productNames.get(row.getProductId()),
            row.getMarkCode(),
            row.getStatus(),
            row.getAslStatus(),
            row.getSaleId(),
            row.getSaleId() != null ? receiptNumbers.get(row.getSaleId()) : null,
            row.getSoldAt(),
            row.getWithdrawAttempts(),
            row.getLastWithdrawAt(),
            row.getLastWithdrawError(),
            row.getUpdatedAt(),
            needsAttention
        );
    }
}
