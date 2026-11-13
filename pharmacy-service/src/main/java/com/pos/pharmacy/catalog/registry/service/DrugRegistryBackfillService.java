package com.pos.pharmacy.catalog.registry.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryCardFill;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.security.PharmacyTenantContext;
import com.pos.pharmacy.support.PharmacyParallelTasks;
import com.pos.pharmacy.warehouse.support.PharmacyMassExecutor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class DrugRegistryBackfillService {

    private static final int PAGE = 200;

    private final ProductRepository products;
    private final DrugRegistryCardFill cardFill;
    private final PharmacyMassExecutor massExecutor;

    public int fillExisting() {
        Integer companyId = PharmacyTenantContext.getCompanyId();
        UUID userId = PharmacyTenantContext.getUserId();
        String role = PharmacyTenantContext.getRole();
        int filled = 0;
        int page = 0;
        Page<Product> slice;
        do {
            slice = products.findAll(PageRequest.of(page, PAGE));
            List<Product> content = slice.getContent();
            if (!content.isEmpty()) {
                List<Supplier<Integer>> tasks = new ArrayList<>(content.size());
                for (Product product : content) {
                    tasks.add(() -> applyOne(product, companyId, userId, role));
                }
                for (Integer hit : PharmacyParallelTasks.supplyAll(tasks, massExecutor.executor())) {
                    filled += hit == null ? 0 : hit;
                }
            }
            page++;
        } while (slice.hasNext());
        return filled;
    }

    private int applyOne(Product product, Integer companyId, UUID userId, String role) {
        PharmacyTenantContext.set(companyId, userId, role);
        try {
            return cardFill.applyMissing(product.getId(), product.getName()) ? 1 : 0;
        } finally {
            PharmacyTenantContext.clear();
        }
    }
}
