package com.pos.pharmacy.catalog.registry.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.registry.support.DrugRegistryCardFill;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DrugRegistryBackfillService {

    private static final int PAGE = 200;

    private final ProductRepository products;
    private final DrugRegistryCardFill cardFill;

    public int fillExisting() {
        int filled = 0;
        int page = 0;
        Page<Product> slice;
        do {
            slice = products.findAll(PageRequest.of(page, PAGE));
            for (Product product : slice.getContent()) {
                if (cardFill.applyMissing(product.getId(), product.getName())) {
                    filled++;
                }
            }
            page++;
        } while (slice.hasNext());
        return filled;
    }
}
