package com.pos.inventory.service.stock.impl;

import com.pos.catalog.entity.Product;
import com.pos.catalog.service.product.support.CatalogGroceryStockQuerySupport;
import com.pos.catalog.service.product.support.StockRetailValueMath;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.inventory.service.stock.LiveStockReportService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.LiveStockBalanceRowMapper;
import com.pos.inventory.service.stock.support.LiveStockLowStockAssembler;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LiveStockReportServiceImpl implements LiveStockReportService {

    private final CatalogGroceryStockQuerySupport catalogGroceryStockQuery;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;
    private final LiveStockLowStockAssembler liveStockLowStockAssembler;

    @Override
    public PageResponse<StockBalanceRowResponse> balances(
        Integer storeId,
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        List<Product> products = catalogGroceryStockQuery.findActiveForBalanceReport(
            companyId, search, categoryId, storeId
        );
        List<UUID> ids = products.stream().map(Product::getId).toList();
        Map<UUID, BigDecimal> liveQty = storeId != null
            ? storeStockService.getQuantities(ids, storeId)
            : storeStockService.sumQuantities(ids);
        Map<UUID, Instant> updatedAt = storeStockService.maxUpdatedAt(ids, storeId);

        List<StockBalanceRowResponse> rows = new ArrayList<>();
        for (Product product : products) {
            BigDecimal raw = liveQty.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal qty = StockRetailValueMath.displayQty(raw);
            if (onlyWithStock && qty.signum() <= 0) {
                continue;
            }
            rows.add(LiveStockBalanceRowMapper.toBalance(
                product,
                raw,
                updatedAt.get(product.getId())
            ));
        }
        return PageResponse.from(toPage(rows, pageable));
    }

    @Override
    public PageResponse<LowStockRowResponse> lowStock(Integer storeId, Pageable pageable) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        List<LowStockRowResponse> rows = liveStockLowStockAssembler.assemble(companyId, storeId);
        return PageResponse.from(toPage(rows, pageable));
    }

    private static <T> Page<T> toPage(List<T> rows, Pageable pageable) {
        int start = (int) Math.min(pageable.getOffset(), rows.size());
        int end = Math.min(start + pageable.getPageSize(), rows.size());
        return new PageImpl<>(rows.subList(start, end), pageable, rows.size());
    }
}
