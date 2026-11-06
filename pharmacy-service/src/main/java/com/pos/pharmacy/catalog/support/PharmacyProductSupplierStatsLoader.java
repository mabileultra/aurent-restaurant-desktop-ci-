package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.dto.PharmacyProductReceiptStat;
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

/** Карточки фильтра «Товары»: поставщики с приходов, иначе — сами приходы. */
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

        List<PharmacyProductSupplierStat> suppliers = loadSuppliers(companyId);
        List<PharmacyProductReceiptStat> receipts = suppliers.isEmpty()
            ? loadReceipts(companyId)
            : List.of();
        return new PharmacyProductSupplierStatsResponse(total, active, suppliers, receipts);
    }

    private List<PharmacyProductSupplierStat> loadSuppliers(Integer companyId) {
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
            long count = asLong(row[1]);
            String name = names.get(supplierId);
            suppliers.add(new PharmacyProductSupplierStat(
                supplierId,
                name != null && !name.isBlank() ? name : String.valueOf(supplierId),
                count
            ));
        }
        return suppliers;
    }

    private List<PharmacyProductReceiptStat> loadReceipts(Integer companyId) {
        List<Object[]> rows = stockReceiptLineRepository.countDistinctProductsByReceipt(companyId);
        List<PharmacyProductReceiptStat> receipts = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            if (row == null || row.length < 5 || row[0] == null) {
                continue;
            }
            receipts.add(new PharmacyProductReceiptStat(
                (UUID) row[0],
                row[1] != null ? String.valueOf(row[1]) : String.valueOf(row[0]),
                row[2] != null ? String.valueOf(row[2]) : "",
                row[3] != null ? String.valueOf(row[3]) : "",
                asLong(row[4])
            ));
        }
        return receipts;
    }

    private static long asLong(Object value) {
        return value instanceof Number n ? n.longValue() : 0L;
    }
}
