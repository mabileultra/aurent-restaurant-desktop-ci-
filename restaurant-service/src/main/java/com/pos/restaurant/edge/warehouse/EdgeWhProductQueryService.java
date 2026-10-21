package com.pos.restaurant.edge.warehouse;

import com.pos.restaurant.edge.entity.EdgeProduct;
import com.pos.restaurant.edge.repository.EdgeProductRepository;
import com.pos.restaurant.edge.warehouse.support.EdgeWhResponses;
import com.pos.restaurant.edge.warehouse.support.EdgeWhTenant;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeWhProductQueryService {

    private final EdgeProductRepository productRepository;
    private final EdgeWhTenant tenant;
    private final EdgeWhResponses responses;

    @Transactional(readOnly = true)
    public Map<String, Object> list(
        String search, String barcode, Boolean marked, Integer storeId, Pageable pageable
    ) {
        Integer companyId = tenant.requireCompany();
        Integer sid = tenant.resolveStore(storeId, companyId);
        if (sid == null) return responses.emptyPage(pageable);
        String q = StringUtils.hasText(search) ? search.trim() : null;
        String bc = StringUtils.hasText(barcode) ? barcode.trim() : null;
        Page<EdgeProduct> page = productRepository.searchWarehouse(
            companyId, sid, q, bc, marked, true, pageable
        );
        return responses.page(page.getContent().stream().map(responses::product).toList(), page);
    }
}
