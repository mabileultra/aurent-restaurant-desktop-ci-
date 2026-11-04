package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.dto.PharmacyProductSupplierStat;
import com.pos.pharmacy.catalog.dto.PharmacyProductSupplierStatsResponse;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.warehouse.entity.Supplier;
import com.pos.pharmacy.warehouse.repository.StockReceiptLineRepository;
import com.pos.pharmacy.warehouse.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Карточки поставщиков для фильтра «Товары»: счётчики из pharmacy приходов. */
@Component
@RequiredArgsConstructor
public class PharmacyProductSupplierStatsLoader {

    private final TenantSupport tenant;
    private final ProductRepository productRepository;
    private final StockReceiptLineRepository stockReceiptLineRepository;
    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public PharmacyProductSupplierStatsResponse load() {
        Integer companyId = tenant.requireCompanyId();
        long total = productRepository.countByCompanyId(companyId);
        long active = productRepository.countByCompanyIdAndActive(companyId, true);

        List<Object[]> rows = stockReceiptLineRepository.countDistinctProductsBySupplier(companyId);
        Set<UUID> supplierIds = new HashSet<>();
        List<Object[]> ordered = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }
            UUID supplierId = (UUID) row[0];
            supplierIds.add(supplierId);
            ordered.add(row);
        }

        Map<UUID, String> names = new HashMap<>();
        if (!supplierIds.isEmpty()) {
            for (Supplier supplier : supplierRepository.findAllById(supplierIds)) {
                if (supplier.getId() != null) {
                    names.put(supplier.getId(), supplier.getName());
                }
            }
        }

        List<PharmacyProductSupplierStat> suppliers = new ArrayList<>(ordered.size());
        for (Object[] row : ordered) {
            UUID supplierId = (UUID) row[0];
            long count = row[1] instanceof Number n ? n.longValue() : 0L;
            String name = names.get(supplierId);
            suppliers.add(new PharmacyProductSupplierStat(
                supplierId,
                name != null && !name.isBlank() ? name : String.valueOf(supplierId),
                count
            ));
        }
        return new PharmacyProductSupplierStatsResponse(total, active, suppliers);
    }
}
