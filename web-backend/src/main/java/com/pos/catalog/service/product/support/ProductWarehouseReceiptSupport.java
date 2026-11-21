package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.inventory.repository.StockReceiptLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductWarehouseReceiptSupport {

    private final StockReceiptLineRepository stockReceiptLineRepository;
    private final ProductResponseAssembler assembler;

    public List<UUID> productIdsForReceiptFilter(Integer companyId, String receiptNumber) {
        if (companyId == null || !StringUtils.hasText(receiptNumber)) {
            return null;
        }
        String pattern = "%" + receiptNumber.trim() + "%";
        return stockReceiptLineRepository.findProductIdsByReceiptNumberContains(companyId, pattern);
    }

    public List<ProductResponse> withLatestReceiptNumbers(
        Integer companyId,
        Collection<ProductResponse> rows
    ) {
        if (companyId == null || rows == null || rows.isEmpty()) {
            return rows == null ? List.of() : List.copyOf(rows);
        }
        List<UUID> ids = rows.stream().map(ProductResponse::id).distinct().toList();
        Map<UUID, String> byProduct = new HashMap<>();
        for (Object[] row : stockReceiptLineRepository.findLatestReceiptNumberByProductIds(companyId, ids)) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            byProduct.put((UUID) row[0], String.valueOf(row[1]));
        }
        return rows.stream()
            .map(row -> assembler.withLastReceiptNumber(row, byProduct.get(row.id())))
            .toList();
    }
}
